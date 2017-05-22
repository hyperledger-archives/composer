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

// Context is a Go wrapper around an instance of the Context JavaScript class.
type Context struct {
	This            *otto.Object
	DataService     *DataService
	IdentityService *IdentityService
	EventService    *EventService
}

// NewContext creates a Go wrapper around a new instance of the Context JavaScript class.
func NewContext(vm *otto.Otto, engine *Engine, stub shim.ChaincodeStubInterface) (result *Context) {
	logger.Debug("Entering NewContext", vm, engine, stub)
	defer func() { logger.Debug("Exiting NewContext", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.Context", nil, engine.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of Context JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of Context JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &Context{This: object}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in Context JavaScript object: %v", err))
	}

	// Create the services.
	result.DataService = NewDataService(vm, result, stub)
	result.IdentityService = NewIdentityService(vm, result, stub)
	result.EventService = NewEventService(vm, result, stub)

	// Bind the methods into the JavaScript object.
	result.This.Set("getDataService", result.getDataService)
	result.This.Set("getIdentityService", result.getIdentityService)
	result.This.Set("getEventService", result.getEventService)
	return result

}

// getDataService ...
func (context *Context) getDataService(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Context.getDataService", call)
	defer func() { logger.Debug("Exiting Context.getDataService", result) }()

	return context.DataService.This.Value()
}

// getIdentityService ...
func (context *Context) getIdentityService(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Context.getIdentityService", call)
	defer func() { logger.Debug("Exiting Context.getIdentityService", result) }()

	return context.IdentityService.This.Value()
}

// getEventService ...
func (context *Context) getEventService(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Context.getEventService", call)
	defer func() { logger.Debug("Exiting Context.getEventService", result) }()

	return context.EventService.This.Value()
}
