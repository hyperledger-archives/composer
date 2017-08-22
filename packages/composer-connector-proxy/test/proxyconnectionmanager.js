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

const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const ProxyConnection = require('../lib/proxyconnection');
/* const ProxyConnectionManager = */ require('..');
const serializerr = require('serializerr');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('ProxyConnectionManager', () => {

    const connectionProfile = 'defaultProfile';
    const businessNetworkIdentifier = 'org-acme-biznet';
    const connectionOptions = {
        type: 'embedded'
    };
    const connectionID = '3d382385-47a5-4be9-99b0-6b10166b9497';
    const serializedError = serializerr(new TypeError('such type error'));

    let mockSocketFactory;
    let mockSocket;
    let mockConnectionProfileManager;
    let ProxyConnectionManager;

    let connectionManager;
    let mockConnection;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockSocket = {
            emit: sinon.stub(),
            once: sinon.stub(),
            on: sinon.stub()
        };
        // mockSocket.emit.throws(new Error('unexpected call'));
        // mockSocket.once.throws(new Error('unexpected call'));
        // mockSocket.on.throws(new Error('unexpected call'));
        mockSocketFactory = sinon.stub().returns(mockSocket);
        ProxyConnectionManager = proxyquire('../lib/proxyconnectionmanager', {
            'socket.io-client': mockSocketFactory
        });
    });

    describe('#setConnectorServerURL', () => {

        it('should change the URL used to connect to the connector server', () => {
            ProxyConnectionManager.setConnectorServerURL('http://blah.com:2393');
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            new ProxyConnectionManager(mockConnectionProfileManager);
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://blah.com:2393');
        });

    });

    describe('#constructor', () => {

        let connectionManager;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
        });

        it('should create a new socket connection and listen for a connect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the connect callback.
            connectionManager.connected.should.be.false;
            mockSocket.on.args[0][0].should.equal('connect');
            mockSocket.on.args[0][1]();
            connectionManager.connected.should.be.true;
        });

        it('should create a new socket connection and listen for a disconnect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the disconnect callback.
            connectionManager.connected = true;
            mockSocket.on.args[1][0].should.equal('disconnect');
            mockSocket.on.args[1][1]();
            connectionManager.connected.should.be.false;
        });

    });

    describe('#ensureConnected', () => {

        let connectionManager;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
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

    describe('#importIdentity', () => {

        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.connected = true;
        });

        it('should send a importIdentity call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'public key', 'private key', sinon.match.func).yields(null);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            return connectionManager.importIdentity(connectionProfile, connectionOptions, 'bob1', 'public key', 'private key')
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'public key', 'private key', sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'public key', 'private key', sinon.match.func).yields(serializedError);
            return connectionManager.importIdentity(connectionProfile, connectionOptions, 'bob1', 'public key', 'private key')
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#exportIdentity', () => {
        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.connected = true;
        });

        it('should send exportIdentity call to connector server', function() {
            const expected = {
                certificate: 'CERTIFICATE',
                privateKey: 'PRIVATE_KEY'
            };
            mockSocket.emit.withArgs('/api/connectionManagerExportIdentity', connectionProfile, connectionOptions, 'bob1', sinon.match.func).yields(null, expected);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            return connectionManager.exportIdentity(connectionProfile, connectionOptions, 'bob1')
                .should.become(expected);
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerExportIdentity', connectionProfile, connectionOptions, 'bob1', sinon.match.func).yields(serializedError);
            return connectionManager.exportIdentity(connectionProfile, connectionOptions, 'bob1')
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#connect', () => {

        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.connected = true;
        });

        it('should send a connect call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func).yields(null, connectionID);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            mockSocket.on.withArgs('events', sinon.match.func).yields(connectionID, [{'event': 'event1'}, {'evnet': 'event2'}]);
            return connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func);
                    connection.should.be.an.instanceOf(ProxyConnection);
                    connection.socket.should.equal(mockSocket);
                    connection.connectionID.should.equal(connectionID);
                    sinon.assert.calledThrice(mockSocket.on);
                    sinon.assert.calledWith(mockSocket.on, 'events', sinon.match.func);
                    sinon.assert.calledWith(mockConnection.emit, 'events', [{'event': 'event1'}, {'evnet': 'event2'}]);
                });
        });

        it('should not emit events if connectionID and myConnectionID dont match', () => {
            mockSocket.emit.withArgs('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func).yields(null, connectionID);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            mockSocket.on.withArgs('events', sinon.match.func).yields('myConnectionID', '[{"event": "event1"}, {"evnet": "event2"}]');
            return connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func);
                    connection.should.be.an.instanceOf(ProxyConnection);
                    connection.socket.should.equal(mockSocket);
                    connection.connectionID.should.equal(connectionID);
                    sinon.assert.calledThrice(mockSocket.on);
                    sinon.assert.calledWith(mockSocket.on, 'events', sinon.match.func);
                    sinon.assert.notCalled(connection.emit);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func).yields(serializedError);
            return connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#createConnection', () => {
        it('should create an instance of ProxyConnection', () => {
            let cm = ProxyConnectionManager.createConnection(connectionManager, 'profile', 'businessNetworkIdentifier', mockSocket, connectionID);
            cm.should.be.an.instanceOf(ProxyConnection);
        });
    });

});
