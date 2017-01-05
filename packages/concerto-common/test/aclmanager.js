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

const AclFile = require('../lib/acl/aclfile');
const AclManager = require('../lib/aclmanager');
const ModelManager = require('../lib/modelmanager');

const chai = require('chai');
//const should = chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('AclManager', () => {

    let modelManager;
    let aclFile;
    let sandbox;
    let dummyRules = ['test'];

    beforeEach(() => {
        modelManager = new ModelManager();
        aclFile = sinon.createStubInstance(AclFile);
        aclFile.getAclRules.returns(dummyRules);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let mm = new AclManager(modelManager);
            let visitor = {
                visit: sinon.stub()
            };
            mm.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, mm, ['some', 'args']);
        });

    });

    describe('#aclFile', () => {

        it('should set & get the acl file', () => {
            let am = new AclManager(modelManager);
            am.getAclRules().length.should.equal(0);
            am.setAclFile(aclFile);
            am.getAclFile().should.equal(aclFile);
            am.getAclRules().should.equal(dummyRules);
        });
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let mm = new AclManager(modelManager);
            mm.toJSON().should.deep.equal({});
        });

    });

});
