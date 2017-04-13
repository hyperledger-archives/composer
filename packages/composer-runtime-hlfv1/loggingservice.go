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
	"github.com/hyperledger/fabric/core/chaincode/shim"
	duktape "gopkg.in/olebedev/go-duktape.v3"
)

// LoggingService is a Go wrapper around an instance of the LoggingService JavaScript class.
type LoggingService struct {
	Stub shim.ChaincodeStubInterface
}

// NewLoggingService creates a Go wrapper around a new instance of the LoggingService JavaScript class.
func NewLoggingService(vm *duktape.Context, container *Container, stub shim.ChaincodeStubInterface) (result *LoggingService) {
	logger.Debug("Entering NewLoggingService", vm, container, stub)
	defer func() { logger.Debug("Exiting NewLoggingService", result) }()

	// Create the new logging service.
	result = &LoggingService{Stub: stub}

	// Create a new instance of the JavaScript LoggingService class.
	vm.PushGlobalObject()                  // [ global ]
	vm.GetPropString(-1, "composer")       // [ global composer ]
	vm.GetPropString(-1, "LoggingService") // [ global composer LoggingService ]
	vm.New(0)                              // [ global composer theLoggingService ]

	// Store the LoggingService into the global stash.
	vm.PushGlobalStash()                   // [ global composer theLoggingService stash ]
	vm.Dup(-2)                             // [ global composer theLoggingService stash theLoggingService  ]
	vm.PutPropString(-2, "loggingService") // [ global composer theLoggingService stash ]
	vm.Pop()                               // [ global composer theLoggingService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.logCritical)
	vm.PutPropString(-2, "logCritical")
	vm.PushGoFunction(result.logDebug)
	vm.PutPropString(-2, "logDebug")
	vm.PushGoFunction(result.logError)
	vm.PutPropString(-2, "logError")
	vm.PushGoFunction(result.logInfo)
	vm.PutPropString(-2, "logInfo")
	vm.PushGoFunction(result.logNotice)
	vm.PutPropString(-2, "logNotice")
	vm.PushGoFunction(result.logWarning)
	vm.PutPropString(-2, "logWarning")
	vm.Pop3()

	// Return the new logging service.
	return result

}

// getLogInserts extracts the list of JavaScript arguments and converts them into a Go array.
func (loggingService *LoggingService) getLogInserts(vm *duktape.Context) (result []interface{}) {
	result = []interface{}{}
	for i := 0; i < vm.GetTop(); i++ {
		str := vm.ToString(i)
		result = append(result, str)
	}
	return result
}

// logCritical writes a critical message to the log.
func (loggingService *LoggingService) logCritical(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Critical(strings...)
	return 0
}

// logDebug writes a debug message to the log.
func (loggingService *LoggingService) logDebug(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Debug(strings...)
	return 0
}

// logError writes a error message to the log.
func (loggingService *LoggingService) logError(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Error(strings...)
	return 0
}

// logInfo writes a info message to the log.
func (loggingService *LoggingService) logInfo(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Info(strings...)
	return 0
}

// logNotice writes a notice message to the log.
func (loggingService *LoggingService) logNotice(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Notice(strings...)
	return 0
}

// logWarning writes a warning message to the log.
func (loggingService *LoggingService) logWarning(vm *duktape.Context) (result int) {
	strings := loggingService.getLogInserts(vm)
	logger.Warning(strings...)
	return 0
}
