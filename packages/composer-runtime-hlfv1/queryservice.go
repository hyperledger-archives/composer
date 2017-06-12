package main

import (
	"bytes"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	duktape "gopkg.in/olebedev/go-duktape.v3"
)

//https://github.com/hyperledger/fabric/blob/v1.0.0-alpha/core/chaincode/shim/interfaces.go

// "github.com/hyperledger/fabric/core/chaincode/shim"

// QueryService is a go wrapper around the QueryService JavaScript class
type QueryService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// HTTPResponse is the response for a HTTP POST
// type HTTPResponse struct {
// 	StatusCode int 'json:StatusCode'
// 	Body       string 'json:"body'
// }

// NewQueryService creates a Go Wrapper around a new instance of the QueryService JavaScript class
func NewQueryService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *QueryService) {
	logger.Debug("Entering QueryService", vm, context, &stub)
	defer func() { logger.Debug("Exiting QueryService", result) }()

	// Ensure the JavaScript stack is reset
	defer vm.SetTop(vm.GetTop())

	// Create a new Query service
	result = &QueryService{VM: vm, Stub: stub}

	// Create a new instance of the JavaScript QueryService class
	vm.PushGlobalObject()                // [ global ]
	vm.GetPropString(-1, "composer")     // [ global composer ]
	vm.GetPropString(-1, "QueryService") //[ global composer QueryService ]
	err := vm.Pnew(0)                    // [ global composer theQueryService ]
	if err != nil {
		logger.Debug("Error received on vm.Pnew(0)", err)
		panic(err)
	}

	// Store the Query service into the global stash
	vm.PushGlobalStash()                 // [ global composer theQueryService stash]
	vm.Dup(-2)                           // [ global composer theQueryService stash theQueryService ]
	vm.PutPropString(-2, "queryService") // [ global composer theQueryService stash ]
	vm.Pop()                             // [ global composer theQueryService]

	//Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.queryNative) // [global composer theQueryService query]
	vm.PushString("bind")                 // [global composer theQueryService query "bind"]
	vm.Dup(-3)                            // [global composer theQueryService query "bind" theQueryService]
	vm.PcallProp(-3, 1)                   // [global composer theQueryService query boundCommit ]
	vm.PutPropString(-3, "_queryNative")  // [global composer theQueryService ]

	// return a new query service

	return result
}

// HTTP POST to a URL and return the response to the caller
func (queryService *QueryService) queryNative(vm *duktape.Context) (result int) {
	logger.Debug("Entering QueryService.queryNative", vm)
	defer func() { logger.Debug("Exiting QueryService.queryNative", result) }()

	// Validate the arguments from JavaScript.
	queryString := vm.RequireString(0)
	vm.RequireFunction(1) // callback

	logger.Debug("QueryService.queryString is using this:", queryString)
	resultsIterator, err := queryService.Stub.GetQueryResult(queryString)
	if err != nil {
		vm.Dup(1)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		if vm.Pcall(1) == duktape.ExecError {
			panic(err)
		}
		return 0
	}
	defer resultsIterator.Close()

	logger.Debug("QueryService got an iterator", resultsIterator)

	// buffer is a JSON array containing QueryRecords
	buffer := ""
	buffer += "["

	logger.Debug("QueryService before navigate the result")
	arrIdx := vm.PushArray()
	arrNum := uint(0)
	for resultsIterator.HasNext() {
		logger.Debug("QueryService inside Next()")
		objIdx := vm.PushObject()
		current, err := resultsIterator.Next()
		if err != nil {
			vm.Dup(1)
			vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
			if vm.Pcall(1) == duktape.ExecError {
				panic(err)
			}
			return 0
		}
		logger.Debug("returned key.Key = ", current.Key)
		byteArray := []byte(current.Key)
		withoutNull := bytes.Replace(byteArray, []byte("\x00"), []byte("|"), -1)
		vm.PushString(string(withoutNull))
		vm.PutPropString(objIdx, "Key")
		vm.PushString(string(current.Value))
		vm.PutPropString(objIdx, "Record")
		vm.PutPropIndex(arrIdx, arrNum)
		arrNum++
	}

	// Call the callback.
	vm.Dup(1)
	vm.PushNull() // no error
	vm.Dup(arrIdx)
	vm.Pcall(2)
	return 0
}
