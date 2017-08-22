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

const Connection = require('../lib/connection');
const ConnectionManager = require('../lib/connectionmanager');
const ConnectionProfileManager = require('../lib/connectionprofilemanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('ConnectionManager', () => {

    let mockConnectionProfileManager;
    let mockConnection;
    let connectionManager;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockConnection = sinon.createStubInstance(Connection);
        connectionManager = new ConnectionManager(mockConnectionProfileManager);
    });

    describe('#constructor', () => {

        it('should throw if no connection profile manager', () => {
            (() => {
                new ConnectionManager(null);
            }).should.throw(/Must create ConnectionManager with a ConnectionProfileManager/);
        });

    });

    describe('#getConnectionProfileManager', () => {

        it('should get connection profile manager', () => {
            connectionManager.getConnectionProfileManager().should.equal(mockConnectionProfileManager);
        });

    });

    describe('#connect', () => {

        it('should call _connect and handle no error', () => {
            sinon.stub(connectionManager, '_connect').yields(null, mockConnection);
            return connectionManager.connect('hlfabric', 'org-acme-biznet', { connect: 'options' })
                .should.eventually.be.equal(mockConnection)
                .then(() => {
                    sinon.assert.calledWith(connectionManager._connect, 'hlfabric', 'org-acme-biznet', { connect: 'options' });
                });
        });

        it('should call _connect and handle an error', () => {
            sinon.stub(connectionManager, '_connect').yields(new Error('error'));
            return connectionManager.connect('hlfabric', 'org-acme-biznet', { connect: 'options' })
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connectionManager._connect, 'hlfabric', 'org-acme-biznet', { connect: 'options' });
                });
        });

    });

    describe('#_connect', () => {

        it('should throw as abstract method', () => {
            (() => {
                connectionManager._connect('hlfabric', 'org-acme-biznet', { connect: 'options' });
            }).should.throw(/abstract function called/);
        });

    });

    describe('#importIdentity', () => {

        it('should call _connect and handle no error', () => {
            sinon.stub(connectionManager, '_importIdentity').yields(null);
            return connectionManager.importIdentity('profile', { connect: 'options' }, 'bob1', 'public key', 'private key')
                .then(() => {
                    sinon.assert.calledWith(connectionManager._importIdentity, 'profile', { connect: 'options' }, 'bob1', 'public key', 'private key');
                });
        });

        it('should call _connect and handle an error', () => {
            sinon.stub(connectionManager, '_importIdentity').yields(new Error('error'));
            return connectionManager.importIdentity('profile', { connect: 'options' }, 'bob1', 'public key', 'private key')
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connectionManager._importIdentity, 'profile', { connect: 'options' }, 'bob1', 'public key', 'private key');
                });
        });

    });

    describe('#_importIdentity', () => {

        it('should throw as abstract', () => {
            (() => {
                connectionManager._importIdentity('profile', { connect: 'options' }, 'bob1', 'public key', 'private key');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#requestIdentity', () => {

        it('should call _connect and handle no error', () => {
            sinon.stub(connectionManager, '_requestIdentity').yields(null, { caName: 'ca1', key: 'suchkey' });
            return connectionManager.requestIdentity('profile', { connect: 'options' }, 'bob1', 'secret')
                    .then((result) => {
                        result.should.deep.equal({ caName: 'ca1', key: 'suchkey' });
                        sinon.assert.calledWith(connectionManager._requestIdentity, 'profile', { connect: 'options' }, 'bob1', 'secret');
                    });
        });

        it('should call _connect and handle an error', () => {
            sinon.stub(connectionManager, '_requestIdentity').yields(new Error('error'));
            return connectionManager.requestIdentity('profile', { connect: 'options' }, 'bob1', 'secret')
                    .should.be.rejectedWith(/error/)
                    .then(() => {
                        sinon.assert.calledWith(connectionManager._requestIdentity, 'profile', { connect: 'options' }, 'bob1', 'secret');
                    });
        });

    });

    describe('#_requestIdentity', () => {

        it('should throw as abstract', () => {
            (() => {
                connectionManager._requestIdentity('profile', { connect: 'options' }, 'bob1', 'secret');
            }).should.throw(/abstract function called/);
        });

    });

});
