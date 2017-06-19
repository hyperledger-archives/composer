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

import "github.com/hyperledger/fabric/core/chaincode/shim"
import pb "github.com/hyperledger/fabric/protos/peer"
import "os"
import "strings"

// enable logging based on either world state or env variable.
// default to INFO if neither have a value.
func EnableLogging(stub shim.ChaincodeStubInterface) {
	var levelStr string
	levelBytes, err := stub.GetState("ComposerLogLevel")
	if err != nil || levelBytes == nil {
		var isSet bool
		levelStr, isSet = os.LookupEnv("CORE_CHAINCODE_LOGGING_LEVEL")
		if !isSet {
			levelStr = "INFO"
		}
	} else {
		levelStr = string(levelBytes)
	}

	level, _ := shim.LogLevel(levelStr)
	logger.SetLevel(level)
}

// explicitly set the logging to a specific level
func SetLogging(stub shim.ChaincodeStubInterface, levelStr string) {
	//We could check that the levelStr is valid but
	//currently if it isn't then I think shim.LogLevel will return a default of loglevel of Error.
	newLevel := strings.ToUpper(levelStr)
	stub.PutState("ComposerLogLevel", []byte(newLevel))
	level, _ := shim.LogLevel(newLevel)
	logger.SetLevel(level)
	logger.Warning("Setting loglevel to", newLevel)
}

// Chaincode is the chaincode class. It is an implementation of the
// Chaincode interface.
type Chaincode struct {
	ComposerPool *ComposerPool
}

// NewChaincode creates a new instance of the Chaincode chaincode class.
func NewChaincode() (result *Chaincode) {
	logger.Debug("Entering NewChaincode")
	defer func() { logger.Debug("Exiting NewChaincode", result) }()

	return &Chaincode{
		ComposerPool: NewComposerPool(8),
	}
}

// Init is called by the Hyperledger Fabric when the chaincode is deployed.
// Init can read from and write to the world state.
func (chaincode *Chaincode) Init(stub shim.ChaincodeStubInterface) (response pb.Response) {
	//logging needs to be set here again as the fabric chaincode disables it
	//even though it was enabled in main.
	EnableLogging(stub)
	logger.Debug("Entering Chaincode.Init", &stub)
	defer func() {
		logger.Debug("Exiting Chaincode.Init", response.Status, response.Message, string(response.Payload))
	}()

	// Get an instance of Composer from the pool, and ensure it's returned.
	composer := chaincode.ComposerPool.Get()
	defer chaincode.ComposerPool.Put(composer)

	// Execute the init function.
	function, arguments := stub.GetFunctionAndParameters()

	// look for -d loglevel and set log and remove
	// from arguments
	var loglevel string
	for i, value := range arguments {
		if value == "-d" && (i+1) < len(arguments) {
			loglevel = arguments[i+1]
			arguments = append(arguments[:i], arguments[i+2:]...)
			SetLogging(stub, loglevel)
		}
	}
	payload, err := composer.Init(stub, function, arguments)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(payload)
}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (chaincode *Chaincode) Invoke(stub shim.ChaincodeStubInterface) (response pb.Response) {
	//logging needs to be set here again as the fabric chaincode disables it
	//even though it was enabled in main.
	EnableLogging(stub)
	logger.Debug("Entering Chaincode.Invoke", &stub)
	defer func() {
		logger.Debug("Exiting Chaincode.Invoke", response.Status, response.Message, string(response.Payload))
	}()

	// Get an instance of Composer from the pool, and ensure it's returned.
	composer := chaincode.ComposerPool.Get()
	defer chaincode.ComposerPool.Put(composer)

	// Execute the invoke function.
	function, arguments := stub.GetFunctionAndParameters()
	if strings.ToLower(function) == "logging" {
		SetLogging(stub, arguments[0])
		return shim.Success(nil)
	} else {
		payload, err := composer.Invoke(stub, function, arguments)
		if err != nil {
			return shim.Error(err.Error())
		}
		return shim.Success(payload)
	}
}
