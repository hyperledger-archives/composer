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

// EventService is a go wrapper around the EventService JavaScript class
type EventService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewEventService creates a Go wrapper around a new instance of the EventService JavaScript class.
func NewEventService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *EventService) {
	logger.Debug("Entering NewEventService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewEventServce", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.EventService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of EventService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of EventService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &EventService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in EventService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("_commit", result.commit)
	return result
}

// Serializes the buffered events and emits them
func (eventService *EventService) commit(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering EventService.commit", call)
	defer func() { logger.Debug("Exiting EventService.commit", result) }()

	callback := call.Argument(0)

	value, err := call.This.Object().Call("serializeBuffer")

	if err != nil {
		panic(err)
	}

	if len(value.String()) > 0 {
		logger.Debug("Emitting event from EventService.commit", value.String())
		eventService.Stub.SetEvent("composer", []byte(value.String()))
	}

	_, err = callback.Call(callback, nil, eventService.This)
	if err != nil {
		panic(err)
	}

	return otto.UndefinedValue()
}
