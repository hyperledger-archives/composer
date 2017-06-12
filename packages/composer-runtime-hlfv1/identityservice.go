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
	"strings"
	"crypto/x509"
	"encoding/pem"

	duktape "gopkg.in/olebedev/go-duktape.v3"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// IdentityService is a Go wrapper around an instance of the IdentityService JavaScript class.
type IdentityService struct {
	VM   *duktape.Context
	Stub shim.ChaincodeStubInterface
}

// NewIdentityService creates a Go wrapper around a new instance of the IdentityService JavaScript class.
func NewIdentityService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *IdentityService) {
	logger.Debug("Entering NewIdentityService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewIdentityService", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new identity service.
	result = &IdentityService{VM: vm, Stub: stub}

	// Create a new instance of the JavaScript IdentityService class.
	vm.PushGlobalObject()                   // [ global ]
	vm.GetPropString(-1, "composer")        // [ global composer ]
	vm.GetPropString(-1, "IdentityService") // [ global composer IdentityService ]
	err := vm.Pnew(0)                       // [ global composer theIdentityService ]
	if err != nil {
		panic(err)
	}

	// Store the identity service into the global stash.
	vm.PushGlobalStash()                    // [ global composer theIdentityService stash ]
	vm.Dup(-2)                              // [ global composer theIdentityService stash theIdentityService  ]
	vm.PutPropString(-2, "identityService") // [ global composer theIdentityService stash ]
	vm.Pop()                                // [ global composer theIdentityService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getCurrentUserID) // [ global composer theIdentityService getCurrentUserID ]
	vm.PutPropString(-2, "getCurrentUserID")   // [ global composer theIdentityService ]

	// Return the new identity service.
	return result
}

// getCurrentUserID retrieves the userID attribute from the users certificate.
func (identityService *IdentityService) getCurrentUserID(vm *duktape.Context) (result int) {
	logger.Debug("Entering IdentityService.getCurrentUserID", vm)
	defer func() { logger.Debug("Exiting IdentityService.getCurrentUserID", result) }()

	creator, err := identityService.Stub.GetCreator()
	if err != nil {
		logger.Debug("Error received on GetCreator", err)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		vm.Throw()
		return 0
	}
	logger.Debug("creator", string(creator))
	certStart := bytes.Index(creator,[]byte("-----BEGIN CERTIFICATE-----"))
	if certStart == -1 {
		logger.Debug("No certificate found")
		vm.PushErrorObjectVa(duktape.ErrError, "%s", "No certificate found")
		vm.Throw()
		return 0
	}
	certText := creator[certStart:]
	block, _ := pem.Decode(certText)
	if block == nil {
		logger.Debug("Error received on pem.Decode of certificate", certText)
		vm.PushErrorObjectVa(duktape.ErrError, "Error received on pem.Decode of certificate: %s", certText)
		vm.Throw()
		return 0
	}

	ucert, err := x509.ParseCertificate(block.Bytes)

	if err != nil {
		logger.Debug("Error received on ParseCertificate", err)
		vm.PushErrorObjectVa(duktape.ErrError, "%s", err.Error())
		vm.Throw()
		return 0
	}

	logger.Debug("Common Name", ucert.Subject.CommonName)

	// TODO: temporary for V1 admin user returns null to give them
	// full authority
	if strings.Contains(strings.ToLower(ucert.Subject.CommonName), "admin") {
		vm.PushNull()
		return 1
	}
	vm.PushString(ucert.Subject.CommonName)
	return 1
}
