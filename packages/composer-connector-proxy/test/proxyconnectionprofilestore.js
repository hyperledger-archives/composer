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

/* const ProxyConnectionProfileStore = */ require('..');
const serializerr = require('serializerr');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('ProxyConnectionProfileStore', () => {

    const connectionProfile = 'defaultProfile';
    const connectionOptions = {
        type: 'embedded'
    };
    const otherConnectionOptions = {
        type: 'web'
    };
    const serializedError = serializerr(new TypeError('such type error'));

    let mockSocketFactory;
    let mockSocket;
    let ProxyConnectionProfileStore;

    let connectionProfileStore;

    beforeEach(() => {
        mockSocket = {
            emit: sinon.stub(),
            once: sinon.stub(),
            on: sinon.stub()
        };
        // mockSocket.emit.throws(new Error('unexpected call'));
        // mockSocket.once.throws(new Error('unexpected call'));
        // mockSocket.on.throws(new Error('unexpected call'));
        mockSocketFactory = sinon.stub().returns(mockSocket);
        ProxyConnectionProfileStore = proxyquire('../lib/proxyconnectionprofilestore', {
            'socket.io-client': mockSocketFactory
        });
    });

    describe('#setConnectorServerURL', () => {

        it('should change the URL used to connect to the connector server', () => {
            ProxyConnectionProfileStore.setConnectorServerURL('http://blah.com:2393');
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            new ProxyConnectionProfileStore();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://blah.com:2393');
        });

    });

    describe('#constructor', () => {

        let connectionProfileStore;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionProfileStore = new ProxyConnectionProfileStore();
        });

        it('should create a new socket connection and listen for a connect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the connect callback.
            connectionProfileStore.connected.should.be.false;
            mockSocket.on.args[0][0].should.equal('connect');
            mockSocket.on.args[0][1]();
            connectionProfileStore.connected.should.be.true;
        });

        it('should create a new socket connection and listen for a disconnect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the disconnect callback.
            connectionProfileStore.connected = true;
            mockSocket.on.args[1][0].should.equal('disconnect');
            mockSocket.on.args[1][1]();
            connectionProfileStore.connected.should.be.false;
        });

    });

    describe('#ensureConnected', () => {

        let connectionManager;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionProfileStore();
        });

        it('should do nothing if already connected', () => {
            connectionManager.connected = true;
            return connectionManager.ensureConnected();
        });

        it('should wait for a connection if not connected', () => {
            mockSocket.once.withArgs('connect').yields();
            connectionManager.connected = false;
            return connectionManager.ensureConnected()
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.once);
                    sinon.assert.calledWith(mockSocket.once, 'connect');
                });
        });

    });

    describe('#load', () => {

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionProfileStore = new ProxyConnectionProfileStore();
            connectionProfileStore.connected = true;
        });

        it('should send a load call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreLoad', connectionProfile, sinon.match.func).yields(null, connectionOptions);
            return connectionProfileStore.load(connectionProfile)
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionProfileStoreLoad', connectionProfile, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                    result.should.deep.equal(connectionOptions);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreLoad', connectionProfile, sinon.match.func).yields(serializedError);
            return connectionProfileStore.load(connectionProfile)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#save', () => {

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionProfileStore = new ProxyConnectionProfileStore();
            connectionProfileStore.connected = true;
        });

        it('should send a save call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreSave', connectionProfile, connectionOptions, sinon.match.func).yields(null);
            return connectionProfileStore.save(connectionProfile, connectionOptions)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionProfileStoreSave', connectionProfile, connectionOptions, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreSave', connectionProfile, connectionOptions, sinon.match.func).yields(serializedError);
            return connectionProfileStore.save(connectionProfile, connectionOptions)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#loadAll', () => {

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionProfileStore = new ProxyConnectionProfileStore();
            connectionProfileStore.connected = true;
        });

        it('should send a loadAll call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreLoadAll', sinon.match.func).yields(null, [ connectionOptions, otherConnectionOptions ]);
            return connectionProfileStore.loadAll()
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionProfileStoreLoadAll', sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                    result.should.deep.equal([ connectionOptions, otherConnectionOptions ]);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreLoadAll', sinon.match.func).yields(serializedError);
            return connectionProfileStore.loadAll()
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#delete', () => {

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionProfileStore = new ProxyConnectionProfileStore();
            connectionProfileStore.connected = true;
        });

        it('should send a delete call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreDelete', connectionProfile, sinon.match.func).yields(null);
            return connectionProfileStore.delete(connectionProfile)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionProfileStoreDelete', connectionProfile, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionProfileStoreDelete', connectionProfile, sinon.match.func).yields(serializedError);
            return connectionProfileStore.delete(connectionProfile)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

});
