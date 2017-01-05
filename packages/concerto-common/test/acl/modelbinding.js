/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
    const ast = {'type':'Binding','qualifiedName':'org.acme.Car','instanceId':{'type':'Identifier','name':'ABC123'},'variableName':{'type':'Identifier','name':'dan'}};
    const missingClass = {'type':'Binding','qualifiedName':'org.acme.Missing','instanceId':{'type':'Identifier','name':'ABC123'},'variableName':{'type':'Identifier','name':'dan'}};
    const missingNamespace = {'type':'Binding','qualifiedName':'org.missing.Missing'};
    const missingProperty = {'type':'Binding','qualifiedName':'org.acme.Car.missing','instanceId':{'type':'Identifier','name':'ABC123'},'variableName':{'type':'Identifier','name':'dan'}};
    const missing = {'type':'Binding','qualifiedName':'org.missing.Missing','instanceId':{'type':'Identifier','name':'ABC123'},'variableName':{'type':'Identifier','name':'dan'}};

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
            modelBinding = new ModelBinding( aclRule, ast );
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
