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
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"

	duktape "gopkg.in/olebedev/go-duktape.v3"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// IdentityService is a Go wrapper around an instance of the IdentityService JavaScript class.
type IdentityService struct {
	VM            *duktape.Context
	Stub          shim.ChaincodeStubInterface
	Certificate   *x509.Certificate
	CurrentUserID string
	Identifier    string
	Name          string
	Issuer        string
	PEM           string
}

// NewIdentityService creates a Go wrapper around a new instance of the IdentityService JavaScript class.
func NewIdentityService(vm *duktape.Context, context *Context, stub shim.ChaincodeStubInterface) (result *IdentityService) {
	logger.Debug("Entering NewIdentityService", vm, context, &stub)
	defer func() { logger.Debug("Exiting NewIdentityService", result) }()

	// Ensure the JavaScript stack is reset.
	defer vm.SetTop(vm.GetTop())

	// Create the new identity service.
	result = &IdentityService{VM: vm, Stub: stub}

	// Load the certificate.
	err := result.loadCertificate()
	if err != nil {
		panic(err)
	}

	// Create a new instance of the JavaScript IdentityService class.
	vm.PushGlobalObject()                   // [ global ]
	vm.GetPropString(-1, "composer")        // [ global composer ]
	vm.GetPropString(-1, "IdentityService") // [ global composer IdentityService ]
	err = vm.Pnew(0)                        // [ global composer theIdentityService ]
	if err != nil {
		panic(err)
	}

	// Store the identity service into the global stash.
	vm.PushGlobalStash()                    // [ global composer theIdentityService stash ]
	vm.Dup(-2)                              // [ global composer theIdentityService stash theIdentityService  ]
	vm.PutPropString(-2, "identityService") // [ global composer theIdentityService stash ]
	vm.Pop()                                // [ global composer theIdentityService ]

	// Bind the methods into the JavaScript object.
	vm.PushGoFunction(result.getIdentifier)  // [ global composer theIdentityService getIdentifier ]
	vm.PutPropString(-2, "getIdentifier")    // [ global composer theIdentityService ]
	vm.PushGoFunction(result.getName)        // [ global composer theIdentityService getName ]
	vm.PutPropString(-2, "getName")          // [ global composer theIdentityService ]
	vm.PushGoFunction(result.getIssuer)      // [ global composer theIdentityService getIssuer ]
	vm.PutPropString(-2, "getIssuer")        // [ global composer theIdentityService ]
	vm.PushGoFunction(result.getCertificate) // [ global composer theIdentityService getCertificate ]
	vm.PutPropString(-2, "getCertificate")   // [ global composer theIdentityService ]

	// Return the new identity service.
	return result
}

// load the creator x509 certificate
// Although we should really use protobufs to correctly locate the certificate
// this would have meant pulling in a load of vendor dependencies as they aren't
// in the chaincode container and it isn't worth it.
func (identityService *IdentityService) loadCertificate() (errResp error) {
	logger.Debug("Entering loadCertificate")
	defer func() { logger.Debug("Exiting loadCertificate", errResp) }()

	creator, err := identityService.Stub.GetCreator()
	if err != nil {
		return err
	}
	logger.Debug("creator", string(creator))
	certStart := bytes.Index(creator, []byte("-----BEGIN CERTIFICATE-----"))
	if certStart == -1 {
		return errors.New("No Certificate found")
	}
	certText := creator[certStart:]
	block, _ := pem.Decode(certText)
	if block == nil {
		return errors.New("Error received on pem.Decode of certificate:" + string(certText))
	}

	ucert, err := x509.ParseCertificate(block.Bytes)

	if err != nil {
		return err
	}
	identityService.Certificate = ucert
	identityService.PEM = string(certText)
	return nil
}

// getIdentifier gets a unique identifier for the identity used to submit the transaction.
func (identityService *IdentityService) getIdentifier(vm *duktape.Context) (result int) {
	logger.Debug("Entering IdentityService.getIdentifier", vm)
	defer func() { logger.Debug("Exiting IdentityService.getIdentifier", result) }()

	// Create a fingerprint of the certificate.
	bytes := identityService.Certificate.Raw
	hash := sha256.New()
	hash.Write(bytes)
	fingerprint := hex.EncodeToString(hash.Sum(nil))

	// Return the fingerprint.
	vm.PushString(fingerprint)
	return 1
}

// getName gets the name of the identity used to submit the transaction.
func (identityService *IdentityService) getName(vm *duktape.Context) (result int) {
	logger.Debug("Entering IdentityService.getName", vm)
	defer func() { logger.Debug("Exiting IdentityService.getName", result) }()

	// Return the common name of the certificate.
	name := identityService.Certificate.Subject.CommonName
	vm.PushString(name)
	return 1
}

// getIssuer gets the issuer of the identity used to submit the transaction.
func (identityService *IdentityService) getIssuer(vm *duktape.Context) (result int) {
	logger.Debug("Entering IdentityService.getIssuer", vm)
	defer func() { logger.Debug("Exiting IdentityService.getIssuer", result) }()

	// Create a fingerprint of the issuer of the certificate.
	bytes := identityService.Certificate.RawIssuer
	hash := sha256.New()
	hash.Write(bytes)
	fingerprint := hex.EncodeToString(hash.Sum(nil))

	// Return the fingerprint.
	vm.PushString(fingerprint)
	return 1
}

// getCertificate gets the certificate used to submit the transaction.
func (identityService *IdentityService) getCertificate(vm *duktape.Context) (result int) {
	logger.Debug("Entering IdentityService.getCertificate", vm)
	defer func() { logger.Debug("Exiting IdentityService.getCertificate", result) }()

	// Return the certificate.
	vm.PushString(identityService.PEM)
	return 1
}
