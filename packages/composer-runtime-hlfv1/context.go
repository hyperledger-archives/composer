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
	duktape "gopkg.in/olebedev/go-duktape.v3"
)

// Context is a Go wrapper around an instance of the Context JavaScript class.
type Context struct {
	VM              *duktape.Context
	DataService     *DataService
	IdentityService *IdentityService
	EventService    *EventService
	HTTPService     *HTTPService
}

// NewContext creates a Go wrapper around a new instance of the Context JavaScript class.
func NewContext(vm *duktape.Context, engine *Engine, stub shim.ChaincodeStubInterface) (result *Context) {
	logger.Debug("Entering NewContext", vm, engine, &stub)
	defer func() { logger.Debug("Exiting NewContext", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new logging service.
	result = &Context{VM: vm}

	// Create the services.
	result.DataService = NewDataService(vm, result, stub)
	result.IdentityService = NewIdentityService(vm, result, stub)
	result.EventService = NewEventService(vm, result, stub)
	result.HTTPService = NewHTTPService(vm, result, stub)

	// Find the JavaScript engine object.
	vm.PushGlobalStash()           // [ stash ]
	vm.GetPropString(-1, "engine") // [ stash theEngine ]

	// Create a new instance of the JavaScript Context class.
	vm.PushGlobalObject()            // [ stash theEngine global ]
	vm.GetPropString(-1, "composer") // [ stash theEngine global composer ]
	vm.GetPropString(-1, "Context")  // [ stash theEngine global composer Context ]
	vm.Dup(-4)                       // [ stash theEngine global composer Context theEngine ]
	err := vm.Pnew(1)                // [ stash theEngine global composer theContext ]
	if err != nil {
		panic(err)
	}

	// Store the context into the global stash.
	vm.DupTop()                     // [ stash theEngine global composer theContext theContext ]
	vm.PutPropString(-6, "context") // [ stash theEngine global composer theContext ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getDataService)     // [ stash theEngine global composer theContext getDataService ]
	vm.PutPropString(-2, "getDataService")       // [ stash theEngine global composer theContext ]
	vm.PushGoFunction(result.getIdentityService) // [ stash theEngine global composer theContext getIdentityService ]
	vm.PutPropString(-2, "getIdentityService")   // [ stash theEngine global composer theContext ]
	vm.PushGoFunction(result.getEventService)    // [ stash theEngine global composer theContext getEventService ]
	vm.PutPropString(-2, "getEventService")      // [ stash theEngine global composer theContext ]
	vm.PushGoFunction(result.getHTTPService)     // [ stash theEngine global composer theContext getHTTPService ]
	vm.PutPropString(-2, "getHTTPService")       // [ stash theEngine global composer theContext ]

	// Return the new context.
	return result
}

// getDataService returns the data service to use.
func (context *Context) getDataService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getDataService", vm)
	defer func() { logger.Debug("Exiting Context.getDataService", result) }()

	// Return the JavaScript object from the global stash.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "dataService")
	return 1
}

// getIdentityService returns the identity service to use.
func (context *Context) getIdentityService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getIdentityService", vm)
	defer func() { logger.Debug("Exiting Context.getIdentityService", result) }()

	// Return the JavaScript object from the global stash.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "identityService")
	return 1
}

// getHTTPService returns the http service to use.

func (context *Context) getHTTPService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getHTTPService", vm)
	defer func() { logger.Debug("Exiting Context.getHTTPService", result) }()

	// Return the JavaScript object from the global stash.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "httpService")
	return 1
}

// getEventService returns the event service to use.
func (context *Context) getEventService(vm *duktape.Context) (result int) {
	logger.Debug("Entering Context.getEventService", vm)
	defer func() { logger.Debug("Exiting Context.getEventService", result) }()

	// Return the JavaScript object from the global stash.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "eventService")
	return 1
}
