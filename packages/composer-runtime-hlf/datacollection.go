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
	This      *otto.Object
	Stub      shim.ChaincodeStubInterface
	TableName string
}

// NewDataCollection creates a Go wrapper around a new instance of the DataCollection JavaScript class.
func NewDataCollection(vm *otto.Otto, dataService *DataService, stub shim.ChaincodeStubInterface, tableName string) (result *DataCollection) {
	logger.Debug("Entering NewDataCollection", vm, dataService, stub)
	defer func() { logger.Debug("Exiting NewDataCollection", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.DataCollection", nil, dataService.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of DataCollection JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of DataCollection JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &DataCollection{This: temp.Object(), Stub: stub, TableName: tableName}
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

// getAll ...
func (dataCollection *DataCollection) getAll(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.getAll", call)
	defer func() { logger.Debug("Exiting DataCollection.getAll", result) }()

	callback := call.Argument(0)
	if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	bigUglyMutex.Lock()         // FAB-860 avoidance hack.
	defer bigUglyMutex.Unlock() // FAB-860 avoidance hack.
	rows, err := dataCollection.Stub.GetRows(dataCollection.TableName, []shim.Column{})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	objects := []interface{}{}
	for row := range rows {
		data := row.GetColumns()[1].GetString_()
		object, err2 := call.Otto.Call("JSON.parse", nil, data)
		if err2 != nil {
			_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err2.Error()))
			if err2 != nil {
				panic(err2)
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

// get ...
func (dataCollection *DataCollection) get(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.get", call)
	defer func() { logger.Debug("Exiting DataCollection.get", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	row, err := dataCollection.Stub.GetRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id.String()}}})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if len(row.GetColumns()) == 0 {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Object with ID '%s' in collection with ID '%s' does not exist", id, dataCollection.TableName)))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	data := row.GetColumns()[1].GetString_()
	object, err := call.Otto.Call("JSON.parse", nil, data)
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

// exists ...
func (dataCollection *DataCollection) exists(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.exists", call)
	defer func() { logger.Debug("Exiting DataCollection.exists", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	row, err := dataCollection.Stub.GetRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id.String()}}})
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if len(row.GetColumns()) == 0 {
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

// add ...
func (dataCollection *DataCollection) add(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.add", call)
	defer func() { logger.Debug("Exiting DataCollection.add", result) }()

	// force is ignored for this connector. Its provided by the runtime and is required for
	// hyper V1 support.
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
	
	data, err := call.Otto.Call("JSON.stringify", nil, object)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	inserted, err := dataCollection.Stub.InsertRow(
		dataCollection.TableName,
		shim.Row{
			Columns: []*shim.Column{
				{Value: &shim.Column_String_{String_: id.String()}},
				{Value: &shim.Column_String_{String_: data.String()}},
			},
		},
	)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if !inserted {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to insert row with id '%s' as row already exists", id)))
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

// update ...
func (dataCollection *DataCollection) update(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.update", call)
	defer func() { logger.Debug("Exiting DataCollection.update", result) }()

	id, object, callback := call.Argument(0), call.Argument(1), call.Argument(2)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !object.IsObject() {
		panic(fmt.Errorf("object not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	data, err := call.Otto.Call("JSON.stringify", nil, object)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	}
	updated, err := dataCollection.Stub.ReplaceRow(
		dataCollection.TableName,
		shim.Row{
			Columns: []*shim.Column{
				{Value: &shim.Column_String_{String_: id.String()}},
				{Value: &shim.Column_String_{String_: data.String()}},
			},
		},
	)
	if err != nil {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", err.Error()))
		if err != nil {
			panic(err)
		}
		return otto.UndefinedValue()
	} else if !updated {
		_, err = callback.Call(callback, call.Otto.MakeCustomError("Error", fmt.Sprintf("Failed to update row with id '%s' as row does not exist", id)))
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

// remove ...
func (dataCollection *DataCollection) remove(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering DataCollection.remove", call)
	defer func() { logger.Debug("Exiting DataCollection.remove", result) }()

	id, callback := call.Argument(0), call.Argument(1)
	if !id.IsString() {
		panic(fmt.Errorf("id not specified or is not a string"))
	} else if !callback.IsFunction() {
		panic(fmt.Errorf("callback not specified or is not a string"))
	}
	err := dataCollection.Stub.DeleteRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id.String()}}})
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
