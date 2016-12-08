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

// Context is a Go wrapper around an instance of the Context JavaScript class.
type Context struct {
	This            *otto.Object
	DataService     *DataService
	IdentityService *IdentityService
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

	// Bind the methods into the JavaScript object.
	result.This.Set("getDataService", result.getDataService)
	result.This.Set("getIdentityService", result.getIdentityService)
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
