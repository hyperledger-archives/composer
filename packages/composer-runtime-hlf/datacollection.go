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
	VM        *duktape.Context
	Stub      shim.ChaincodeStubInterface
	TableName string
}

// NewDataCollection creates a Go wrapper around a new instance of the DataCollection JavaScript class.
func NewDataCollection(vm *duktape.Context, dataService *DataService, stub shim.ChaincodeStubInterface, tableName string) (result *DataCollection) {
	logger.Debug("Entering NewDataCollection", vm, dataService, stub)
	defer func() { logger.Debug("Exiting NewDataCollection", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new data service.
	result = &DataCollection{VM: vm, Stub: stub, TableName: tableName}

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

	bigUglyMutex.Lock()         // FAB-860 avoidance hack.
	defer bigUglyMutex.Unlock() // FAB-860 avoidance hack.
	rows, err := dataCollection.Stub.GetRows(dataCollection.TableName, []shim.Column{})
	if err != nil {
		vm.Dup(0)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	arrIdx := vm.PushArray()
	arrCount := uint(0)
	for row := range rows {
		data := row.GetColumns()[1].GetString_()
		vm.PushString(data)
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

	row, err := dataCollection.Stub.GetRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id}}})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if len(row.GetColumns()) == 0 {
		vm.Dup(1)
		vm.PushErrorObject(duktape.ErrError, "Object with ID '%s' in collection with ID '%s' does not exist", []interface{}{id, dataCollection.TableName})
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}

	data := row.GetColumns()[1].GetString_()
	logger.Debug("---> DATA RETURNED --->", data)
	logger.Debug("vm stack val:", vm.GetTop());

	// This stops the SIGSEGV locally on my machine
	logger.Debug("pushing own string")
	//vm.PushString("{\"data\":\"UEsDBAoAAAAAAMSCnUoL2Hp7bgAAAG4AAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoic3lzdGVzdC5wYXJ0aWNpcGFudHMiLCJ2ZXJzaW9uIjoiMC4wLjEiLCJkZXNjcmlwdGlvbiI6IlRoZSBuZXR3b3JrIGZvciB0aGUgcGFydGljaXBhbnQgc3lzdGVtIHRlc3RzIn1QSwMECgAAAAAAxIKdSgAAAAAAAAAAAAAAAAcAAABtb2RlbHMvUEsDBAoAAAAAAMSCnUpqwINnQQQAAEEEAAAfAAAAbW9kZWxzL3N5c3Rlc3QucGFydGljaXBhbnRzLmN0b25hbWVzcGFjZSBzeXN0ZXN0LnBhcnRpY2lwYW50cwoKZW51bSBTaW1wbGVFbnVtIHsKICAgIG8gV09XCiAgICBvIFNVQ0gKICAgIG8gTUFOWQogICAgbyBNVUNICn0KCnBhcnRpY2lwYW50IFNpbXBsZVBhcnRpY2lwYW50IGlkZW50aWZpZWQgYnkgcGFydGljaXBhbnRJZCB7CiAgICBvIFN0cmluZyBwYXJ0aWNpcGFudElkCiAgICBvIFN0cmluZyBzdHJpbmdWYWx1ZQogICAgbyBTdHJpbmdbXSBzdHJpbmdWYWx1ZXMKICAgIG8gRG91YmxlIGRvdWJsZVZhbHVlCiAgICBvIERvdWJsZVtdIGRvdWJsZVZhbHVlcwogICAgbyBJbnRlZ2VyIGludGVnZXJWYWx1ZQogICAgbyBJbnRlZ2VyW10gaW50ZWdlclZhbHVlcwogICAgbyBMb25nIGxvbmdWYWx1ZQogICAgbyBMb25nW10gbG9uZ1ZhbHVlcwogICAgbyBEYXRlVGltZSBkYXRlVGltZVZhbHVlCiAgICBvIERhdGVUaW1lW10gZGF0ZVRpbWVWYWx1ZXMKICAgIG8gQm9vbGVhbiBib29sZWFuVmFsdWUKICAgIG8gQm9vbGVhbltdIGJvb2xlYW5WYWx1ZXMKICAgIG8gU2ltcGxlRW51bSBlbnVtVmFsdWUKICAgIG8gU2ltcGxlRW51bVtdIGVudW1WYWx1ZXMKfQoKcGFydGljaXBhbnQgU2ltcGxlUGFydGljaXBhbnRDb250YWluZXIgaWRlbnRpZmllZCBieSBwYXJ0aWNpcGFudElkIHsKICAgIG8gU3RyaW5nIHBhcnRpY2lwYW50SWQKICAgIG8gU2ltcGxlUGFydGljaXBhbnQgc2ltcGxlUGFydGljaXBhbnQKICAgIG8gU2ltcGxlUGFydGljaXBhbnRbXSBzaW1wbGVQYXJ0aWNpcGFudHMKfQoKcGFydGljaXBhbnQgU2ltcGxlUGFydGljaXBhbnRSZWxhdGlvbnNoaXBDb250YWluZXIgaWRlbnRpZmllZCBieSBwYXJ0aWNpcGFudElkIHsKICAgIG8gU3RyaW5nIHBhcnRpY2lwYW50SWQKICAgIC0tPiBTaW1wbGVQYXJ0aWNpcGFudCBzaW1wbGVQYXJ0aWNpcGFudAogICAgLS0+IFNpbXBsZVBhcnRpY2lwYW50W10gc2ltcGxlUGFydGljaXBhbnRzCn0KCnBhcnRpY2lwYW50IFNpbXBsZVBhcnRpY2lwYW50Q2lyY2xlIGlkZW50aWZpZWQgYnkgcGFydGljaXBhbnRJZCB7CiAgICBvIFN0cmluZyBwYXJ0aWNpcGFudElkCiAgICAtLT4gU2ltcGxlUGFydGljaXBhbnRDaXJjbGUgbmV4dAp9ClBLAQIUAAoAAAAAAMSCnUoL2Hp7bgAAAG4AAAAMAAAAAAAAAAAAAAAAAAAAAABwYWNrYWdlLmpzb25QSwECFAAKAAAAAADEgp1KAAAAAAAAAAAAAAAABwAAAAAAAAAAABAAAACYAAAAbW9kZWxzL1BLAQIUAAoAAAAAAMSCnUpqwINnQQQAAEEEAAAfAAAAAAAAAAAAAAAAAL0AAABtb2RlbHMvc3lzdGVzdC5wYXJ0aWNpcGFudHMuY3RvUEsFBgAAAAADAAMAvAAAADsFAAAAAA==\",\"hash\":\"9112fb29de604c30fd9f17437b8633171624b266faedc894bf47902fe1a4fe03\"}")
	vm.PushString("{\"data\":\"fred\",\"hash\":\"fred\"}")
	
	logger.Debug("psuhed own string")

	vm.Pop();
	vm.PushString(data)
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

// exists ...
func (dataCollection *DataCollection) exists(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.exists", vm)
	defer func() { logger.Debug("Exiting DataCollection.exists", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	row, err := dataCollection.Stub.GetRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id}}})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} 
	
	// Call the callback.
	vm.Dup(1)
	vm.PushNull()
	vm.PushBoolean(len(row.GetColumns()) != 0)
	if vm.Pcall(2) == duktape.ExecError {
		panic(vm.ToString(-1))
	}
	return 0

}

