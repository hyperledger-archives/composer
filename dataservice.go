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

// DataService is a Go wrapper around an instance of the DataService JavaScript class.
type DataService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewDataService creates a Go wrapper around a new instance of the DataService JavaScript class.
func NewDataService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *DataService) {
	logger.Debug("Entering NewDataService", vm, context, stub)
	defer func() { logger.Debug("Exiting NewDataService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.DataService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of DataService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of DataService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &DataService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in DataService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("_createCollection", result.createCollection)
	result.This.Set("_deleteCollection", result.deleteCollection)
	result.This.Set("_getCollection", result.getCollection)
	return result

}

// createCollection ...
func (dataService *DataService) createCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.createCollection", call)
	defer func() { logger.Debug("Exiting DataService.createCollection", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	err := dataService.Stub.CreateTable(id.String(), []*shim.ColumnDefinition{
		{Name: "id", Type: shim.ColumnDefinition_STRING, Key: true},
		{Name: "data", Type: shim.ColumnDefinition_STRING, Key: false},
	})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	dataCollection := NewDataCollection(call.Otto, dataService, dataService.Stub, id.String())
	_, err = callback.Call(callback, nil, dataCollection.This)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// deleteCollection ...
func (dataService *DataService) deleteCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.deleteCollection", call)
	defer func() { logger.Debug("Exiting DataService.deleteCollection", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	err := dataService.clearTable(id.String())
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	err = dataService.Stub.DeleteTable(id.String())
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	_, err = callback.Call(callback, nil)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// getCollection ...
func (dataService *DataService) getCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.getCollection", call)
	defer func() { logger.Debug("Exiting DataService.getCollection", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	_, err := dataService.Stub.GetTable(id.String())
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	dataCollection := NewDataCollection(call.Otto, dataService, dataService.Stub, id.String())
	_, err = callback.Call(callback, nil, dataCollection.This)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// clearTable is called to clear all rows from a table.
func (dataService *DataService) clearTable(tableName string) (err error) {
	logger.Debug("Entering DataService.clearTable", tableName)
	defer func() { logger.Debug("Exiting DataService.clearTable", err) }()
	table, _ := dataService.Stub.GetTable(tableName)
	if table != nil {
		keyIndexes := []int{}
		for index, column := range table.GetColumnDefinitions() {
			if column.Key {
				keyIndexes = append(keyIndexes, index)
			}
		}
		bigUglyMutex.Lock()         // FAB-860 avoidance hack.
		defer bigUglyMutex.Unlock() // FAB-860 avoidance hack.
		rows, err := dataService.Stub.GetRows(tableName, []shim.Column{})
		if err != nil {
			return err
		}
		for row := range rows {
			keyColumns := []shim.Column{}
			for _, keyIndex := range keyIndexes {
				keyColumns = append(keyColumns, shim.Column{
					Value: row.GetColumns()[keyIndex].GetValue(),
				})
			}
			err = dataService.Stub.DeleteRow(tableName, keyColumns)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
