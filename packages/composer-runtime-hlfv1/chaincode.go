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



// Chaincode is the chaincode class. It is an implementation of the
// Chaincode interface.
type Chaincode struct {
	ComposerPool *ComposerPool
}

// NewChaincode creates a new instance of the Chaincode chaincode class.
func NewChaincode() (result *Chaincode) {
	logger.Debug("Entering NewChaincode")
	defer func() { logger.Debug("Exiting NewChaincode", result) }()
	logger.Info("Setting the Composer pool size to", PoolSize)
	return &Chaincode{
		ComposerPool: NewComposerPool(PoolSize),
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
	payload, err := composer.Invoke(stub, function, arguments)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(payload)
}
