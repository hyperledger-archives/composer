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
	duktape "gopkg.in/olebedev/go-duktape.v3"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// This is the object type used to form composite keys for the collection of collections.
const collectionObjectType = "$syscollections"

// DataService is a Go wrapper around an instance of the DataService JavaScript class.
type DataService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// NewDataService creates a Go wrapper around a new instance of the DataService JavaScript class.
func NewDataService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *DataService) {
	logger.Debug("Entering NewDataService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewDataService", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new data service.
	result = &DataService{VM: vm, Stub: stub}

	// Create a new instance of the JavaScript DataService class.
	vm.PushGlobalObject()               // [ global ]
	vm.GetPropString(-1, "composer")    // [ global composer ]
	vm.GetPropString(-1, "DataService") // [ global composer DataService ]
	err := vm.Pnew(0)                   // [ global composer theDataService ]
	if err != nil {
		panic(err)
	}

	// Store the data service into the global stash.
	vm.PushGlobalStash()                // [ global composer theDataService stash ]
	vm.Dup(-2)                          // [ global composer theDataService stash theDataService  ]
	vm.PutPropString(-2, "dataService") // [ global composer theDataService stash ]
	vm.Pop()                            // [ global composer theDataService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.createCollection) // [ global composer theDataService createCollection ]
	vm.PutPropString(-2, "_createCollection")  // [ global composer theDataService ]
	vm.PushGoFunction(result.deleteCollection) // [ global composer theDataService deleteCollection ]
	vm.PutPropString(-2, "_deleteCollection")  // [ global composer theDataService ]
	vm.PushGoFunction(result.getCollection)    // [ global composer theDataService getCollection ]
	vm.PutPropString(-2, "_getCollection")     // [ global composer theDataService ]
	vm.PushGoFunction(result.existsCollection) // [ global composer theDataService existsCollection ]
	vm.PutPropString(-2, "_existsCollection")  // [ global composer theDataService ]
	vm.PushGoFunction(result.executeQuery)     // [ global composer theDataService executeQuery ]
	vm.PutPropString(-2, "_executeQuery")      // [ global composer theDataService ]

	// Return the new data service.
	return result
}

// createCollection creates a collection of objects in the world state.
func (dataService *DataService) createCollection(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataService.createCollection", vm)
	defer func() { logger.Debug("Exiting DataService.createCollection", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireBoolean(1)
	vm.RequireFunction(2)

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	err := dataService.Stub.CreateTable(id, []*shim.ColumnDefinition{
		{Name: "id", Type: shim.ColumnDefinition_STRING, Key: true},
		{Name: "data", Type: shim.ColumnDefinition_STRING, Key: false},
	})
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Create a new data collection.
	NewDataCollection(vm, dataService, dataService.Stub, id)

	// Call the callback.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "dataCollection")
	vm.Dup(2)
	vm.PushNull()
	vm.Dup(-3)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// deleteCollection deletes a collection of objects in the world state.
func (dataService *DataService) deleteCollection(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataService.deleteCollection", vm)
	defer func() { logger.Debug("Exiting DataService.deleteCollection", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Remove all of the objects from the collection.
	err := dataService.clearCollection(id)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Delete the collection.
	err = dataService.Stub.DeleteTable(id)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Call the callback.
	vm.Dup(1)
	vm.PushNull()
	if vm.Pcall(1) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// getCollection retrieves an existing collection from the world state.
func (dataService *DataService) getCollection(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataService.getCollection", vm)
	defer func() { logger.Debug("Exiting DataService.getCollection", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	_, err := dataService.Stub.GetTable(id)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Create the new data collection.
	NewDataCollection(vm, dataService, dataService.Stub, id)

	// Call the callback.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "dataCollection")
	vm.Dup(1)
	vm.PushNull()
	vm.Dup(-3)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// existsCollection checks to see if a collection exists in the world state.
func (dataService *DataService) existsCollection(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataService.existsCollection", vm)
	defer func() { logger.Debug("Exiting DataService.existsCollection", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	_, err := dataService.Stub.GetTable(id)

	// Call the callback.
	vm.PushGlobalStash()
	vm.GetPropString(-1, "dataCollection")
	vm.Dup(1)
	vm.PushNull()
	vm.PushBoolean(err == nil)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// executeQuery executes a query against the data in the world state.
func (dataService *DataService) executeQuery(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataService.executeQuery", vm)
	defer func() { logger.Debug("Exiting DataService.executeQuery", result) }()

	// argument 0 is the CouchDB queryString
	queryString := vm.RequireString(0)
	logger.Debug("CouchDB query string", queryString)

	// argument 1 is the callback function (err,response)
	vm.RequireFunction(1)

	vm.PushErrorObjectVa(duktape.ErrError, "%s", "Query functionality is not available on this Blockchain platform")
	vm.Throw()
	return 0
}

// clearCollection is called to clear all objects from a collection.
func (dataService *DataService) clearCollection(collectionID string) (err error) {
	logger.Debug("Entering DataService.clearCollection", collectionID)
	defer func() { logger.Debug("Exiting DataService.clearCollection", err) }()
	table, _ := dataService.Stub.GetTable(collectionID)
	if table != nil {
		keyIndexes := []int{}
		for index, column := range table.GetColumnDefinitions() {
			if column.Key {
				keyIndexes = append(keyIndexes, index)
			}
		}
		bigUglyMutex.Lock()         // FAB-860 avoidance hack.
		defer bigUglyMutex.Unlock() // FAB-860 avoidance hack.
		rows, err := dataService.Stub.GetRows(collectionID, []shim.Column{})
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
			err = dataService.Stub.DeleteRow(collectionID, keyColumns)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
