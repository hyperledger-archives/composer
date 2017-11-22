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

const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const ConnectorServer = require('..');
const SecurityContext = require('composer-common').SecurityContext;
const uuid = require('uuid');

const should = require('chai').should();
const sinon = require('sinon');


describe('ConnectorServer', () => {

    const cardName = 'myCard';
    const card = new IdCard({userName : 'banana'}, {name : 'profileOne'});
    const cardOne = new IdCard({userName : 'bob'}, {name : 'profileTwo'});

    const connectionProfile = 'defaultProfile';
    const businessNetworkIdentifier = 'org-acme-biznet';
    const connectionOptions = {
        type : 'embedded',
        prop1 : 'value1',
        prop2 : 'value2'
    };

    const connectionID = 'f93cb63a-ba19-40c7-b68e-dad0959d9e8b';
    const enrollmentID = 'alice1';
    const enrollmentSecret = 'suchs3cret';
    const securityContextID = 'b65aa4ba-1dd8-4aa0-9f36-f74ba14d7420';
    const invalidID = '8f98ce55-423c-49bf-a036-969f0667776d';

    let mockConnectionProfileManager;
    let mockBusinessNetworkCardStore;
    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let mockSocket;
    let mockBusinessNetworkDefinition;
    let connectorServer;
    let sandbox;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockConnectionProfileManager.connect.throws(new Error('unexpected call'));
        mockBusinessNetworkCardStore = sinon.createStubInstance(BusinessNetworkCardStore);
        mockSocket = {
            on : sinon.stub(),
            emit : sinon.stub()
        };
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockConnection = sinon.createStubInstance(Connection);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        connectorServer = new ConnectorServer(mockBusinessNetworkCardStore, mockConnectionProfileManager, mockSocket);
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
            const functions = mockSocket.on.args.map((args) => {
                return args[0];
            });
            functions.sort().should.deep.equal([
                '/api/businessNetworkCardStoreGet',
                '/api/businessNetworkCardStoreHas',
                '/api/businessNetworkCardStoreGetAll',
                '/api/businessNetworkCardStorePut',
                '/api/businessNetworkCardStoreDelete',
                '/api/connectionCreateIdentity',
                '/api/connectionDeploy',
                '/api/connectionDisconnect',
                '/api/connectionInstall',
                '/api/connectionInvokeChainCode',
                '/api/connectionList',
                '/api/connectionLogin',
                '/api/connectionManagerConnect',
                '/api/connectionManagerImportIdentity',
                '/api/connectionPing',
                '/api/connectionQueryChainCode',
                '/api/connectionStart',
                '/api/connectionUndeploy',
                '/api/connectionUpdate',
                '/api/connectionManagerExportIdentity',
                '/api/connectionManagerRemoveIdentity',
                '/api/connectionCreateTransactionId'
            ].sort());
            mockSocket.on.args.forEach((args) => {
                args[1].should.be.a('function');
            });
        });

        it('should not register handlers for anything that is not a property', () => {
            ConnectorServer.prototype.foo = 'bar';
            try {
                connectorServer = new ConnectorServer(mockBusinessNetworkCardStore, mockConnectionProfileManager, mockSocket);
                mockSocket.on.args.forEach((args) => {
                    args[1].should.be.a('function');
                });
            } finally {
                delete ConnectorServer.prototype.foo;
            }
        });

    });

    describe('#businessNetworkCardStoreGet', () => {
        it('should get a business network card', () => {
            mockBusinessNetworkCardStore.get.withArgs(cardName).resolves(card);
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreGet(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkCardStore.get);
                    sinon.assert.calledWith(mockBusinessNetworkCardStore.get, cardName);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, card);
                });
        });

        it('should handle errors getting a card', () => {
            mockBusinessNetworkCardStore.get.withArgs(cardName).rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreGet(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });
    });

    describe('#businessNetworkCardStoreHas', () => {
        it('should has a business network card', () => {
            mockBusinessNetworkCardStore.has.withArgs(cardName).resolves(false);
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreHas(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkCardStore.has);
                    sinon.assert.calledWith(mockBusinessNetworkCardStore.has, cardName);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, false);
                });
        });

        it('should handle errors has a card', () => {
            mockBusinessNetworkCardStore.has.withArgs(cardName).rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreHas(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });
    });

    describe('#businessNetworkCardPut', () => {

        it('should put a card', () => {
            mockBusinessNetworkCardStore.put.withArgs(cardName, card).resolves();
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStorePut(cardName, card, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkCardStore.put);
                    sinon.assert.calledWith(mockBusinessNetworkCardStore.put, cardName, card);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle errors putting a card', () => {
            mockBusinessNetworkCardStore.put.withArgs(cardName, card).rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStorePut(cardName, card, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });
    });

    describe('#businessNetworkCardGetAll', () => {

        it('should get all cards', () => {
            let myMap = new Map();
            myMap.set('cardOne', card);
            myMap.set('cardTwo', cardOne);
            mockBusinessNetworkCardStore.getAll.withArgs().resolves(myMap);
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreGetAll(cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkCardStore.getAll);
                    sinon.assert.calledWith(mockBusinessNetworkCardStore.getAll);
                    sinon.assert.calledOnce(cb);

                    let cardObject = {};

                    myMap.forEach((card, cardName) => {
                        cardObject[cardName] = card;
                    });

                    sinon.assert.calledWith(cb, null, cardObject);
                });
        });

        it('should handle errors getting all cards', () => {
            mockBusinessNetworkCardStore.getAll.withArgs().rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreGetAll(cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });
    });

    describe('#businessNetworkCardsDelete', () => {

        it('should delete a card', () => {
            mockBusinessNetworkCardStore.delete.withArgs(cardName).resolves();
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreDelete(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkCardStore.delete);
                    sinon.assert.calledWith(mockBusinessNetworkCardStore.delete, cardName);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle errors deleting a card', () => {
            mockBusinessNetworkCardStore.delete.withArgs(cardName).rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.businessNetworkCardStoreDelete(cardName, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });
    });

    describe('#connectionManagerImportIdentity', () => {

        it('should import an identity', () => {
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.importIdentity.resolves();
            const cb = sinon.stub();
            return connectorServer.connectionManagerImportIdentity(connectionProfile, connectionOptions, 'bob1', 'public key', 'private key', cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.importIdentity);
                    sinon.assert.calledWith(mockConnectionManager.importIdentity, connectionProfile, connectionOptions, 'bob1', 'public key', 'private key');
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle errors importing an identity', () => {
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.importIdentity.rejects(new Error('import error'));
            const cb = sinon.stub();
            return connectorServer.connectionManagerImportIdentity(connectionProfile, connectionOptions, 'bob1', 'public key', 'private key', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('import error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionManagerExportIdentity', function () {
        it('should export an identity', function () {
            const id = 'bob1';
            const expected = {key : 'value'};
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.exportIdentity.withArgs(connectionProfile, connectionOptions, id).resolves(expected);
            const callback = sinon.stub();
            return connectorServer.connectionManagerExportIdentity(connectionProfile, connectionOptions, id, callback)
                .then(() => {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, null, expected);
                });
        });

        it('should handle errors exporting an identity', function () {
            const expected = new Error('export error');
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.exportIdentity.rejects(expected);
            const callback = sinon.stub();
            return connectorServer.connectionManagerExportIdentity(connectionProfile, connectionOptions, 'bob1', callback)
                .then(() => {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, ConnectorServer.serializerr(expected));
                });
        });
    });

    describe('#connectionManagerRemoveIdentity', () => {

        it('should remove an identity', () => {
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.removeIdentity.resolves(true);
            const cb = sinon.stub();
            return connectorServer.connectionManagerRemoveIdentity(connectionProfile, connectionOptions, 'bob1', cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.removeIdentity);
                    sinon.assert.calledWith(mockConnectionManager.removeIdentity, connectionProfile, connectionOptions, 'bob1');
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, true);
                });
        });

        it('should handle errors removing an identity', () => {
            mockConnectionProfileManager.getConnectionManagerByType.withArgs(connectionOptions.type).resolves(mockConnectionManager);
            mockConnectionManager.removeIdentity.rejects(new Error('import error'));
            const cb = sinon.stub();
            return connectorServer.connectionManagerRemoveIdentity(connectionProfile, connectionOptions, 'bob1', cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('import error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });


    describe('#connectionManagerConnect', () => {

        it('should connect', () => {
            mockConnectionProfileManager.connect.withArgs(connectionProfile, businessNetworkIdentifier).resolves(mockConnection);
            sandbox.stub(uuid, 'v4').returns(connectionID);
            const cb = sinon.stub();
            return connectorServer.connectionManagerConnect(connectionProfile, businessNetworkIdentifier, connectionOptions, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileManager.connect);
                    sinon.assert.calledWith(mockConnectionProfileManager.connect, connectionProfile, businessNetworkIdentifier);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, connectionID);
                    connectorServer.connections[connectionID].should.equal(mockConnection);
                });
        });

        it('should handle connection errors', () => {
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

    describe('#connectionInstall', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should install', () => {
            mockConnection.install.withArgs(mockSecurityContext, businessNetworkIdentifier).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionInstall(connectionID, securityContextID, 'org-acme-biznet', {}, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.install);
                    sinon.assert.calledWith(mockConnection.install, mockSecurityContext, businessNetworkIdentifier);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionInstall(invalidID, securityContextID, 'org-acme-biznet', {}, cb)
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
            return connectorServer.connectionInstall(connectionID, invalidID, 'org-acme-biznet', {}, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle install errors', () => {
            mockConnection.install.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionInstall(connectionID, securityContextID, 'org-acme-biznet', {}, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.equal('such error');
                    serializedError.stack.should.be.a('string');
                });
        });

    });

    describe('#connectionStart', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should start', () => {
            mockConnection.start.withArgs(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', {opt : 1}).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionStart(connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', {opt : 1});
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionStart(invalidID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
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
            return connectorServer.connectionStart(connectionID, invalidID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle start errors', () => {
            mockConnection.start.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionStart(connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
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

        it('should deploy', () => {
            mockConnection.deploy.withArgs(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', {opt : 1}).resolves();
            sandbox.stub(uuid, 'v4').returns(securityContextID);
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.deploy);
                    sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', {opt : 1});
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionDeploy(invalidID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
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
            return connectorServer.connectionDeploy(connectionID, invalidID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
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
            return connectorServer.connectionDeploy(connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', {opt : 1}, cb)
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
        const args = ['arg1', 'arg2', 'arg3'];

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
        const args = ['arg1', 'arg2', 'arg3'];

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should invoke chain code with no options', () => {
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, functionName, args, sinon.match.any).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, null, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, functionName, args);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should invoke chain code with empty options', () => {
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, functionName, args, sinon.match.any).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, {}, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, functionName, args, {});
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });

        it('should invoke chain code with transactionId', () => {
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, functionName, args, sinon.match.any).resolves();
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, {transactionId: 'tID'}, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, functionName, args, {transactionId: 'tID'});
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null);
                });
        });


        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionInvokeChainCode(invalidID, securityContextID, functionName, args, {}, cb)
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
            return connectorServer.connectionInvokeChainCode(connectionID, invalidID, functionName, args, {}, cb)
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
            return connectorServer.connectionInvokeChainCode(connectionID, securityContextID, functionName, args, {}, cb)
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
            prop1 : 'value1',
            prop2 : 'value2',
        };
        const result = {
            userID : userID,
            userSecret : 'wows3cret'
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

        it('should list business networks', () => {
            mockConnection.list.withArgs(mockSecurityContext).resolves(['org-acme-biznet1', 'org-acme-biznet2']);
            const cb = sinon.stub();
            return connectorServer.connectionList(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.list);
                    sinon.assert.calledWith(mockConnection.list, mockSecurityContext);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, ['org-acme-biznet1', 'org-acme-biznet2']);
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

        it('should handle  errors', () => {
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

    describe('#connectionCreateTransactionId', () => {

        beforeEach(() => {
            connectorServer.connections[connectionID] = mockConnection;
            connectorServer.securityContexts[securityContextID] = mockSecurityContext;
        });

        it('should create a transaction id', () => {
            mockConnection.createTransactionId.withArgs(mockSecurityContext).resolves(['42']);
            const cb = sinon.stub();
            return connectorServer.connectionCreateTransactionId(connectionID, securityContextID, cb)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.createTransactionId);
                    sinon.assert.calledWith(mockConnection.createTransactionId, mockSecurityContext);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, null, ['42']);
                });
        });

        it('should handle an invalid connection ID', () => {
            const cb = sinon.stub();
            return connectorServer.connectionCreateTransactionId(invalidID, securityContextID, cb)
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
            return connectorServer.connectionCreateTransactionId(connectionID, invalidID, cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    const serializedError = cb.args[0][0];
                    serializedError.name.should.equal('Error');
                    serializedError.message.should.match(/No security context found with ID/);
                    serializedError.stack.should.be.a('string');
                });
        });

        it('should handle errors when creating transaction id', () => {
            mockConnection.createTransactionId.rejects(new Error('such error'));
            const cb = sinon.stub();
            return connectorServer.connectionCreateTransactionId(connectionID, securityContextID, cb)
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
