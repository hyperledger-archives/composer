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
	"bytes"
	"crypto/x509"
	"encoding/pem"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/robertkrimen/otto"
)

// IdentityService is a Go wrapper around an instance of the IdentityService JavaScript class.
type IdentityService struct {
	This *otto.Object
	Stub shim.ChaincodeStubInterface
}

// NewIdentityService creates a Go wrapper around a new instance of the IdentityService JavaScript class.
func NewIdentityService(vm *otto.Otto, context *Context, stub shim.ChaincodeStubInterface) (result *IdentityService) {
	logger.Debug("Entering NewIdentityService", vm, context, stub)
	defer func() { logger.Debug("Exiting NewIdentityService", result) }()

	// Create a new instance of the JavaScript chaincode class.
	temp, err := vm.Call("new composer.IdentityService", nil, context.This)
	if err != nil {
		panic(fmt.Sprintf("Failed to create new instance of IdentityService JavaScript class: %v", err))
	} else if !temp.IsObject() {
		panic("New instance of IdentityService JavaScript class is not an object")
	}
	object := temp.Object()

	// Create a new access control shim.
	// acs := impl.NewAccessControlShim(stub)

	// Add a pointer to the Go object into the JavaScript object.
	result = &IdentityService{This: temp.Object(), Stub: stub}
	err = object.Set("$this", result)
	if err != nil {
		panic(fmt.Sprintf("Failed to store Go object in IdentityService JavaScript object: %v", err))
	}

	// Bind the methods into the JavaScript object.
	result.This.Set("getCurrentUserID", result.getCurrentUserID)
	return result

}

// getCurrentUserID retrieves the userID attribute from the users certificate.
func (identityService *IdentityService) getCurrentUserID(call otto.FunctionCall) (result otto.Value) {
	logger.Debug("Entering IdentityService.getCurrentUserID", call)
	defer func() { logger.Debug("Exiting IdentityService.getCurrentUserID", result) }()

	creator, err := identityService.Stub.GetCreator()
	if err != nil {
		logger.Debug("Error received on GetCreator", err)
		return otto.NullValue()
	}
	//var ucert *x509.Certificate
	logger.Debug("creator", string(creator))
	certStart := bytes.IndexAny(creator, "----BEGIN CERTIFICATE-----")
	if certStart == -1 {
		logger.Debug("No certificate found");
		return otto.NullValue()
	}
	certText := creator[certStart:]
	block, _ := pem.Decode(certText)
	if block == nil {
		logger.Debug("Error received on pem.Decode of certificate", certText)
		return otto.NullValue()
	}

	ucert, err := x509.ParseCertificate(block.Bytes)

	if err != nil {
		logger.Debug("Error received on ParseCertificate", err)
		return otto.NullValue()
	}

	logger.Debug("Common Name", ucert.Subject.CommonName)

	// TODO: temporary for V1 admin user returns null to give them
	// full authority
	if ucert.Subject.CommonName == "admin" {
		return otto.NullValue();
	}
	result, err = otto.ToValue(ucert.Subject.CommonName)
	if err != nil {
		panic(call.Otto.MakeCustomError("Error", err.Error()))
	}
	return result

	// Read the userID attribute value.
	// identityService.Stub.GetBinding()
	// bytes, err := identityService.AccessControlShim.ReadCertAttribute("userID")
	// if err != nil {
	// 	return otto.NullValue()
	// }
	// value := string(bytes)
	// result, err = otto.ToValue(value)
	// if err != nil {
	// 	panic(call.Otto.MakeCustomError("Error", err.Error()))
	// }
	// return result
	//return otto.NullValue()

}
