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
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
)

// HTTPService is a go wrapper around the HTTPService JavaScript class
type HTTPService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// HTTPResponse is the response for a HTTP POST
type HTTPResponse struct {
	StatusCode int    `json:"statusCode"`
	Body       string `json:"body"`
}

// NewHTTPService creates a Go wrapper around a new instance of the HTTPService JavaScript class.
func NewHTTPService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *HTTPService) {
	logger.Debug("Entering NewHTTPService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewHTTPService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new concerto.HTTPService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of HTTPService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of HTTPService JavaScript class is not an object")
	}
	object := temp.Object()

	// Add a pointer to the Go object into the JavaScript object.
	result = &HTTPService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in HTTPService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("_post", result.post)
	return result
}

// HTTP POST to an external REST service and return a Promise to the results
func (httpService *HTTPService) post(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering HTTPService.post", call)
	defer func() { logger.Debug("Exiting HTTPService.post", result) }()

	urlValue, err := call.This.Object().Get("url")

	if err != nil {
		panic(err)
	}

	url, err := urlValue.ToString()

	if err != nil {
		panic(err)
	}

	dataValue, err := call.This.Object().Get("data")

	// if err != nil {
	// 	panic(err)
	// }

	// data, err := dataValue.ToString()

	if err != nil {
		panic(err)
	}

	dataJSONValue, err := call.Otto.Call("JSON.stringify", nil, dataValue)

	if err != nil {
		panic(err)
	}

	dataJSON, err := dataJSONValue.ToString()

	if err != nil {
		panic(err)
	}

	logger.Debug("HTTPService.post data", dataJSON)
	logger.Debug("HTTPService.post url", url)

	req, err := http.NewRequest("POST", url, strings.NewReader(dataJSON))
	req.Header.Set("X-Composer-Version", version)
	req.Header.Set("Content-Type", "application/json")

	var statusCode = 200
	var responseBody = "OK"

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logger.Error("Error POSTing data:", err)
		statusCode = 500
		responseBody = err.Error()
	} else {
		defer resp.Body.Close()
		logger.Debug("HTTPService response Status:", resp.Status)
		logger.Debug("HTTPService response Headers:", resp.Header)
		body, _ := ioutil.ReadAll(resp.Body)
		statusCode = resp.StatusCode
		responseBody = string(body)
		logger.Debug("HTTPService response Body:", responseBody)
	}

	var response HTTPResponse
	response.StatusCode = statusCode
	response.Body = responseBody
	jsonResponse, err := json.Marshal(response)

	logger.Info("JSON response " + string(jsonResponse))

	promise, err := call.Otto.Call("Promise.resolve", nil, string(jsonResponse))

	if err != nil {
		panic(err)
	}

	return promise
}
