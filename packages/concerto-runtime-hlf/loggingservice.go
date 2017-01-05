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

// LoggingService is a Go wrapper around an instance of the LoggingService JavaScript class.
type LoggingService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewLoggingService creates a Go wrapper around a new instance of the LoggingService JavaScript class.
func NewLoggingService(vm *otto.Otto, container *Container, stub shim.ChaincodeStubInterface) (result *LoggingService) {
	logger.Debug("Entering NewLoggingService", vm, container, stub)
	defer func() { logger.Debug("Exiting NewLoggingService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.LoggingService", nil, container.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of LoggingService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of LoggingService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &LoggingService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in LoggingService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("logCritical", result.logCritical)
	result.This.Set("logDebug", result.logDebug)
	result.This.Set("logError", result.logError)
	result.This.Set("logInfo", result.logInfo)
	result.This.Set("logNotice", result.logNotice)
	result.This.Set("logWarning", result.logWarning)
	return result

}

func (loggingService *LoggingService) getLogInserts(call otto.FunctionCall) (result []interface{}) {
	result = []interface{}{}
	for _, arg := range call.ArgumentList {
		str, err := arg.ToString()
		if err != nil {
			str = err.Error()
		}
		result = append(result, str)
	}
	return result
}

// LogCritical ...
func (loggingService *LoggingService) logCritical(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Critical(strings...)
	return otto.UndefinedValue()
}

// LogDebug ...
func (loggingService *LoggingService) logDebug(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Debug(strings...)
	return otto.UndefinedValue()
}

// LogError ...
func (loggingService *LoggingService) logError(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Error(strings...)
	return otto.UndefinedValue()
}

// LogInfo ...
func (loggingService *LoggingService) logInfo(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Info(strings...)
	return otto.UndefinedValue()
}

// LogNotice ...
func (loggingService *LoggingService) logNotice(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Notice(strings...)
	return otto.UndefinedValue()
}

// LogWarning ...
func (loggingService *LoggingService) logWarning(call otto.FunctionCall) otto.Value {
	strings := loggingService.getLogInserts(call)
	logger.Warning(strings...)
	return otto.UndefinedValue()
}
