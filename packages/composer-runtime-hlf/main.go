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
	"fmt"
	"sync"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// The big ugly mutex to work around FAB-860.
var bigUglyMutex = &sync.Mutex{}

// The logger for all code in this chaincode.
var logger = shim.NewLogger("Composer")

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
