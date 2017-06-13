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

	duktape "gopkg.in/olebedev/go-duktape.v3"
)

// Engine is a Go wrapper around an instance of the Engine JavaScript class.
type Engine struct {
	VM *duktape.Context
}

// EngineCallback is a structure used for callbacks from the chaincode.
type EngineCallback struct {
	Result []byte
	Error  error
}

// NewEngine creates a Go wrapper around a new instance of the Engine JavaScript class.
func NewEngine(vm *duktape.Context, container *Container) (result *Engine) {
	logger.Debug("Entering NewEngine", vm, container)
	defer func() { logger.Debug("Exiting NewEngine", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new engine.
	result = &Engine{VM: vm}

	// Find the JavaScript container object.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "container")

	// Create a new instance of the JavaScript chaincode class.
	vm.PushGlobalObject()            // [ stash theContainer global ]
	vm.GetPropString(-1, "composer") // [ stash theContainer global composer ]
	vm.GetPropString(-1, "Engine")   // [ stash theContainer global composer Engine ]
	vm.Dup(-4)                       // [ stash theContainer global composer Engine theContainer ]
	err := vm.Pnew(1)                // [ stash theContainer global composer theEngine ]
	if err != nil {
		panic(err)
	}

	// Store the engine into the global stash.
	vm.PutPropString(-5, "engine") // [ stash theContainer global composer ]

	// Return the new engine.
	return result
}

// HandleCallback handles the execution of a JavaScript callback by the chaincode.
func (engine *Engine) handleCallback(channel chan EngineCallback, vm *duktape.Context) (result int) {
	logger.Debug("Entering Engine.handleCallback", channel, vm)
	defer func() { logger.Debug("Exiting Engine.handleCallback", result) }()

	// If the error exists, pass it back to our channel.
	if !vm.IsNullOrUndefined(0) {
		channel <- EngineCallback{
			Result: nil,
			Error:  errors.New(vm.ToString(0)),
		}
	} else if !vm.IsNullOrUndefined(1) {
		vm.JsonEncode(1)
		channel <- EngineCallback{
			Result: []byte(vm.RequireString(1)),
			Error:  nil,
		}
	} else {
		channel <- EngineCallback{
			Result: nil,
			Error:  nil,
		}
	}

	// No return value from the callback.
	return 0
}

// Init executes the Engine.init(context, function, arguments, callback) JavaScript function.
func (engine *Engine) Init(context *Context, function string, arguments []string) (channel chan EngineCallback) {
	logger.Debug("Entering Engine.Init", context, function, arguments)
	defer func() { logger.Debug("Exiting Engine.Init", channel) }()

	// Ensure the JavaScript stack is reset.
	vm := context.VM
	defer vm.SetTop(vm.GetTop())

	// Create a channel to receieve the response from JavaScript.
	channel = make(chan EngineCallback, 1)

	// Call the JavaScript code and pass in a callback function.
	vm.PushGlobalStash()            // [ stash ]
	vm.GetPropString(-1, "engine")  // [ stash engine ]
	vm.PushString("_init")          // [ stash engine _init ]
	vm.GetPropString(-3, "context") // [ stash engine _init context ]
	vm.PushString(function)         // [ stash engine _init context function ]
	arrIdx := vm.PushArray()        // [ stash engine _init context function arguments ]
	for i, argument := range arguments {
		vm.PushString(argument)          // [ stash engine _init context function arguments argument ]
		vm.PutPropIndex(arrIdx, uint(i)) // [ stash engine _init context function arguments ]
	}
	vm.PushGoFunction(func(vm *duktape.Context) int { // [ stash engine _init context function arguments callback ]
		return engine.handleCallback(channel, vm)
	})
	rc := vm.PcallProp(-6, 4) // [ stash engine result ]
	if rc == duktape.ExecError {
		channel <- EngineCallback{
			Result: nil,
			Error:  errors.New(vm.ToString(-1)),
		}
	}

	// Return the channel.
	return channel
}

// Invoke executes the Engine.invoke(context, function, arguments, callback) JavaScript function.
func (engine *Engine) Invoke(context *Context, function string, arguments []string) (channel chan EngineCallback) {
	logger.Debug("Entering Engine.Invoke", context, function, arguments)
	defer func() { logger.Debug("Exiting Engine.Invoke", channel) }()

	// Ensure the JavaScript stack is reset.
	vm := context.VM
	defer vm.SetTop(vm.GetTop())

	// Create a channel to receieve the response from JavaScript.
	channel = make(chan EngineCallback, 1)

	// Call the JavaScript code and pass in a callback function.
	vm.PushGlobalStash()            // [ stash ]
	vm.GetPropString(-1, "engine")  // [ stash engine ]
	vm.PushString("_invoke")        // [ stash engine _invoke ]
	vm.GetPropString(-3, "context") // [ stash engine _invoke context ]
	vm.PushString(function)         // [ stash engine _invoke context function ]
	arrIdx := vm.PushArray()        // [ stash engine _invoke context function arguments ]
	for i, argument := range arguments {
		vm.PushString(argument)          // [ stash engine _invoke context function arguments argument ]
		vm.PutPropIndex(arrIdx, uint(i)) // [ stash engine _invoke context function arguments ]
	}
	vm.PushGoFunction(func(vm *duktape.Context) int { // [ stash engine _invoke context function arguments callback ]
		return engine.handleCallback(channel, vm)
	})
	rc := vm.PcallProp(-6, 4) // [ stash engine result ]
	if rc == duktape.ExecError {
		channel <- EngineCallback{
			Result: nil,
			Error:  errors.New(vm.ToString(-1)),
		}
	}

	// Return the channel.
	return channel
}

// Query executes the Engine.query(context, function, arguments, callback) JavaScript function.
func (engine *Engine) Query(context *Context, function string, arguments []string) (channel chan EngineCallback) {
	logger.Debug("Entering Engine.Query", context, function, arguments)
	defer func() { logger.Debug("Exiting Engine.Query", channel) }()

	// Ensure the JavaScript stack is reset.
	vm := context.VM
	defer vm.SetTop(vm.GetTop())

	// Create a channel to receieve the response from JavaScript.
	channel = make(chan EngineCallback, 1)

	// Call the JavaScript code and pass in a callback function.
	vm.PushGlobalStash()            // [ stash ]
	vm.GetPropString(-1, "engine")  // [ stash engine ]
	vm.PushString("_query")         // [ stash engine _query ]
	vm.GetPropString(-3, "context") // [ stash engine _query context ]
	vm.PushString(function)         // [ stash engine _query context function ]
	arrIdx := vm.PushArray()        // [ stash engine _query context function arguments ]
	for i, argument := range arguments {
		vm.PushString(argument)          // [ stash engine _query context function arguments argument ]
		vm.PutPropIndex(arrIdx, uint(i)) // [ stash engine _query context function arguments ]
	}
	vm.PushGoFunction(func(vm *duktape.Context) int { // [ stash engine _query context function arguments callback ]
		return engine.handleCallback(channel, vm)
	})
	rc := vm.PcallProp(-6, 4) // [ stash engine result ]
	if rc == duktape.ExecError {
		channel <- EngineCallback{
			Result: nil,
			Error:  errors.New(vm.ToString(-1)),
		}
	}

	// Return the channel.
	return channel
}
