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

import (
	"fmt"
	"sync"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// The big ugly mutex to work around FAB-860.
var bigUglyMutex = &sync.Mutex{}

// The logger for all code in this chaincode.
var logger = shim.NewLogger("Concerto")

// main starts the shim, which establishes the connection to the Hyperledger
// Fabric and registers the chaincode for deploys, queries, and invokes.
func main() {
	logger.Debug("Entering main")
	defer func() { logger.Debug("Exiting main") }()
	chaincode := NewChaincode()
	err := shim.Start(chaincode)
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
