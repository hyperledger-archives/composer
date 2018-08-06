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
const should = chai.should();
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('ProxyConnectionManager', () => {

    const connectionProfile = 'defaultProfile';
    const businessNetworkIdentifier = 'org-acme-biznet';
    const connectionOptions = {
        'x-type': 'embedded'
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
            on: sinon.stub(),
            connect: sinon.stub(),
            close: sinon.stub()
        };
        mockSocketFactory = sinon.stub().returns(mockSocket);
        ProxyConnectionManager = proxyquire('../lib/proxyconnectionmanager', {
            'socket.io-client': mockSocketFactory
        });
    });

    describe('#setConnectorServerURL', () => {

        it('should change the URL used to connect to the connector server', () => {
            ProxyConnectionManager.setConnectorServerURL('http://blah.com:2393');
            new ProxyConnectionManager(mockConnectionProfileManager).ensureConnected();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://blah.com:2393');
        });

    });

    describe('#setConnectorStrategy', () => {
        it('should not change the connector strategy if null/undefined/false/0', () => {
            ProxyConnectionManager.setConnectorStrategy(null);
            ProxyConnectionManager.getConnectorStrategy.should.not.be.null;
        });
    });


    describe('#constructor', () => {
        it('should create a new ProxyConnectionManager', () => {
            let connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.connections.size.should.equal(0);
        });
    });

    describe('#disconnect', () => {
        it('should close the socket if connection count reaches zero and default strategy applied', () => {
            let connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.socket = mockSocket;
            connectionManager.connections.add('someid');
            connectionManager.disconnect('someid');
            connectionManager.connections.size.should.equal(0);
            sinon.assert.calledOnce(mockSocket.close);
        });

        it('should not close the socket if connection\'s outstanding', () => {
            let connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.socket = mockSocket;
            connectionManager.connections.add('someid1');
            connectionManager.connections.add('someid2');
            connectionManager.connections.size.should.equal(2);
            connectionManager.disconnect('someid1');
            connectionManager.connections.size.should.equal(1);
            sinon.assert.notCalled(mockSocket.close);
        });

        it('should not close the socket if connection strategy defines it', () => {
            const savedStrategy = ProxyConnectionManager.getConnectorStrategy();
            ProxyConnectionManager.setConnectorStrategy({
                closeOnDisconnect: false
            });
            let connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.socket = mockSocket;
            connectionManager.connections.add('someid');
            connectionManager.disconnect('someid');
            connectionManager.connections.size.should.equal(0);
            sinon.assert.notCalled(mockSocket.close);
            // restore the connector strategy
            ProxyConnectionManager.setConnectorStrategy(savedStrategy);

        });

        it('should do nothing if connection id not known', () => {
            let connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            connectionManager.socket = mockSocket;
            connectionManager.connections.add('someid');
            connectionManager.disconnect('some-other-id');
            connectionManager.connections.size.should.equal(1);
            sinon.assert.notCalled(mockSocket.close);
        });
    });


    describe('#ensureConnected', () => {

        let connectionManager;

        beforeEach(() => {
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
        });

        it('should do nothing if already connected', async () => {
            connectionManager.connected = true;
            connectionManager.socket = mockSocket;
            await connectionManager.ensureConnected();
            sinon.assert.notCalled(mockSocket.connect);
        });

        it('should create a new socket connection if no socket and listen for a connect event', async () => {
            mockSocket.once.withArgs('connect').yields();
            await connectionManager.ensureConnected();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the connect callback.
            mockSocket.once.args[1][0].should.equal('connect');
            mockSocket.once.args[1][1]();
            //TODO: What can we check here ? check for a log event
        });

        it('should create a new socket connection if no socket and listen for a disconnect event', async () => {
            mockSocket.once.withArgs('connect').yields();
            await connectionManager.ensureConnected();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the disconnect callback.
            mockSocket.once.args[0][0].should.equal('disconnect');
            mockSocket.once.args[0][1]();
            //TODO: What can we check here ? check for a log event
        });

        it('should create a new socket if socket not connected', async () => {
            connectionManager.connected = false;
            connectionManager.socket = mockSocket;
            mockSocket.once.withArgs('connect').yields();
            await connectionManager.ensureConnected();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
        });

        it('should handle a connect error', () => {
            mockSocket.once.withArgs('connect_error').yields('some error');
            connectionManager.ensureConnected().should.be.rejectedWith('some error');
        });


    });

    describe('#importIdentity', () => {

        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            mockSocket.once.withArgs('connect').yields();
        });

        it('should send a importIdentity call to the connector server', () => {
            const disconnectSpy = sinon.spy(connectionManager, 'disconnect');
            mockSocket.emit.withArgs('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'certificate', 'private key', sinon.match.func).yields(null);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            return connectionManager.importIdentity(connectionProfile, connectionOptions, 'bob1', 'certificate', 'private key')
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'certificate', 'private key', sinon.match.func);
                    sinon.assert.calledOnce(disconnectSpy);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerImportIdentity', connectionProfile, connectionOptions, 'bob1', 'certificate', 'private key', sinon.match.func).yields(serializedError);
            return connectionManager.importIdentity(connectionProfile, connectionOptions, 'bob1', 'certificate', 'private key')
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#removeIdentity', () => {

        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            mockSocket.once.withArgs('connect').yields();
        });

        it('should send a removeIdentity call to the connector server', () => {
            const disconnectSpy = sinon.spy(connectionManager, 'disconnect');
            mockSocket.emit.withArgs('/api/connectionManagerRemoveIdentity', connectionProfile, connectionOptions, 'bob1', sinon.match.func).yields(null);
            sinon.stub(ProxyConnectionManager, 'createConnection').returns(mockConnection);
            return connectionManager.removeIdentity(connectionProfile, connectionOptions, 'bob1')
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionManagerRemoveIdentity', connectionProfile, connectionOptions, 'bob1', sinon.match.func);
                    sinon.assert.calledOnce(disconnectSpy);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionManagerRemoveIdentity', connectionProfile, connectionOptions, 'bob1', sinon.match.func).yields(serializedError);
            return connectionManager.removeIdentity(connectionProfile, connectionOptions, 'bob1')
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });


    describe('#exportIdentity', () => {
        beforeEach(() => {
            mockConnection = sinon.createStubInstance(ProxyConnection);
            mockConnection.connectionID = connectionID;
            mockConnection.socket = mockSocket;
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            mockSocket.once.withArgs('connect').yields();
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
            connectionManager = new ProxyConnectionManager(mockConnectionProfileManager);
            mockSocket.once.withArgs('connect').yields();
        });

        it('should store the ids of multiple valid connections', async () => {
            mockSocket.emit.withArgs('/api/connectionManagerConnect', 'failure', businessNetworkIdentifier, connectionOptions, sinon.match.func).yields(new Error('failed'));
            const createConnectionStub = sinon.stub(ProxyConnectionManager, 'createConnection');
            for (let i = 0; i < 4; i++) {
                let mockConn = sinon.createStubInstance(ProxyConnection);
                mockConn.connectionID = connectionID + i;
                mockConn.socket = mockSocket;
                mockSocket.emit.withArgs('/api/connectionManagerConnect', connectionProfile, businessNetworkIdentifier, connectionOptions, sinon.match.func).onCall(i).yields(null, connectionID + i);
                createConnectionStub.onCall(i).returns(mockConn);
            }
            mockSocket.on.withArgs('events', sinon.match.func).yields(connectionID, [{'event': 'event1'}, {'evnet': 'event2'}]);
            await connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions);
            try {
                await connectionManager.connect('failure', businessNetworkIdentifier, connectionOptions);
                should.fail('no error was thrown');
            } catch(error) {
                // ignore the expected error
            }
            await connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions);
            await connectionManager.connect(connectionProfile, businessNetworkIdentifier, connectionOptions);
            connectionManager.connections.size.should.equal(3);
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
                    connectionManager.connections.size.should.equal(1);
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
