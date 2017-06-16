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
func (chaincode *Chaincode) Init(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Init", &stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Init", string(result), err) }()

	composer := chaincode.ComposerPool.Get()
	defer chaincode.ComposerPool.Put(composer)
	return composer.Init(stub, function, arguments)
}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (chaincode *Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Invoke", &stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Invoke", string(result), err) }()

	composer := chaincode.ComposerPool.Get()
	defer chaincode.ComposerPool.Put(composer)
	return composer.Invoke(stub, function, arguments)
}

// Query is called by the Hyperledger Fabric when the chaincode is queried.
// Query can read from, but not write to the world state.
func (chaincode *Chaincode) Query(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Query", &stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Query", string(result), err) }()

	composer := chaincode.ComposerPool.Get()
	defer chaincode.ComposerPool.Put(composer)
	return composer.Query(stub, function, arguments)
}
