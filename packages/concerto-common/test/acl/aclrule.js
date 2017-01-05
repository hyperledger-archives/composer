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

require('chai').should();
const sinon = require('sinon');

describe('AclRule', () => {

    let aclRule;
    let aclFile;
    let mockModelManager;
    let mockModelFile;
    let sandbox;
    const ast = {'type':'AclRule','id':{'type':'Identifier','name':'R1'},'noun':{'type':'Binding','qualifiedName':'org.acme.Car','instanceId':{'type':'Identifier','name':'ABC123'},'variableName':null},'verb':'DELETE','participant':{'type':'Binding','qualifiedName':'org.acme.Driver','instanceId':{'type':'Identifier','name':'Fred'},'variableName':null},'predicate':'true','action':'ALLOW','description':'Fred can DELETE the car ABC123'};

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        aclFile.getModelManager.returns(mockModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockModelManager.getModelFile.withArgs('org.acme').returns(mockModelFile);
        mockModelFile.getLocalType.withArgs('Car').returns('fake');
        mockModelFile.getLocalType.withArgs('Driver').returns('fake');
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#toJSON', () => {

        it('should generate a JSON representation', () => {
            aclRule = new AclRule( aclFile, ast );
            const json = aclRule.toJSON();
            json.should.not.be.null;
        });

    });

    describe('#constructor', () => {

        it('should throw when null AclFile provided', () => {
            (() => {
                aclRule = new AclRule( null, {} );
            }).should.throw(/Invalid AclFile or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                aclRule = new AclRule( aclFile, null );
            }).should.throw(/Invalid AclFile or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            aclRule = new AclRule( aclFile, ast );
            aclRule.validate();
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            aclRule = new AclRule( aclFile, ast );
            let visitor = {
                visit: sinon.stub()
            };
            aclRule.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, aclRule, ['some', 'args']);
        });

    });
});
