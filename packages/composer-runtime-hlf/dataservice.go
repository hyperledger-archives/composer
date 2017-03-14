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
	result.This.Set("_existsCollection", result.existsCollection)
	return result

}

// createCollection ...
func (dataService *DataService) createCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.createCollection", call)
	defer func() { logger.Debug("Exiting DataService.createCollection", result) }()

	// force is ignored for this connector. It is provided by the runtime but only
	// required for hyper V1 connector.
	id, force, callback := call.Argument(0), call.Argument(1), call.Argument(2)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	} else if !force.IsBoolean() {
		panic(fmt.Errorf("force not specified or is not a boolean"))		
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

// existsCollection ...
func (dataService *DataService) existsCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.existsCollection", call)
	defer func() { logger.Debug("Exiting DataService.existsCollection", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	_, err := dataService.Stub.GetTable(id.String())

  if err != nil {
		_, err = callback.Call(callback, nil, false)
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	_, err = callback.Call(callback, nil, true)
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
