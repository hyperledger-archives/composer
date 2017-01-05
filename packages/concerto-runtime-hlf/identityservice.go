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
