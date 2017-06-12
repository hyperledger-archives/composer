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

// EventService is a go wrapper around the EventService JavaScript class
type EventService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// NewEventService creates a Go wrapper around a new instance of the EventService JavaScript class.
func NewEventService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *EventService) {
	logger.Debug("Entering NewEventService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewEventServce", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create a new event service
	result = &EventService{VM: vm, Stub: stub}

	//Create a new instance of the JavaScript EventService class.
	vm.PushGlobalObject()                // [ global ]
	vm.GetPropString(-1, "composer")     // [ global composer ]
	vm.GetPropString(-1, "EventService") // [ global composer EventService ]
	err := vm.Pnew(0)                    // [ global composer theEventService ]
	if err != nil {
		panic(err)
	}

	// Store the event service into the global stash.
	vm.PushGlobalStash()                 // [ global composer theEventService stash ]
	vm.Dup(-2)                           // [ global composer theEventService stash theEventService ]
	vm.PutPropString(-2, "eventService") // [ global composer theEventService stash ]
	vm.Pop()                             // [ global composer theEventService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.transactionCommit) // [ global composer theEventService transactionCommit ]
	vm.PushString("bind")                       // [ global composer theEventService transactionCommit "bind" ]
	vm.Dup(-3)                                  // [ global composer theEventService transactionCommit "bind" theEventService ]
	vm.PcallProp(-3, 1)                         // [ global composer theEventService transactionCommit boundTransactionCommit ]
	vm.PutPropString(-3, "_transactionCommit")  // [ global composer theEventService transactionCommit ]

	// Return a new event service
	return result
}

// Serializes the buffered events and emits them
func (eventService *EventService) transactionCommit(vm *duktape.Context) (result int) {
	logger.Debug("Entering EventService.transactionCommit", vm)
	defer func() { logger.Debug("Exiting EventService.transactionCommit", result) }()

	// Validate the arguments from JavaScript.
	vm.RequireFunction(0)

	vm.PushThis()                     // [ theEventService ]
	vm.GetPropString(-1, "getEvents") // [ theEventService, getEvents ]
	vm.RequireFunction(-1)            // [ theEventService, getEvents ]
	vm.Dup(-2)                        // [ theEventService, getEvents, theEventService ]
	vm.CallMethod(0)                  // [ theEventService, returnValue ]
	vm.RequireObjectCoercible(-1)     // [ theEventService, returnValue ]
	vm.JsonEncode(-1)                 // [ theEventService, returnValue ]
	value := vm.RequireString(-1)     // [ theEventService, returnValue ]

	if len(value) > 0 {
		logger.Debug("Emitting event from EventService.transactionCommit", value)
		eventService.Stub.SetEvent("composer", []byte(value))
	}

	// Call the callback.
	vm.Dup(0)
	vm.PushNull()
	if vm.Pcall(1) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}
