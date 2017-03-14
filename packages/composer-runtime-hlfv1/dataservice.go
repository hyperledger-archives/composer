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
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
)

// This is the object type used to form composite keys for the collection of collections.
const collectionObjectType = "$syscollections"

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
	temp, err := vm.Call("new composer.DataService", nil, context.This)
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

// createCollection creates a collection of objects in the world state.
func (dataService *DataService) createCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.createCollection", call)
	defer func() { logger.Debug("Exiting DataService.createCollection", result) }()

	// Validate the arguments from JavaScript.
	id, force, callback := call.Argument(0), call.Argument(1), call.Argument(2)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	} else if !force.IsBoolean() {
		panic(fmt.Errorf("force not specified or is not a boolean"))		
	}

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	key, err := dataService.Stub.CreateCompositeKey(collectionObjectType, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	forceVal, err := force.ToBoolean()
	if !forceVal {
		// Check to see if the collection already exists.
		existingValue, err := dataService.Stub.GetState(key)
		if err != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		} else if existingValue != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to add collection with ID '%s' as the collection already exists", id)))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		}
	}

	// Store the collection.
	collection := map[string]interface{}{"id": id.String()}
	value, err := json.Marshal(collection)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	err = dataService.Stub.PutState(key, value)
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

// deleteCollection deletes a collection of objects in the world state.
func (dataService *DataService) deleteCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.deleteCollection", call)
	defer func() { logger.Debug("Exiting DataService.deleteCollection", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	key, err := dataService.Stub.CreateCompositeKey(collectionObjectType, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Remove all of the objects from the collection.
	err = dataService.clearCollection(id.String())
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Delete the collection.
	err = dataService.Stub.DelState(key)
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

// getCollection retrieves an existing collection from the world state.
func (dataService *DataService) getCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.getCollection", call)
	defer func() { logger.Debug("Exiting DataService.getCollection", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	key, err := dataService.Stub.CreateCompositeKey(collectionObjectType, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Get the collection.
	value, err := dataService.Stub.GetState(key)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if value == nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Collection with ID '%s' does not exist", id)))
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

// existsCollection checks to see if a collection exists in the world state.
func (dataService *DataService) existsCollection(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataService.existsCollection", call)
	defer func() { logger.Debug("Exiting DataService.existsCollection", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The collection is stored with a composite key of collection ID.
	key, err := dataService.Stub.CreateCompositeKey(collectionObjectType, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Get the collection.
	value, err := dataService.Stub.GetState(key)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	_, err = callback.Call(callback, nil, value != nil)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()

}

// clearCollection is called to clear all objects from a collection.
func (dataService *DataService) clearCollection(collectionID string) (err error) {
	logger.Debug("Entering DataService.clearCollection", collectionID)
	defer func() { logger.Debug("Exiting DataService.clearCollection", err) }()

	// We look for all objects in this collection by performing a partial query.
	// The objects are stored with composite keys of collectionID + objectID.
	iterator, err := dataService.Stub.GetStateByPartialCompositeKey(collectionID, []string{})
	if err != nil {
		return err
	}

	// Must close iterator to free resources.
	defer iterator.Close()

	// Iterate over all the keys returned by the partial query above.
	for iterator.HasNext() {

		// Read the current key.
		key, _, err := iterator.Next()
		if err != nil {
			return err
		}

		// Delete the current key.
		err = dataService.Stub.DelState(key)
		if err != nil {
			return err
		}

	}
	return nil
}
