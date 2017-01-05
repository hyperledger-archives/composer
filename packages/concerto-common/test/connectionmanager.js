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

const ConnectionManager = require('../lib/connectionmanager');
const ConnectionProfileManager = require('../lib/connectionprofilemanager');

const chai = require('chai');
chai.should();
const expect = require('chai').expect;
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ConnectionManager', () => {

    let mockConnectionProfileManager;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
    });

    describe('#constructor', () => {

        it('should throw if no connection profile manager', () => {

            expect(() => {
                let cm = new ConnectionManager(null);
                cm.should.be.null;
            })
          .to.throw(/Must create ConnectionManager with a ConnectionProfileManager/);
        });

    });

    describe('#getConnectionProfileManager', () => {

        it('should get connection profile manager', () => {
            let cm = new ConnectionManager(mockConnectionProfileManager);
            cm.should.not.be.null;
            cm.getConnectionProfileManager().should.equal(mockConnectionProfileManager);
        });

    });

    describe('#connect', () => {

        it('should throw as abstract', () => {

            let cm = new ConnectionManager(mockConnectionProfileManager);
            cm.should.not.be.null;
            return cm.connect('profile', 'network')
                  .then(() => {
                      true.should.be.false;
                  })
                  .catch((err) => {
                      err.message.should.match(/abstract function called/);
                  });
        });
    });

    describe('#toJSON', () => {

        it('should not be able to serialize', () => {
            let cm = new ConnectionManager(mockConnectionProfileManager);
            cm.should.not.be.null;
            cm.toJSON().should.deep.equal({});
        });
    });
});
