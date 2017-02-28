/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package main

import (
	"errors"
	"strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
)

// A JavaScript timer.
// From https://github.com/robertkrimen/natto
type _timer struct {
	timer    *time.Timer
	duration time.Duration
	interval bool
	call     otto.FunctionCall
}

// Composer is the chaincode class. It is an implementation of the
// Chaincode interface.
type Composer struct {
	VM            *otto.Otto
	TimerRegistry map[*_timer]*_timer
	TimerReady    chan *_timer
	Container     *Container
	Engine        *Engine
}

// NewComposer creates a new instance of the Composer chaincode class.
func NewComposer() (result *Composer) {
	logger.Debug("Entering NewComposer")
	defer func() { logger.Debug("Exiting NewComposer", result) }()

	// Create the JavaScript engine.
	result = &Composer{}
	result.createJavaScript()

	// Create the container and engine objects.
	result.Container = NewContainer(result.VM, nil)
	result.Engine = NewEngine(result.VM, result.Container)

	return result
}

// createJavaScript creates a new JavaScript virtual machine with the JavaScript code loaded.
func (composer *Composer) createJavaScript() {
	logger.Debug("Entering Composer.createJavaScript")
	defer func() { logger.Debug("Exiting Composer.createJavaScript") }()

	// Create a new JavaScript virtual machine.
	vm := otto.New()
	if vm == nil {
		panic("Failed to create JavaScript virtual machine")
	}
	composer.VM = vm

	// Register event loop functions.
	composer.registerEventLoop()

	// Register the global and window objects (which Otto does not have ...)
	_, err := vm.Run(`
		var global = Function('return this')();
		var window = global;
	`)
	if err != nil {
		panic(err)
	}

	// Execute the Babel Polyfill JavaScript source inside the JavaScript virtual machine.
	_, err = vm.Run(babelPolyfillJavaScript)
	if err != nil {
		panic(err)
	}

	// Execute the Composer JavaScript source inside the JavaScript virtual machine.
	// We trim any trailing newlines as this is required for Otto to find the source maps.
	_, err = vm.Run(strings.TrimRight(composerJavaScript, "\n"))
	if err != nil {
		panic(err)
	}

}

// registerEventLoop registers event loop support and global JavaScript functions into the JavaScript virtual machine.
// From https://github.com/robertkrimen/natto
func (composer *Composer) registerEventLoop() {
	logger.Debug("Entering Composer.registerEventLoop")
	defer func() { logger.Debug("Exiting Composer.registerEventLoop") }()

	composer.TimerRegistry = map[*_timer]*_timer{}
	composer.TimerReady = make(chan *_timer)

	newTimer := func(call otto.FunctionCall, interval bool) (*_timer, otto.Value) {
		delay, _ := call.Argument(1).ToInteger()
		if 0 >= delay {
			delay = 1
		}

		timer := &_timer{
			duration: time.Duration(delay) * time.Millisecond,
			call:     call,
			interval: interval,
		}
		composer.TimerRegistry[timer] = timer

		timer.timer = time.AfterFunc(timer.duration, func() {
			composer.TimerReady <- timer
		})

		value, err := call.Otto.ToValue(timer)
		if err != nil {
			panic(err)
		}

		return timer, value
	}

	setTimeout := func(call otto.FunctionCall) otto.Value {
		_, value := newTimer(call, false)
		return value
	}
	composer.VM.Set("setTimeout", setTimeout)

	setInterval := func(call otto.FunctionCall) otto.Value {
		_, value := newTimer(call, true)
		return value
	}
	composer.VM.Set("setInterval", setInterval)

	clearTimeout := func(call otto.FunctionCall) otto.Value {
		timer, _ := call.Argument(0).Export()
		if timer, ok := timer.(*_timer); ok {
			timer.timer.Stop()
			delete(composer.TimerRegistry, timer)
		}
		return otto.UndefinedValue()
	}
	composer.VM.Set("clearTimeout", clearTimeout)
	composer.VM.Set("clearInterval", clearTimeout)
}

// pumpEventLoop runs the event loop until no more events can occur, indicating that execution is complete.
// From https://github.com/robertkrimen/natto
func (composer *Composer) pumpEventLoop() (err error) {
	logger.Debug("Entering Composer.pumpEventLoop")
	defer func() { logger.Debug("Exiting Composer.pumpEventLoop") }()

	for {
		select {
		case timer := <-composer.TimerReady:
			var arguments []interface{}
			if len(timer.call.ArgumentList) > 2 {
				tmp := timer.call.ArgumentList[2:]
				arguments = make([]interface{}, 2+len(tmp))
				for i, value := range tmp {
					arguments[i+2] = value
				}
			} else {
				arguments = make([]interface{}, 1)
			}
			arguments[0] = timer.call.ArgumentList[0]
			_, err := composer.VM.Call(`Function.call.call`, nil, arguments...)
			if err != nil {
				for _, timer := range composer.TimerRegistry {
					timer.timer.Stop()
					delete(composer.TimerRegistry, timer)
					return err
				}
			}
			if timer.interval {
				timer.timer.Reset(timer.duration)
			} else {
				delete(composer.TimerRegistry, timer)
			}
		default:
			// Escape valve!
			// If this isn't here, we deadlock...
		}
		if len(composer.TimerRegistry) == 0 {
			break
		}
	}
	return nil
}

// handleErrorhandles an error from JavaScript converts it into a Go error.
func (composer *Composer) handleError(err error) (result error) {
	logger.Debug("Entering Composer.handleError", err)
	defer func() { logger.Debug("Exiting Composer.handleError", result) }()

	if jsError, ok := err.(*otto.Error); ok {
		return errors.New(jsError.String())
	}
	return err
}

// Init is called by the Hyperledger Fabric when the chaincode is deployed.
// Init can read from and write to the world state.
func (composer *Composer) Init(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Composer.Init", stub, function, arguments)
	defer func() { logger.Debug("Exiting Composer.Init", string(result), err) }()

	// Create all required objects.
	context := NewContext(composer.VM, composer.Engine, stub)

	// Defer to the JavaScript function.
	channel := composer.Engine.Init(context, function, arguments)

	// Pump the event loop.
	err = composer.pumpEventLoop()
	if err != nil {
		return nil, err
	}

	// Now read from the channel.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	result = data.Result
	err = data.Error
	return result, composer.handleError(err)

}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (composer *Composer) Invoke(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Composer.Invoke", stub, function, arguments)
	defer func() { logger.Debug("Exiting Composer.Invoke", string(result), err) }()

	// Create all required objects.
	context := NewContext(composer.VM, composer.Engine, stub)

	// Defer to the JavaScript function.
	channel := composer.Engine.Invoke(context, function, arguments)

	// Pump the event loop.
	err = composer.pumpEventLoop()
	if err != nil {
		return nil, composer.handleError(err)
	}

	// Now read from the channel.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	result = data.Result
	err = data.Error
	return result, composer.handleError(err)

}
