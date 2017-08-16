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

	"github.com/hyperledger/fabric/core/chaincode/shim"
	duktape "gopkg.in/olebedev/go-duktape.v3"
)

// Composer is the chaincode class. It is an implementation of the
// Chaincode interface.
type Composer struct {
	VM        *duktape.Context
	Container *Container
	Engine    *Engine
	Index     int
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
	vm := duktape.NewWithFlags(&duktape.Flags{Console: duktape.FlagConsoleFlush})
	if vm == nil {
		panic("Failed to create JavaScript virtual machine")
	}
	composer.VM = vm

	// Register event loop functions.
	vm.PushTimers()

	// Install the global object, and the window alias to it.
	err := vm.PevalString(`
		if (typeof global === 'undefined') {
			(function () {
				var global = new Function('return this;')();
				Object.defineProperty(global, 'global', {
					value: global,
					writable: true,
					enumerable: false,
					configurable: true
				});
				Object.defineProperty(global, 'window', {
					value: global,
					writable: true,
					enumerable: false,
					configurable: true
				});
				Object.defineProperty(global, 'document', {
					value: undefined,
					writable: true,
					enumerable: false,
					configurable: true
				});
				Object.defineProperty(global, 'navigator', {
					value: undefined,
					writable: true,
					enumerable: false,
					configurable: true
				});
			})();
		}
	`)
	if err != nil {
		panic(err)
	}

	// Execute the Babel Polyfill JavaScript source inside the JavaScript virtual machine.
	err = vm.PevalString(babelPolyfillJavaScript)
	if err != nil {
		panic(err)
	}

	// Execute the Composer JavaScript source inside the JavaScript virtual machine.
	// We trim any trailing newlines as this is required for Otto to find the source maps.
	err = vm.PevalString(strings.TrimRight(composerJavaScript, "\n"))
	if err != nil {
		panic(err)
	}

}

// Init is called by the Hyperledger Fabric when the chaincode is deployed.
// Init can read from and write to the world state.
func (composer *Composer) Init(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Composer.Init", &stub, function, arguments)
	defer func() { logger.Debug("Exiting Composer.Init", string(result), err) }()

	// Start a scope for locking the JavaScript virtual machine.
	var channel chan EngineCallback
	func() {

		// Lock the JavaScript virtual machine.
		vm := composer.VM
		vm.Lock()
		defer vm.Unlock()

		composer.Container.setStub(stub)

		// Create all required objects.
		context := NewContext(composer.VM, composer.Engine, stub)

		// Defer to the JavaScript function.
		channel = composer.Engine.Init(context, function, arguments)

	}()

	// Now read from the channel. This will be triggered when the JavaScript
	// code calls the callback function.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	return data.Result, data.Error
}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (composer *Composer) Invoke(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Composer.Invoke", &stub, function, arguments)
	defer func() { logger.Debug("Exiting Composer.Invoke", string(result), err) }()

	// Start a scope for locking the JavaScript virtual machine.
	var channel chan EngineCallback
	func() {

		// Lock the JavaScript virtual machine.
		vm := composer.VM
		vm.Lock()
		defer vm.Unlock()

		composer.Container.setStub(stub)

		// Create all required objects.
		context := NewContext(composer.VM, composer.Engine, stub)

		// Defer to the JavaScript function.
		channel = composer.Engine.Invoke(context, function, arguments)

	}()

	// Now read from the channel. This will be triggered when the JavaScript
	// code calls the callback function.
	data, ok := <-channel
	if !ok {
		return nil, errors.New("Failed to receive callback from JavaScript function")
	}
	return data.Result, data.Error
}
