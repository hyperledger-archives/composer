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
	"bytes"
	"encoding/json"
	"io/ioutil"
	"net/http"

	duktape "gopkg.in/olebedev/go-duktape.v3"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// HTTPService is a go wrapper around the HTTPService JavaScript class
type HTTPService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// HTTPResponse is the response for a HTTP POST
type HTTPResponse struct {
	StatusCode int    `json:"statusCode"`
	Body       string `json:"body"`
}

// NewHTTPService creates a Go wrapper around a new instance of the HTTPService JavaScript class.
func NewHTTPService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *HTTPService) {
	logger.Debug("Entering HTTPService", vm, context, &stub)
	defer func() { logger.Debug("Exiting HTTPService", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create a new http service
	result = &HTTPService{VM: vm, Stub: stub}

	//Create a new instance of the JavaScript HTTPService class.
	vm.PushGlobalObject()               // [ global ]
	vm.GetPropString(-1, "composer")    // [ global composer ]
	vm.GetPropString(-1, "HTTPService") // [ global composer HTTPService ]
	err := vm.Pnew(0)                   // [ global composer theHTTPService ]
	if err != nil {
		panic(err)
	}

	// Store the http service into the global stash.
	vm.PushGlobalStash()                // [ global composer theHTTPService stash ]
	vm.Dup(-2)                          // [ global composer theHTTPService stash theHTTPService ]
	vm.PutPropString(-2, "httpService") // [ global composer theHTTPService stash ]
	vm.Pop()                            // [ global composer theHTTPService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.post) // [ global composer theHTTPService post ]
	vm.PushString("bind")          // [ global composer theHTTPService post "bind" ]
	vm.Dup(-3)                     // [ global composer theHTTPService post "bind" theHTTPService ]
	vm.PcallProp(-3, 1)            // [ global composer theHTTPService post boundCommit ]
	vm.PutPropString(-3, "_post")  // [ global composer theHTTPService _post ]

	// Return a new http service
	return result
}

// HTTP POST to a URL and return a Promise to the reponse to the caller
func (httpService *HTTPService) post(vm *duktape.Context) (result int) {
	logger.Debug("Entering HTTPService.post", vm)
	defer func() { logger.Debug("Exiting HTTPService.post", result) }()

	vm.PushThis()         // [ theHttpService ]
	vm.PushString("data") // [ theHttpService data ]
	vm.GetProp(-2)        // [ theHttpService theData ]
	vm.JsonEncode(-1)     // [ theHttpService theDataJson ]
	data := vm.RequireString(-1)
	logger.Debug("HTTPService.post data", data)
	vm.Pop()                    // [ theHttpService ]
	vm.PushString("url")        // [ theHttpService url ]
	vm.GetProp(-2)              // [ theHttpService theURL ]
	url := vm.RequireString(-1) // [ theHttpService, theUrl ]
	logger.Debug("HTTPService.post url", url)
	vm.Pop() // [ theHttpService ]

	var jsonStr = []byte(data)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
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

	// push a Promise that resolves to the JSON response as a string
	vm.PushString("Promise.resolve(" + string(jsonResponse) + ")")
	vm.Eval()

	// a return code of 1 signifies that the top of the stack should be returned to the caller
	return 1
}
