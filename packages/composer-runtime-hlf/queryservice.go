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

// QueryService is a go wrapper around the QueryService JavaScript class
type QueryService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewQueryService creates a Go wrapper around a new instance of the QueryService JavaScript class.
func NewQueryService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *QueryService) {
	logger.Debug("Entering NewQueryService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewQueryService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.QueryService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of QueryService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of QueryService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &QueryService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in QueryService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("_queryNative", result.queryNative)
	return result
}

// queryNative ...
func (queryService *QueryService) queryNative(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering QueryService.queryNative", call)
	defer func() { logger.Debug("Exiting QueryService.queryNative", result) }()

	callback := call.Argument(0)
	if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	object, _ := call.Otto.Object(`({data: "Not implemented"})`)
	_, err := callback.Call(callback, nil, object)

	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}
