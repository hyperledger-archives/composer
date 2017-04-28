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

// Concerto is the chaincode class. It is an implementation of the
// Chaincode interface.
type Concerto struct {
	VM            *otto.Otto
	TimerRegistry map[*_timer]*_timer
	TimerReady    chan *_timer
	Container     *Container
	Engine        *Engine
}

// NewConcerto creates a new instance of the Concerto chaincode class.
func NewConcerto() (result *Concerto) {
	logger.Debug("Entering NewConcerto")
	defer func() { logger.Debug("Exiting NewConcerto", result) }()

	// Create the JavaScript engine.
	result = &Concerto{}
	result.createJavaScript()

	// Create the container and engine objects.
	result.Container = NewContainer(result.VM, nil)
	result.Engine = NewEngine(result.VM, result.Container)

	return result
}

// createJavaScript ...
func (concerto *Concerto) createJavaScript() {
	logger.Debug("Entering Concerto.createJavaScript")
	defer func() { logger.Debug("Exiting Concerto.createJavaScript") }()

	// Create a new JavaScript virtual machine.
	vm := otto.New()
	if vm == nil {
		panic("Failed to create JavaScript virtual machine")
	}
	concerto.VM = vm

	// Register event loop functions.
	concerto.registerEventLoop()

	// Register the global, window and document objects (which Otto does not have ...)
	_, err := vm.Run(`
		var global = Function('return this')();
		var window = global;
		var document = undefined;
		var navigator = undefined;
	`)
	if err != nil {
		panic(err)
	}

	// Execute the Babel Polyfill JavaScript source inside the JavaScript virtual machine.
	_, err = vm.Run(babelPolyfillJavaScript)
	if err != nil {
		panic(err)
	}

	// Execute the Concerto JavaScript source inside the JavaScript virtual machine.
	// We trim any trailing newlines as this is required for Otto to find the source maps.
	_, err = vm.Run(strings.TrimRight(concertoJavaScript, "\n"))
	if err != nil {
		panic(err)
	}

}

// registerEventLoop ...
// From https://github.com/robertkrimen/natto
func (concerto *Concerto) registerEventLoop() {
	logger.Debug("Entering Concerto.registerEventLoop")
	defer func() { logger.Debug("Exiting Concerto.registerEventLoop") }()

	concerto.TimerRegistry = map[*_timer]*_timer{}
	concerto.TimerReady = make(chan *_timer)

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
		concerto.TimerRegistry[timer] = timer

		timer.timer = time.AfterFunc(timer.duration, func() {
			concerto.TimerReady <- timer
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
	concerto.VM.Set("setTimeout", setTimeout)

	setInterval := func(call otto.FunctionCall) otto.Value {
		_, value := newTimer(call, true)
		return value
	}
	concerto.VM.Set("setInterval", setInterval)

	clearTimeout := func(call otto.FunctionCall) otto.Value {
		timer, _ := call.Argument(0).Export()
		if timer, ok := timer.(*_timer); ok {
			timer.timer.Stop()
			delete(concerto.TimerRegistry, timer)
		}
		return otto.UndefinedValue()
	}
	concerto.VM.Set("clearTimeout", clearTimeout)
	concerto.VM.Set("clearInterval", clearTimeout)
}

// pumpEventLoop ...
// From https://github.com/robertkrimen/natto
func (concerto *Concerto) pumpEventLoop() (err error) {
	logger.Debug("Entering Concerto.pumpEventLoop")
	defer func() { logger.Debug("Exiting Concerto.pumpEventLoop") }()

	for {
		select {
		case timer := <-concerto.TimerReady:
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
			_, err := concerto.VM.Call(`Function.call.call`, nil, arguments...)
			if err != nil {
				for _, timer := range concerto.TimerRegistry {
					timer.timer.Stop()
					delete(concerto.TimerRegistry, timer)
					return err
				}
			}
			if timer.interval {
				timer.timer.Reset(timer.duration)
			} else {
				delete(concerto.TimerRegistry, timer)
			}
		default:
			// Escape valve!
			// If this isn't here, we deadlock...
		}
		if len(concerto.TimerRegistry) == 0 {
			break
		}
	}
	return nil
}

// handleError ...
func (concerto *Concerto) handleError(err error) (result error) {
	logger.Debug("Entering Concerto.handleError", err)
	defer func() { logger.Debug("Exiting Concerto.handleError", result) }()

	if jsError, ok := err.(*otto.Error); ok {
		return errors.New(jsError.String())
	}
	return err
}

// Init is called by the Hyperledger Fabric when the chaincode is deployed.
// Init can read from and write to the world state.
func (concerto *Concerto) Init(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Concerto.Init", stub, function, arguments)
	defer func() { logger.Debug("Exiting Concerto.Init", string(result), err) }()

	// Create all required objects.
	context := NewContext(concerto.VM, concerto.Engine, stub)

	// Defer to the JavaScript function.
	channel := concerto.Engine.Init(context, function, arguments)

	// Pump the event loop.
	err = concerto.pumpEventLoop()
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
	return result, concerto.handleError(err)

}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (concerto *Concerto) Invoke(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Concerto.Invoke", stub, function, arguments)
	defer func() { logger.Debug("Exiting Concerto.Invoke", string(result), err) }()

	// Create all required objects.
	context := NewContext(concerto.VM, concerto.Engine, stub)

	// Defer to the JavaScript function.
	channel := concerto.Engine.Invoke(context, function, arguments)

	// Pump the event loop.
	err = concerto.pumpEventLoop()
	if err != nil {
		return nil, concerto.handleError(err)
	}

	// Now read from the channel.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	result = data.Result
	err = data.Error
	return result, concerto.handleError(err)

}

// Query is called by the Hyperledger Fabric when the chaincode is queried.
// Query can read from, but not write to the world state.
func (concerto *Concerto) Query(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Concerto.Query", stub, function, arguments)
	defer func() { logger.Debug("Exiting Concerto.Query", string(result), err) }()

	// Create all required objects.
	context := NewContext(concerto.VM, concerto.Engine, stub)

	// Defer to the JavaScript function.
	channel := concerto.Engine.Query(context, function, arguments)

	// Pump the event loop.
	err = concerto.pumpEventLoop()
	if err != nil {
		return nil, concerto.handleError(err)
	}

	// Now read from the channel.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	result = data.Result
	err = data.Error
	return result, concerto.handleError(err)

}
