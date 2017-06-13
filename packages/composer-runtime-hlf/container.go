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
	duktape "gopkg.in/olebedev/go-duktape.v3"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// Container is a Go wrapper around an instance of the Container JavaScript class.
type Container struct {
	VM             *duktape.Context
	LoggingService *LoggingService
}

// NewContainer creates a Go wrapper around a new instance of the Container JavaScript class.
func NewContainer(vm *duktape.Context, stub shim.ChaincodeStubInterface) (result *Container) {
	logger.Debug("Entering NewContainer", vm)
	defer func() { logger.Debug("Exiting NewContainer", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new container.
	result = &Container{VM: vm}

	// Create the services.
	result.LoggingService = NewLoggingService(vm, result, stub)

	// Create a new instance of the JavaScript Container class.
	vm.PushGlobalObject()             // [ global ]
	vm.GetPropString(-1, "composer")  // [ global composer ]
	vm.GetPropString(-1, "Container") // [ global composer Container ]
	err := vm.Pnew(0)                 // [ global composer theContainer ]
	if err != nil {
		panic(err)
	}
	vm.PushGlobalStash()              // [ global composer theContainer stash ]
	vm.Dup(-2)                        // [ global composer theContainer stash theContainer  ]
	vm.PutPropString(-2, "container") // [ global composer theContainer stash ]
	vm.Pop()                          // [ global composer theContainer ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getVersion)        // [ global composer theContainer getVersion ]
	vm.PutPropString(-2, "getVersion")          // [ global composer theContainer ]
	vm.PushGoFunction(result.getLoggingService) // [ global composer theContainer getLoggingService ]
	vm.PutPropString(-2, "getLoggingService")   // [ global composer theContainer ]

	// Return the new container.
	return result
}

// getVersion returns the current version of the chaincode.
func (container *Container) getVersion(vm *duktape.Context) (result int) {
	logger.Debug("Entering Container.getVersion", vm)
	defer func() { logger.Debug("Exiting Container.getVersion", result) }()

	// Return the chaincode version.
	vm.PushString(version)
	return 1
}

// getLoggingService returns the logging service to use.
func (container *Container) getLoggingService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Container.getLoggingService", vm)
	defer func() { logger.Debug("Exiting Container.getLoggingService", result) }()

	// Return the JavaScript object from the global stash.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "loggingService")
	return 1
}
