package main

import (
	"bytes"
	"encoding/json"

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
	vm.PushGoFunction(result.query) // [global composer theQueryService query]
	vm.PushString("bind")           // [global composer theQueryService query "bind"]
	vm.Dup(-3)                      // [global composer theQueryService query "bind" theQueryService]
	vm.PcallProp(-3, 1)             // [global composer theQueryService query boundCommit ]
	vm.PutPropString(-3, "_query")  // [global composer theQueryService ]

	// return a new query service

	return result
}

// HTTP POST to a URL and return the response to the caller
func (queryService *QueryService) query(vm *duktape.Context) (result int) {
	logger.Debug("Entering QueryService.query", vm)
	defer func() { logger.Debug("Exiting QueryService.query", result) }()

	vm.PushThis()                //[theQueryService]
	vm.PushString("queryString") //[ theQueryService queryString ]
	vm.GetProp(-2)               //[ theQueryService theQueryString ]

	queryString := vm.RequireString(-1)
	logger.Debug("QueryService.queryString", queryString)
	vm.Pop() // [theQueryService]

	logger.Debug("QueryService.queryString is using this:", queryString)
	resultsIterator, err := queryService.Stub.GetQueryResult(queryString)
	if err != nil {
		logger.Error("QueryService failed to get result interator", err)
		vm.PushString("Error!")
		return 1
	}
	defer resultsIterator.Close()

	logger.Debug("QueryService got an iterator", resultsIterator)

	if err != nil {
		logger.Debug("QueryService got an err?")
		panic(err)
	}

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	logger.Debug("QueryService before navigate the result")
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		logger.Debug("QueryService inside Next()")
		key, value, err := resultsIterator.Next()
		if err != nil {
			panic(err)
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(key)
		buffer.WriteString("\"")

		logger.Debug("QueryService inside Next()", key)

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	logger.Debug("QueryService return value ", buffer.String())

	var tempValue []byte
	tempValue, err = json.Marshal(buffer.String())
	logger.Debug("QueryService return tempValue", string(tempValue))
	if err != nil {
		panic(err)
	}

	vm.PushString("Promise.resolve(" + string(tempValue) + ")")
	vm.Eval()

	// return the top of the stack to the JS caller
	return 1
}
