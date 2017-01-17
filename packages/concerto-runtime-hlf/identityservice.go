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
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
)

// IdentityService is a Go wrapper around an instance of the IdentityService JavaScript class.
type IdentityService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewIdentityService creates a Go wrapper around a new instance of the IdentityService JavaScript class.
func NewIdentityService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *IdentityService) {
	logger.Debug("Entering NewIdentityService", vm, context, stub)
	defer func() { logger.Debug("Exiting NewIdentityService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.IdentityService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of IdentityService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of IdentityService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &IdentityService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in IdentityService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("getCurrentUserID", result.getCurrentUserID)
	return result

}

// getCurrentUserID ...
func (identityService *IdentityService) getCurrentUserID(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.getCurrentUserID", call)
	defer func() { logger.Debug("Exiting DataService.getCurrentUserID", result) }()

	// Read the userID attribute value.
	bytes, err := identityService.Stub.ReadCertAttribute("userID")
	if err != nil {
		return otto.NullValue()
	}
	value := string(bytes)
	result, err = otto.ToValue(value)
	if err != nil {
		panic(call.Otto.MakeCustomError("Error", err.Error()))
	}
	return result

}
