/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

package main

import "github.com/hyperledger/fabric/core/chaincode/shim"

// Chaincode is the chaincode class. It is an implementation of the
// Chaincode interface.
type Chaincode struct {
	ConcertoPool *ConcertoPool
}

// NewChaincode creates a new instance of the Chaincode chaincode class.
func NewChaincode() (result *Chaincode) {
	logger.Debug("Entering NewChaincode")
	defer func() { logger.Debug("Exiting NewChaincode", result) }()

	return &Chaincode{
		ConcertoPool: NewConcertoPool(8),
	}
}

// Init is called by the Hyperledger Fabric when the chaincode is deployed.
// Init can read from and write to the world state.
func (chaincode *Chaincode) Init(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Init", stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Init", string(result), err) }()

	concerto := chaincode.ConcertoPool.Get()
	defer chaincode.ConcertoPool.Put(concerto)
	return concerto.Init(stub, function, arguments)
}

// Invoke is called by the Hyperledger Fabric when the chaincode is invoked.
// Invoke can read from and write to the world state.
func (chaincode *Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Invoke", stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Invoke", string(result), err) }()

	concerto := chaincode.ConcertoPool.Get()
	defer chaincode.ConcertoPool.Put(concerto)
	return concerto.Invoke(stub, function, arguments)
}

// Query is called by the Hyperledger Fabric when the chaincode is queried.
// Query can read from, but not write to the world state.
func (chaincode *Chaincode) Query(stub shim.ChaincodeStubInterface, function string, arguments []string) (result []byte, err error) {
	logger.Debug("Entering Chaincode.Query", stub, function, arguments)
	defer func() { logger.Debug("Exiting Chaincode.Query", string(result), err) }()

	concerto := chaincode.ConcertoPool.Get()
	defer chaincode.ConcertoPool.Put(concerto)
	return concerto.Query(stub, function, arguments)
}
