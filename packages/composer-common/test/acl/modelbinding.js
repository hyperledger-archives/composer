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
const ModelFile = require('../../lib/introspect/modelfile');
const ModelBinding = require('../../lib/acl/modelbinding');
const ClassDeclaration = require('../../lib/introspect/classdeclaration');

require('chai').should();
const sinon = require('sinon');

describe('ModelBinding', () => {

    let modelBinding;
    let aclRule;
    let aclFile;
    let mockModelManager;
    let mockModelFile;
    let mockClassDeclaration;
    let sandbox;
    const ast = {'type':'Binding','qualifiedName':'org.acme.Car','instanceId':'ABC123','variableName':{'type':'Identifier','name':'dan'}};
    const variableAst = {'type':'Identifier','name':'dan'};
    const missingClass = {'type':'Binding','qualifiedName':'org.acme.Missing','instanceId':'ABC123','variableName':{'type':'Identifier','name':'dan'}};
    const missingNamespace = {'type':'Binding','qualifiedName':'org.missing.Missing'};
    const missingProperty = {'type':'Binding','qualifiedName':'org.acme.Car.missing','instanceId':'ABC123','variableName':{'type':'Identifier','name':'dan'}};
    const missing = {'type':'Binding','qualifiedName':'org.missing.Missing','instanceId':'ABC123','variableName':{'type':'Identifier','name':'dan'}};

    beforeEach(() => {
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
        aclFile = sinon.createStubInstance(AclFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        aclFile.getModelManager.returns(mockModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockModelManager.getModelFile.withArgs('org.acme').returns(mockModelFile);
        mockModelFile.getLocalType.withArgs('Car').returns(mockClassDeclaration);
        mockModelFile.getLocalType.withArgs('Driver').returns(mockClassDeclaration);
        aclRule = sinon.createStubInstance(AclRule);
        aclRule.getAclFile.returns(aclFile);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#toJSON', () => {

        it('should generate a JSON representation', () => {
            modelBinding = new ModelBinding( aclFile, ast );
            const json = modelBinding.toJSON();
            json.should.not.be.null;
        });

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

        it('should validate correct contents', () => {
            modelBinding = new ModelBinding( aclRule, ast, variableAst );
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

        it('should detect reference to missing namespace with variable name', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missing );
                modelBinding.validate();
            }).should.throw(/Failed to resolve org.missing.Missing/);
        });

        it('should detect reference to missing property', () => {
            (() => {
                modelBinding = new ModelBinding( aclRule, missingProperty );
                modelBinding.validate();
            }).should.throw(/Failed to find property org.acme.Car.missing/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            modelBinding = new ModelBinding( aclRule, ast );
            let visitor = {
                visit: sinon.stub()
            };
            modelBinding.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, modelBinding, ['some', 'args']);
        });

    });
});