// add adds an object to this collection in the world satte.
func (dataCollection *DataCollection) add(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.add", vm)
	defer func() { logger.Debug("Exiting DataCollection.add", result) }()

	// force is ignored for this connector. Its provided by the runtime and is required for
	// hyper V1 support.
	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireObjectCoercible(1)
	//force := vm.RequireBoolean(2)
	vm.RequireFunction(3)

	// Serialize the object.
	vm.Dup(1)
	vm.JsonEncode(-1)
	data := vm.RequireString(-1)

	inserted, err := dataCollection.Stub.InsertRow(
		dataCollection.TableName,
		shim.Row{
			Columns: []*shim.Column{
				{Value: &shim.Column_String_{String_: id}},
				{Value: &shim.Column_String_{String_: data}},
			},
		},
	)
	if err != nil {
		vm.Dup(3)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if !inserted {
		vm.Dup(3)
		vm.PushErrorObject(duktape.ErrError, "Failed to insert row with id '%s' as row already exists", id)
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

// update ...
func (dataCollection *DataCollection) update(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.update", vm)
	defer func() { logger.Debug("Exiting DataCollection.update", result) }()

	id := vm.RequireString(0)
	vm.RequireObjectCoercible(1)
	vm.RequireFunction(2)

	// Serialize the object.
	vm.Dup(1)
	vm.JsonEncode(-1)
	data := vm.RequireString(-1)

	updated, err := dataCollection.Stub.ReplaceRow(
		dataCollection.TableName,
		shim.Row{
			Columns: []*shim.Column{
				{Value: &shim.Column_String_{String_: id}},
				{Value: &shim.Column_String_{String_: data}},
			},
		},
	)
	if err != nil {
		vm.Dup(2)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	} else if !updated {
		vm.Dup(2)
		vm.PushErrorObject(duktape.ErrError, "Failed to update row with id '%s' as row does not exist", id)
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

// remove ...
func (dataCollection *DataCollection) remove(vm *duktape.Context) (result int) {
	logger.Debug("Entering DataCollection.remove", vm)
	defer func() { logger.Debug("Exiting DataCollection.remove", result) }()

	// Validate the arguments from JavaScript.
	id := vm.RequireString(0)
	vm.RequireFunction(1)

	err := dataCollection.Stub.DeleteRow(dataCollection.TableName, []shim.Column{{Value: &shim.Column_String_{String_: id}}})
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObject(duktape.ErrError, "%s", err.Error())
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
