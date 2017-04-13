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
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
	duktape "gopkg.in/olebedev/go-duktape.v3"
)

// Context is a Go wrapper around an instance of the Context JavaScript class.
type Context struct {
	This            *otto.Object
	DataService     *DataService
	IdentityService *IdentityService
}

// NewContext creates a Go wrapper around a new instance of the Context JavaScript class.
func NewContext(vm *duktape.Context, engine *Engine, stub shim.ChaincodeStubInterface) (result *Context) {
	logger.Debug("Entering NewContext", vm, engine, stub)
	defer func() { logger.Debug("Exiting NewContext", result) }()

	// Create the new logging service.
	result = &Context{}

	// Create the services.
	result.DataService = NewDataService(vm, result, stub)
	result.IdentityService = NewIdentityService(vm, result, stub)

	// Create a new instance of the JavaScript LoggingService class.
	vm.PushGlobalObject()                  // [ global ]
	vm.GetPropString(-1, "composer")       // [ global composer ]
	vm.GetPropString(-1, "LoggingService") // [ global composer LoggingService ]
	vm.New(0)                              // [ global composer theLoggingService ]

	// Store the LoggingService into the global stash.
	vm.PushGlobalStash()                   // [ global composer theLoggingService stash ]
	vm.Dup(-2)                             // [ global composer theLoggingService stash theLoggingService  ]
	vm.PutPropString(-2, "loggingService") // [ global composer theLoggingService stash ]
	vm.Pop()                               // [ global composer theLoggingService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getDataService)
	vm.PutPropString(-2, "getDataService")
	vm.PushGoFunction(result.getIdentityService)
	vm.PutPropString(-2, "getIdentityService")

	// Return the new context.
	return result

}

// getDataService returns the data service to use.
func (context *Context) getDataService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getDataService", vm)
	defer func() { logger.Debug("Exiting Context.getDataService", result) }()

	vm.PushGlobalStash()
	vm.GetPropString(-1, "dataService")
	return 1
}

// getIdentityService returns the identity service to use.
func (context *Context) getIdentityService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getIdentityService", vm)
	defer func() { logger.Debug("Exiting Context.getIdentityService", result) }()

	vm.PushGlobalStash()
	vm.GetPropString(-1, "identityService")
	return 1
}
