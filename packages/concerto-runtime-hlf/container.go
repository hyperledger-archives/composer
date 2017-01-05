/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
	temp, err := vm.Call("new concerto.Container", nil)
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

// getVersion ...
func (container *Container) getVersion(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Container.getVersion", call)
	defer func() { logger.Debug("Exiting Container.getVersion", result) }()

	result, err := otto.ToValue(version)
	if err != nil {
		panic(err)
	}
	return result
}

// getLoggingService ...
func (container *Container) getLoggingService(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering Container.getLoggingService", call)
	defer func() { logger.Debug("Exiting Container.getLoggingService", result) }()

	return container.LoggingService.This.Value()
}
