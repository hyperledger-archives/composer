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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Connection = require('composer-common').Connection;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const ConnectionProfileStore = require('composer-common').ConnectionProfileStore;
const ConnectorServer = require('..');
const SecurityContext = require('composer-common').SecurityContext;
const uuid = require('uuid');

const should = require('chai').should();
const sinon = require('sinon');
require('sinon-as-promised');

describe('ConnectorServer', () => {

    const connectionProfile = 'defaultProfile';
    const businessNetworkIdentifier = 'org.acme.biznet';
    const connectionOptions = {
        type: 'embedded',
        prop1: 'value1',
        prop2: 'value2'
    };
    const existingConnectionOptions = {
        prop1: 'valueA',
        prop2: 'valueB',
        prop3: 'valueC'
    };
    const mergedConnectionOptions = Object.assign({}, existingConnectionOptions, connectionOptions);
    const connectionID = 'f93cb63a-ba19-40c7-b68e-dad0959d9e8b';
    const enrollmentID = 'alice1';
    const enrollmentSecret = 'suchs3cret';
    const securityContextID = 'b65aa4ba-1dd8-4aa0-9f36-f74ba14d7420';
    const invalidID = '8f98ce55-423c-49bf-a036-969f0667776d';

    let mockConnectionProfileManager;
    let mockConnectionProfileStore;
    let mockConnection;
    let mockSecurityContext;
    let mockSocket;
    let mockBusinessNetworkDefinition;
    let connectorServer;
    let sandbox;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockConnectionProfileManager.connect.throws(new Error('unexpected call'));
        mockConnectionProfileStore = sinon.createStubInstance(ConnectionProfileStore);
        mockConnectionProfileStore.load.throws(new Error('unexpected call'));
        mockConnectionProfileStore.save.throws(new Error('unexpected call'));
        mockSocket = {
            on: sinon.stub(),
            emit: sinon.stub()
        };
        mockConnection = sinon.createStubInstance(Connection);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        connectorServer = new ConnectorServer(mockConnectionProfileStore, mockConnectionProfileManager, mockSocket);
        sandbox = sinon.sandbox.create();
        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#serializerr', () => {

        it('should serialize an error', () => {
            const actualError = new TypeError('such type error');
            const serializedError = ConnectorServer.serializerr(actualError);
            serializedError.name.should.equal('TypeError');
            serializedError.message.should.equal('such type error');
            serializedError.stack.should.be.a('string');
        });

        it('should serialize something that is not an error', () => {
            const actualError = 'such type error';
            const serializedError = ConnectorServer.serializerr(actualError);
            serializedError.name.should.equal('Error');
            serializedError.message.should.equal('such type error');
            serializedError.stack.should.be.a('string');
        });

    });

    describe('#constructor', () => {

        it('should register handlers for all exposed functions', () => {
            const functions = mockSocket.on.args.map((args) => { return args[0]; });
            functions.should.deep.equal([
                '/api/connectionCreateIdentity',
                '/api/connectionDeploy',
                '/api/connectionDisconnect',
                '/api/connectionInvokeChainCode',
                '/api/connectionList',
                '/api/connectionLogin',
                '/api/connectionManagerConnect',
                '/api/connectionPing',
                '/api/connectionQueryChainCode',
                '/api/connectionUndeploy',
                '/api/connectionUpdate'
            ]);
            mockSocket.on.args.forEach((args) => {
                args[1].should.be.a('function');
            });
        });

        it('should not register handlers for anything that is not a property', () => {
            ConnectorServer.prototype.foo = 'bar';
            try {
                connectorServer = new ConnectorServer(mockConnectionProfileStore, mockConnectionProfileManager, mockSocket);
                mockSocket.on.args.forEach((args) => {
                    args[1].should.be.a('function');
                });
            } finally {
                delete ConnectorServer.prototype.foo;
            }
        });

    });

    describe('#connectionManagerConnect', () => {

        it('should connect and handle a connection profile that does not already exist', () => {
            mockConnectionProfileStore.load.withArgs(connectionProfile, connectionOptions).rejects(new Error('no such profile'));
            mockConnectionProfileStore.save.withArgs(connectionProfile, connectionOptions).resolves();
            mockConnectionProfileManager.connect.withArgs(connectionProfile, businessNetworkIdentifier).resolves(mockConnection);
            sandbox.stub(uuid, 'v4').returns(connectionID);
            const cb = sinon.stub();
            return connectorServer.connectionManagerConnect(connectionProfile, businessNetworkIdentifier, connectionOptions, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, connectionProfile, connectionOptions);
                    sinon.assert.calledOnce(mockConnectionProfileManager.connect);
                    sinon.assert.calledWith(mockConnectionProfileManager.connect, connectionProfile, businessNetworkIdentifier);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, connectionID);
                    connectorServer.connections[connectionID].should.equal(mockConnection);
                });
        });

        it('should connect and merge options with a connection profile that already exists', () => {
            mockConnectionProfileStore.load.withArgs(connectionProfile, connectionOptions).resolves(existingConnectionOptions);
            mockConnectionProfileStore.save.withArgs(connectionProfile, mergedConnectionOptions).resolves();
            mockConnectionProfileManager.connect.withArgs(connectionProfile, businessNetworkIdentifier).resolves(mockConnection);
            sandbox.stub(uuid, 'v4').returns(connectionID);
            const cb = sinon.stub();
            return connectorServer.connectionManagerConnect(connectionProfile, businessNetworkIdentifier, connectionOptions, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, connectionProfile, mergedConnectionOptions);
                    sinon.assert.calledOnce(mockConnectionProfileManager.connect);
                    sinon.assert.calledWith(mockConnectionProfileManager.connect, connectionProfile, businessNetworkIdentifier);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, connectionID);
                    connectorServer.connections[connectionID].should.equal(mockConnection);
                });
        });

        it('should handle connection errors', () => {
            mockConnectionProfileStore.load.withArgs(connectionProfile, connectionOptions).rejects(new Error('no such profile'));
            mockConnectionProfileStore.save.withArgs(connectionProfile, connectionOptions).resolves();
            mockConnectionProfileManager.connect.withArgs(connectionProfile, businessNetworkIdentifier).rejects(new Error('connection error'));
            sandbox.stub(uuid, 'v4').returns(connectionID);
            const cb = sinon.stub();
            return connectorServer.connectionManagerConnect(connectionProfile, businessNetworkIdentifier, connectionOptions, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('connection error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionDisconnect', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
        });

        it('should disconnect', () => {
            mockConnection.disconnect.resolves();
            const cb = sinon.stub();
            return connectorServer.connectionDisconnect(connectionID, cb)
                .then(() => {
                    mockConnection.removeListener.withArgs('events', sinon.match.func).yield(['event1', 'event2']);
                    should.equal(connectorServer.connections[connectionID], undefined);
                    sinon.assert.calledOnce(mockConnection.removeListener);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionDisconnect(invalidID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle disconnection errors', () => {
            mockConnection.disconnect.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionDisconnect(connectionID, cb)
                .then(() => {
                    should.equal(connectorServer.connections[connectionID], undefined);
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionLogin', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
        });

        it('should login', () => {
            mockConnection.login.withArgs(enrollmentID, enrollmentSecret).resolves(mockSecurityContext);
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionLogin(connectionID, enrollmentID, enrollmentSecret, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                    connectorServer.securityContexts[securityContextID].should.equal(mockSecurityContext);
                    mockConnection.on.withArgs('events', sinon.match.func).yield(['event1', 'event2']);
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, 'events', connectionID, ['event1', 'event2']);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionLogin(invalidID, enrollmentID, enrollmentSecret, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle login errors', () => {
            mockConnection.login.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionLogin(connectionID, enrollmentID, enrollmentSecret, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionDeploy', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should deploy with force set to true', () => {
            mockConnection.deploy.withArgs(mockSecurityContext, true, mockBusinessNetworkDefinition).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(connectionID, securityContextID, true, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    const buffer = BusinessNetworkDefinition.fromArchive.args[0][0];
                    Buffer.isBuffer(buffer).should.be.true;
                    Buffer.from('hello world').compare(buffer).should.equal(0);
                    sinon.assert.calledOnce(mockConnection.deploy);
                    sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, true, mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should deploy with force set to false', () => {
            mockConnection.deploy.withArgs(mockSecurityContext, false, mockBusinessNetworkDefinition).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(connectionID, securityContextID, false, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    const buffer = BusinessNetworkDefinition.fromArchive.args[0][0];
                    Buffer.isBuffer(buffer).should.be.true;
                    Buffer.from('hello world').compare(buffer).should.equal(0);
                    sinon.assert.calledOnce(mockConnection.deploy);
                    sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, false, mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(invalidID, securityContextID, true, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(connectionID, invalidID, true, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle deploy errors', () => {
            mockConnection.deploy.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(connectionID, securityContextID, true, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionUpdate', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should update', () => {
            mockConnection.update.withArgs(mockSecurityContext, mockBusinessNetworkDefinition).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionUpdate(connectionID, securityContextID, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    const buffer = BusinessNetworkDefinition.fromArchive.args[0][0];
                    Buffer.isBuffer(buffer).should.be.true;
                    Buffer.from('hello world').compare(buffer).should.equal(0);
                    sinon.assert.calledOnce(mockConnection.update);
                    sinon.assert.calledWith(mockConnection.update, mockSecurityContext, mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionUpdate(invalidID, securityContextID, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionUpdate(connectionID, invalidID, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle update errors', () => {
            mockConnection.update.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionUpdate(connectionID, securityContextID, 'aGVsbG8gd29ybGQ=', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionUndeploy', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should undeploy', () => {
            mockConnection.undeploy.withArgs(mockSecurityContext, businessNetworkIdentifier).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionUndeploy(connectionID, securityContextID, businessNetworkIdentifier, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.undeploy);
                    sinon.assert.calledWith(mockConnection.undeploy, mockSecurityContext, businessNetworkIdentifier);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionUndeploy(invalidID, securityContextID, businessNetworkIdentifier, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionUndeploy(connectionID, invalidID, businessNetworkIdentifier, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle undeploy errors', () => {
            mockConnection.undeploy.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionUndeploy(connectionID, securityContextID, businessNetworkIdentifier, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionPing', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should ping', () => {
            mockConnection.ping.withArgs(mockSecurityContext).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionPing(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                    sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionPing(invalidID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionPing(connectionID, invalidID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle ping errors', () => {
            mockConnection.ping.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionPing(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionQueryChainCode', () => {

        const functionName = 'func1';
        const args = [ 'arg1', 'arg2', 'arg3' ];

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should query chain code', () => {
            mockConnection.queryChainCode.withArgs(mockSecurityContext, functionName, args).resolves(Buffer.from('hello world'));
            const cb = sinon.stub();
            return connectorServer.connectionQueryChainCode(connectionID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.queryChainCode);
                    sinon.assert.calledWith(mockConnection.queryChainCode, mockSecurityContext, functionName, args);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, 'hello world');
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionQueryChainCode(invalidID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionQueryChainCode(connectionID, invalidID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle query chain code errors', () => {
            mockConnection.queryChainCode.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionQueryChainCode(connectionID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionInvokeChainCode', () => {

        const functionName = 'func1';
        const args = [ 'arg1', 'arg2', 'arg3' ];

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should invoke chain code', () => {
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, functionName, args).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, functionName, args);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(invalidID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, invalidID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle invoke chain code errors', () => {
            mockConnection.invokeChainCode.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionCreateIdentity', () => {

        const userID = 'bob1';
        const options = {
            prop1: 'value1',
            prop2: 'value2',
        };
        const result = {
            userID: userID,
            userSecret: 'wows3cret'
        };

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should create identitiy', () => {
            mockConnection.createIdentity.withArgs(mockSecurityContext, userID, options).resolves(result);
            const cb = sinon.stub();
            return connectorServer.connectionCreateIdentity(connectionID, securityContextID, userID, options, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, userID, options);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, result);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionCreateIdentity(invalidID, securityContextID, userID, options, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionCreateIdentity(connectionID, invalidID, userID, options, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle create identity errors', () => {
            mockConnection.createIdentity.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionCreateIdentity(connectionID, securityContextID, userID, options, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionList', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should list', () => {
            mockConnection.list.withArgs(mockSecurityContext).resolves(['org.acme.biznet1', 'org.acme.biznet2']);
            const cb = sinon.stub();
            return connectorServer.connectionList(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.list);
                    sinon.assert.calledWith(mockConnection.list, mockSecurityContext);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, ['org.acme.biznet1', 'org.acme.biznet2']);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionList(invalidID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No connection found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle an invalid security context ID ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionList(connectionID, invalidID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle list errors', () => {
            mockConnection.list.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionList(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

});
