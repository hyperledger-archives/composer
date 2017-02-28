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

// Container is a Go wrapper around an instance of the Container JavaScript class.
type Container struct {
	This           *otto.Object
	LoggingService *LoggingService
}

// NewContainer creates a Go wrapper around a new instance of the Container JavaScript class.
func NewContainer(vm *otto.Otto, stub shim.ChaincodeStubInterface) (result *Container) {
	logger.Debug("Entering NewContainer", vm)
	defer func() { logger.Debug("Exiting NewContainer", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new composer.Container", nil)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of Container JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of Container JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &Container{This: object}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in Container JavaScript object: %v", err))
	}

	// Create the services.
	result.LoggingService = NewLoggingService(vm, result, stub)

	// Bind the methods into the JavaScript object.
	result.This.Set("getVersion", result.getVersion)
	result.This.Set("getLoggingService", result.getLoggingService)
	return result

}

// getVersion returns the current version of the chaincode.
func (container *Container) getVersion(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Container.getVersion", call)
	defer func() { logger.Debug("Exiting Container.getVersion", result) }()

	result, err := otto.ToValue(version)
	if err != nil {
		panic(err)
	}
	return result
}

// getLoggingService returns the logging service to use.
func (container *Container) getLoggingService(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Container.getLoggingService", call)
	defer func() { logger.Debug("Exiting Container.getLoggingService", result) }()

	return container.LoggingService.This.Value()
}
