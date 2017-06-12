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

// DataCollection is a Go wrapper around an instance of the DataCollection JavaScript class.
type DataCollection struct {
	VM           *duktape.Context
	Stub         shim.ChaincodeStubInterface
	CollectionID string
}

// NewDataCollection creates a Go wrapper around a new instance of the DataCollection JavaScript class.
func NewDataCollection(vm *duktape.Context, dataService *DataService, stub shim.ChaincodeStubInterface, collectionID string) (result *DataCollection) {
	logger.Debug("Entering NewDataCollection", vm, dataService, &stub)
	defer func() { logger.Debug("Exiting NewDataCollection", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new data service.
	result = &DataCollection{VM: vm, Stub: stub, CollectionID: collectionID}

	// Get the data service.
	vm.PushGlobalStash()                // [ stash ]
	vm.GetPropString(-1, "dataService") // [ stash theDataService ]

	// Create a new instance of the JavaScript DataCollection class.
	vm.PushGlobalObject()                  // [ stash theDataService global ]
	vm.GetPropString(-1, "composer")       // [ stash theDataService global composer ]
	vm.GetPropString(-1, "DataCollection") // [ stash theDataService global composer DataCollection ]
	vm.Dup(-4)                             // [ stash theDataService global composer DataCollection theDataService ]
	err := vm.Pnew(1)                      // [ stash theDataService global composer theDataCollection ]
	if err != nil {
		panic(err)
	}

	// Store the data collection into the global stash.
	vm.DupTop()                            // [ stash theDataService global composer theDataCollection theDataCollection ]
	vm.PutPropString(-6, "dataCollection") // [ stash theDataService global composer theDataCollection ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getAll) // [ stash theDataService global composer theDataCollection getAll ]
	vm.PutPropString(-2, "_getAll")  // [ stash theDataService global composer theDataCollection ]
	vm.PushGoFunction(result.get)    // [ stash theDataService global composer theDataCollection get ]
	vm.PutPropString(-2, "_get")     // [ stash theDataService global composer theDataCollection ]
	vm.PushGoFunction(result.exists) // [ stash theDataService global composer theDataCollection exists ]
	vm.PutPropString(-2, "_exists")  // [ stash theDataService global composer theDataCollection ]
	vm.PushGoFunction(result.add)    // [ stash theDataService global composer theDataCollection add ]
	vm.PutPropString(-2, "_add")     // [ stash theDataService global composer theDataCollection ]
	vm.PushGoFunction(result.update) // [ stash theDataService global composer theDataCollection update ]
	vm.PutPropString(-2, "_update")  // [ stash theDataService global composer theDataCollection ]
	vm.PushGoFunction(result.remove) // [ stash theDataService global composer theDataCollection remove ]
	vm.PutPropString(-2, "_remove")  // [ stash theDataService global composer theDataCollection ]

	// Return the new data collection.
	return result
}

// getAll retreieves all of the objects in this collection from the world state.
func (dataCollection *DataCollection) getAll(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.getAll", vm)
	defer func() { logger.Debug("Exiting DataCollection.getAll", result) }()

	// Validate the arguments from JavaScript.
	vm.RequireFunction(0)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	iterator, err := dataCollection.Stub.GetStateByPartialCompositeKey(dataCollection.CollectionID, []string{})
	if err != nil {
		vm.Dup(0)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Must close iterator to free resources.
	defer iterator.Close()

	// Iterate over all the keys returned by the partial query above.
	arrIdx := vm.PushArray()
	arrCount := uint(0)
	for iterator.HasNext() {

		// Read the current key and value.
		kv, err := iterator.Next()
		if err != nil {
			vm.Dup(0)
			vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
			if vm.Pcall(1) == duktape.ExecError {
				panic(err)
			}
			return 0
		}

		// Parse the current value.
		vm.PushString(string(kv.Value))
		vm.JsonDecode(-1)
		vm.PutPropIndex(arrIdx, arrCount)
		arrCount++

	}

	// Call the callback.
	vm.Dup(0)
	vm.PushNull()
	vm.Dup(arrIdx)
	vm.Pcall(2)
	return 0
}

// get retrieves a specific object in this collection from the world state.
func (dataCollection *DataCollection) get(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.get", vm)
	defer func() { logger.Debug("Exiting DataCollection.get", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Get the collection.
	value, err := dataCollection.Stub.GetState(key)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if value == nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "Object with ID '%s' in collection with ID '%s' does not exist", id, dataCollection.CollectionID)
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Parse the current value.
	vm.PushString(string(value))
	vm.JsonDecode(-1)

	// Call the callback.
	vm.Dup(1)
	vm.PushNull()
	vm.Dup(-3)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// exists checks to see if an object exists in this collection in the world state.
func (dataCollection *DataCollection) exists(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.exists", vm)
	defer func() { logger.Debug("Exiting DataCollection.exists", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Get the object.
	value, err := dataCollection.Stub.GetState(key)
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
	vm.PushBoolean(value != nil)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// add adds an object to this collection in the world satte.
func (dataCollection *DataCollection) add(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.add", vm)
	defer func() { logger.Debug("Exiting DataCollection.add", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireObjectCoercible(1)
	force := vm.RequireBoolean(2)
	vm.RequireFunction(3)

	// Serialize the object.
	vm.Dup(1)
	vm.JsonEncode(-1)
	value := vm.RequireString(-1)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id})
	if err != nil {
		vm.Dup(3)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	if !force {
		// Check to see if the object already exists.
		existingValue, err := dataCollection.Stub.GetState(key)
		if err != nil {
			vm.Dup(3)
			vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
			if vm.Pcall(1) == duktape.ExecError {
				panic(err)
			}
			return 0
		} else if existingValue != nil {
			vm.Dup(3)
			vm.PushErrorObjectVa(duktape.ErrError, "Failed to add object with ID '%s' as the object already exists", id)
			if vm.Pcall(1) == duktape.ExecError {
				panic(err)
			}
			return 0
		}
	}

	// Store the object in the collection.
	err = dataCollection.Stub.PutState(key, []byte(value))
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Call the callback.
	vm.Dup(3)
	vm.PushNull()
	if vm.Pcall(1) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// update updates an existing object in this collection in the world state.
func (dataCollection *DataCollection) update(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.update", vm)
	defer func() { logger.Debug("Exiting DataCollection.update", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireObjectCoercible(1)
	vm.RequireFunction(2)

	// Serialize the object.
	vm.Dup(1)
	vm.JsonEncode(-1)
	value := vm.RequireString(-1)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id})
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Check to see if the object already exists.
	existingValue, err := dataCollection.Stub.GetState(key)
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if existingValue == nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "Failed to update object with ID '%s' as the object does not exist", id)
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Store the object in the collection.
	err = dataCollection.Stub.PutState(key, []byte(value))
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Call the callback.
	vm.Dup(2)
	vm.PushNull()
	if vm.Pcall(1) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0
}

// remove removes an object from this collection in the world state.
func (dataCollection *DataCollection) remove(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.remove", vm)
	defer func() { logger.Debug("Exiting DataCollection.remove", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Check to see if the object already exists.
	existingValue, err := dataCollection.Stub.GetState(key)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if existingValue == nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "Failed to delete object with ID '%s' as the object does not exist", id)
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	// Remove the object from the collection.
	err = dataCollection.Stub.DelState(key)
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
