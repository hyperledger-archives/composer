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
const Predicate = require('../../lib/acl/predicate');

require('chai').should();
const sinon = require('sinon');

describe('Predicate', () => {

    let predicate;
    let aclRule;
    let aclFile;
    let mockModelManager;
    let sandbox;
    const ast = '(true)';

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        aclFile.getModelManager.returns(mockModelManager);
        aclRule = sinon.createStubInstance(AclRule);
        aclRule.getAclFile.returns(aclFile);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#toJSON', () => {

        it('should generate a JSON representation', () => {
            predicate = new Predicate( aclRule, ast );
            const json = predicate.toJSON();
            json.should.not.be.null;
        });

    });

    describe('#constructor', () => {

        it('should throw when null AclRule provided', () => {
            (() => {
                predicate = new Predicate( null, {} );
            }).should.throw(/Invalid AclRule or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                predicate = new Predicate( aclRule, null );
            }).should.throw(/Invalid AclRule or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            predicate = new Predicate( aclRule, ast );
            predicate.validate();
            predicate.getExpression().should.equal('(true)');
            predicate.getAclRule().should.equal(aclRule);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            predicate = new Predicate( aclRule, ast );
            let visitor = {
                visit: sinon.stub()
            };
            predicate.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, predicate, ['some', 'args']);
        });

    });
});
