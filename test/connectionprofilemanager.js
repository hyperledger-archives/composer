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

const ConnectionProfileManager = require('../lib/connectionprofilemanager');
const ConnectionProfileStore = require('../lib/connectionprofilestore');
const ConnectionManager = require('../lib/connectionmanager');

const chai = require('chai');
chai.should();
const expect = require('chai').expect;

chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ConnectionProfileManager', () => {

    describe('#construct', () => {

        it('should throw if no connection profile store', () => {

            expect(() => {
                let cpm = new ConnectionProfileManager(null);
                cpm.should.be.null;
            })
            .to.throw(/Must create ConnectionProfileManager/);
        });

        it('should be able to get connection profile store', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.getConnectionProfileStore().should.deep.equal(store);
        });
    });

    describe('#addConnectionManager', () => {

        it('should be able to set then get connection manager associated with a type', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.getConnectionManager( 'baz' )
            .then((result) => {
                result.should.equal(connectionManager);
            });
        });
    });

    describe('#toJSON', () => {

        it('should not be able to serialize', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.toJSON().should.deep.equal({});
        });
    });

});
