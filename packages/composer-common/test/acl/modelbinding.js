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

'use strict';

const AclRule = require('../../lib/acl/aclrule');
const AclFile = require('../../lib/acl/aclfile');
const ModelManager = require('../../lib/modelmanager');
const ModelBinding = require('../../lib/acl/modelbinding');

const should = require('chai').should();
const sinon = require('sinon');

describe('ModelBinding', () => {

    let modelBinding;
    let aclRule;
    let aclFile;
    let modelManager;
    let sandbox;

    const namespaceAst = {'type':'Binding','qualifiedName':'org.acme.*'};
    const recursiveNamespaceAst = {'type':'Binding','qualifiedName':'org.**'};
    const classAst = {'type':'Binding','qualifiedName':'org.acme.Car'};
    const classWithIdentifierAst = {'type':'Binding','qualifiedName':'org.acme.Car','instanceId':'ABC123'};
    const variableAst = {'type':'Identifier','name':'dan'};

    const missingClass = {'type':'Binding','qualifiedName':'org.acme.Missing','instanceId':'ABC123'};
    const missingNamespace = {'type':'Binding','qualifiedName':'org.missing.Missing.*'};
    const missingRecursiveNamespace = {'type':'Binding','qualifiedName':'org.missing.Missing.**'};
    const missing = {'type':'Binding','qualifiedName':'org.missing.Missing.*','instanceId':'ABC123'};

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        asset Car identified by assetId {
            o String assetId
        }`);
        aclFile.getModelManager.returns(modelManager);
        aclRule = sinon.createStubInstance(AclRule);
        aclRule.getAclFile.returns(aclFile);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null AclRule provided', () => {
            (() => {
                modelBinding = new ModelBinding( null, {} );
            }).should.throw(/Invalid AclRule or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, null );
            }).should.throw(/Invalid AclRule or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents for a namespace reference', () => {
            modelBinding = new ModelBinding( aclRule, namespaceAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.acme.*');
        });

        it('should validate correct contents for a recursive namespace reference', () => {
            modelBinding = new ModelBinding( aclRule, recursiveNamespaceAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.**');
        });

        it('should validate correct contents for a class reference', () => {
            modelBinding = new ModelBinding( aclRule, classAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.acme.Car');
        });

        it('should validate correct contents for a class reference with an identifier', () => {
            modelBinding = new ModelBinding( aclRule, classWithIdentifierAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.acme.Car#ABC123');
        });

        it('should validate correct contents for a class reference with a variable binding', () => {
            modelBinding = new ModelBinding( aclRule, classAst, variableAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.acme.Car:dan');
        });

        it('should validate correct contents for a class reference with an identifier and with a variable binding', () => {
            modelBinding = new ModelBinding( aclRule, classWithIdentifierAst, variableAst );
            modelBinding.validate();
            modelBinding.toString().should.equal('ModelBinding org.acme.Car#ABC123:dan');
        });

        it('should detect reference to missing class', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missingClass );
                modelBinding.validate();
            }).should.throw(/Failed to find class org.acme.Missing/);
        });

        it('should detect reference to missing namespace', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missingNamespace );
                modelBinding.validate();
            }).should.throw(/Failed to find namespace org.missing.Missing/);
        });

        it('should detect reference to missing recursive namespace', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missingRecursiveNamespace );
                modelBinding.validate();
            }).should.throw(/Failed to find namespace org.missing.Missing/);
        });

        it('should detect reference to missing namespace with variable name', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missing );
                modelBinding.validate();
            }).should.throw(/Failed to find namespace org.missing.Missing/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            modelBinding = new ModelBinding( aclRule, classAst );
            let visitor = {
                visit: sinon.stub()
            };
            modelBinding.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, modelBinding, ['some', 'args']);
        });

    });

    describe('#getClassDeclaration', () => {

        it('should return null for a namespace binding', () => {
            modelBinding = new ModelBinding( aclRule, namespaceAst );
            modelBinding.validate();
            should.equal(modelBinding.getClassDeclaration(), null);
        });

        it('should return null for a recursive namespace binding', () => {
            modelBinding = new ModelBinding( aclRule, recursiveNamespaceAst );
            modelBinding.validate();
            should.equal(modelBinding.getClassDeclaration(), null);
        });

        it('should return the class declaration for a class binding', () => {
            modelBinding = new ModelBinding( aclRule, classAst );
            modelBinding.validate();
            modelBinding.getClassDeclaration().getFullyQualifiedName().should.equal('org.acme.Car');
        });

    });

});
