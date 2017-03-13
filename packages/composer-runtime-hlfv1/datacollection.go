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

// DataCollection is a Go wrapper around an instance of the DataCollection JavaScript class.
type DataCollection struct {
	This         *otto.Object
	Stub         shim.ChaincodeStubInterface
	CollectionID string
}

// NewDataCollection creates a Go wrapper around a new instance of the DataCollection JavaScript class.
func NewDataCollection(vm *otto.Otto, dataService *DataService, stub shim.ChaincodeStubInterface, collectionID string) (result *DataCollection) {
	logger.Debug("Entering NewDataCollection", vm, dataService, stub)
	defer func() { logger.Debug("Exiting NewDataCollection", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new composer.DataCollection", nil, dataService.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of DataCollection JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of DataCollection JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &DataCollection{This: temp.Object(), Stub: stub, CollectionID: collectionID}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in DataCollection JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("_getAll", result.getAll)
	result.This.Set("_get", result.get)
	result.This.Set("_exists", result.exists)
	result.This.Set("_add", result.add)
	result.This.Set("_update", result.update)
	result.This.Set("_remove", result.remove)
	return result

}

// getAll retreieves all of the objects in this collection from the world state.
func (dataCollection *DataCollection) getAll(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.getAll", call)
	defer func() { logger.Debug("Exiting DataCollection.getAll", result) }()

	// Validate the arguments from JavaScript.
	callback := call.Argument(0)
	if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	iterator, err := dataCollection.Stub.GetStateByPartialCompositeKey(dataCollection.CollectionID, []string{})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Must close iterator to free resources.
	defer iterator.Close()

	// Iterate over all the keys returned by the partial query above.
	objects := []interface{}{}
	for iterator.HasNext() {

		// Read the current key and value.
		_, value, err := iterator.Next()
		if err != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		}

		// Parse the current value.
		object, err := call.Otto.Call("JSON.parse", nil, string(value))
		if err != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		}
		objects = append(objects, object)

	}
	_, err = callback.Call(callback, nil, objects)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// get retrieves a specific object in this collection from the world state.
func (dataCollection *DataCollection) get(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.get", call)
	defer func() { logger.Debug("Exiting DataCollection.get", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Get the collection.
	value, err := dataCollection.Stub.GetState(key)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if value == nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Object with ID '%s' in collection with ID '%s' does not exist", id, dataCollection.CollectionID)))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Parse the current value.
	object, err := call.Otto.Call("JSON.parse", nil, string(value))
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	_, err = callback.Call(callback, nil, object)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// exists checks to see if an object exists in this collection in the world state.
func (dataCollection *DataCollection) exists(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.exists", call)
	defer func() { logger.Debug("Exiting DataCollection.exists", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Get the object.
	value, err := dataCollection.Stub.GetState(key)
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

// add adds an object to this collection in the world satte.
func (dataCollection *DataCollection) add(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.add", call)
	defer func() { logger.Debug("Exiting DataCollection.add", result) }()

	// Validate the arguments from JavaScript.
	id, object, force, callback := call.Argument(0), call.Argument(1), call.Argument(2), call.Argument(3)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !object.IsObject() {
		panic(fmt.Errorf("object not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	} else if !force.IsBoolean() {
		panic(fmt.Errorf("force not specified or is not a boolean"))
	}

	// Serialize the object.
	value, err := call.Otto.Call("JSON.stringify", nil, object)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	forceVal, err := force.ToBoolean()
	if !forceVal  {
		// Check to see if the object already exists.
		existingValue, err := dataCollection.Stub.GetState(key)
		if err != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		} else if existingValue != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to add object with ID '%s' as the object already exists", id)))
			if err != nil {
				panic(err)
			}
			return otto.UndefinedValue()
		}
	}

	// Store the object in the collection.
	err = dataCollection.Stub.PutState(key, []byte(value.String()))
	_, err = callback.Call(callback, nil)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// update updates an existing object in this collection in the world state.
func (dataCollection *DataCollection) update(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.update", call)
	defer func() { logger.Debug("Exiting DataCollection.update", result) }()

	// Validate the arguments from JavaScript.
	id, object, callback := call.Argument(0), call.Argument(1), call.Argument(2)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !object.IsObject() {
		panic(fmt.Errorf("object not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Serialize the object.
	value, err := call.Otto.Call("JSON.stringify", nil, object)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Check to see if the object already exists.
	existingValue, err := dataCollection.Stub.GetState(key)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if existingValue == nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to update object with ID '%s' as the object does not exist", id)))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Store the object in the collection.
	err = dataCollection.Stub.PutState(key, []byte(value.String()))
	_, err = callback.Call(callback, nil)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}

// remove removes an object from this collection in the world state.
func (dataCollection *DataCollection) remove(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.remove", call)
	defer func() { logger.Debug("Exiting DataCollection.remove", result) }()

	// Validate the arguments from JavaScript.
	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}

	// Create the composite key.
	// The objects are stored with composite keys of collectionID + objectID.
	key, err := dataCollection.Stub.CreateCompositeKey(dataCollection.CollectionID, []string{id.String()})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Check to see if the object already exists.
	existingValue, err := dataCollection.Stub.GetState(key)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if existingValue == nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to delete object with ID '%s' as the object does not exist", id)))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}

	// Store the object in the collection.
	err = dataCollection.Stub.DelState(key)
	_, err = callback.Call(callback, nil)
	if err != nil {
		panic(err)
	}
	return otto.UndefinedValue()
}
