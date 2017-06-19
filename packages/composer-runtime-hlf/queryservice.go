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

// QueryService is a go wrapper around the QueryService JavaScript class
type QueryService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// NewQueryService creates a Go Wrapper around a new instance of the QueryService JavaScript class
func NewQueryService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *QueryService) {
	logger.Debug("Entering QueryService", vm, context, &stub)
	defer func() { logger.Debug("Exiting QueryService", result) }()

	// Ensure the JavaScript stack is reset
	defer vm.SetTop(vm.GetTop())

	// Create a new Query service
	result = &QueryService{VM: vm, Stub: stub}

	// Create a new instance of the JavaScript QueryService class
	vm.PushGlobalObject()                // [ global ]
	vm.GetPropString(-1, "composer")     // [ global composer ]
	vm.GetPropString(-1, "QueryService") //[ global composer QueryService ]
	err := vm.Pnew(0)                    // [ global composer theQueryService ]
	if err != nil {
		logger.Debug("Error received on vm.Pnew(0)", err)
		panic(err)
	}

	// Store the Query service into the global stash
	vm.PushGlobalStash()                 // [ global composer theQueryService stash]
	vm.Dup(-2)                           // [ global composer theQueryService stash theQueryService ]
	vm.PutPropString(-2, "queryService") // [ global composer theQueryService stash ]
	vm.Pop()                             // [ global composer theQueryService]

	//Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.queryNative) // [global composer theQueryService query]
	vm.PushString("bind")                 // [global composer theQueryService query "bind"]
	vm.Dup(-3)                            // [global composer theQueryService query "bind" theQueryService]
	vm.PcallProp(-3, 1)                   // [global composer theQueryService query boundCommit ]
	vm.PutPropString(-3, "_queryNative")  // [global composer theQueryService ]

	// return a new query service

	return result
}

// Execute a CouchDB query and returns the result to the caller
func (queryService *QueryService) queryNative(vm *duktape.Context) (result int) {
	logger.Debug("Entering QueryService.queryNative", vm)
	defer func() { logger.Debug("Exiting QueryService.queryNative", result) }()

	// argument 0 is the CouchDB queryString
	queryString := vm.RequireString(0)
	logger.Debug("QueryService.queryNative CouchDB query: ", queryString)

	// argument 1 is the callback function (err,response)
	vm.RequireFunction(1)

	vm.PushErrorObjectVa(duktape.ErrError, "%s", "The native query functionality is not available on this Blockchain platform")
	vm.Throw()
	return 0
}
