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

const Serializer = require('composer-common').Serializer;
const Factory = require('composer-common').Factory;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const AssetDeclaration = require('composer-common').AssetDeclaration;
const AssetRegistry = require('../lib/assetregistry');
const BusinessNetworkConnection = require('..').BusinessNetworkConnection;
const ComboConnectionProfileStore = require('composer-common').ComboConnectionProfileStore;
const commonQuery = require('composer-common').Query;
const Connection = require('composer-common').Connection;
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const ModelManager = require('composer-common').ModelManager;
const ParticipantRegistry = require('../lib/participantregistry');
const Query = require('../lib/query');
const QueryFile = require('composer-common').QueryFile;
const QueryManager = require('composer-common').QueryManager;
const Resource = require('composer-common').Resource;
const SecurityContext = require('composer-common').SecurityContext;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const TransactionRegistry = require('../lib/transactionregistry');
const Util = require('composer-common').Util;
const uuid = require('uuid');
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('BusinessNetworkConnection', () => {

    let sandbox;
    let businessNetworkConnection;
    let mockSecurityContext;
    let mockConnection;
    let mockBusinessNetworkDefinition;
    let mockModelManager;
    let mockQueryManager;
    let mockQueryFile;
    let mockFactory;
    let mockSerializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockConnection = sinon.createStubInstance(Connection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.businessNetwork = mockBusinessNetworkDefinition;
        mockModelManager = sinon.createStubInstance(ModelManager);
        businessNetworkConnection.businessNetwork.getModelManager.returns(mockModelManager);
        mockQueryManager = sinon.createStubInstance(QueryManager);
        businessNetworkConnection.businessNetwork.getQueryManager.returns(mockQueryManager);
        mockQueryFile = sinon.createStubInstance(QueryFile);
        mockQueryManager.createQueryFile.returns(mockQueryFile);
        mockFactory = sinon.createStubInstance(Factory);
        businessNetworkConnection.businessNetwork.getFactory.returns(mockFactory);
        mockSerializer = sinon.createStubInstance(Serializer);
        businessNetworkConnection.businessNetwork.getSerializer.returns(mockSerializer);
        businessNetworkConnection.securityContext = mockSecurityContext;
        delete process.env.COMPOSER_CONFIG;
    });

    afterEach(() => {
        sandbox.restore();
        delete process.env.COMPOSER_CONFIG;
    });

    describe('#constructor', () => {

        it('should create a new instance with a file system connection profile store', () => {
            businessNetworkConnection = new BusinessNetworkConnection();
            should.equal(businessNetworkConnection.connection, null);
            businessNetworkConnection.connectionProfileStore.should.be.an.instanceOf(FSConnectionProfileStore);
        });

        it('should create a new instance with a combo connection profile store', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                    hlfabric2: {
                        type: 'hlfv2'
                    }
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            businessNetworkConnection = new BusinessNetworkConnection();
            should.equal(businessNetworkConnection.connection, null);
            businessNetworkConnection.connectionProfileStore.should.be.an.instanceOf(ComboConnectionProfileStore);
        });

    });

    describe('#connect', () => {

        it('should create a connection and download the business network archive', () => {
            sandbox.stub(businessNetworkConnection.connectionProfileManager, 'connect').resolves(mockConnection);
            mockConnection.login.resolves(mockSecurityContext);
            mockConnection.ping.resolves();
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);

            return businessNetworkConnection.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret')
            .then((result) => {
                sinon.assert.calledOnce(businessNetworkConnection.connectionProfileManager.connect);
                sinon.assert.calledWith(businessNetworkConnection.connectionProfileManager.connect, 'testprofile', 'testnetwork');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'enrollmentID', 'enrollmentSecret');
                sinon.assert.calledOnce(mockConnection.ping);
                sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
                sinon.assert.calledOnce(Util.queryChainCode);
                sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getBusinessNetwork', []);
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, Buffer.from('aGVsbG8=', 'base64'));
                businessNetworkConnection.connection.should.equal(mockConnection);
                result.should.be.an.instanceOf(BusinessNetworkDefinition);
                businessNetworkConnection.dynamicQueryFile.should.equal(mockQueryFile);
            });
        });

        it('should create a connection and download the business network archive supplying any additional options', () => {
            sandbox.stub(businessNetworkConnection.connectionProfileManager, 'connect').resolves(mockConnection);
            mockConnection.login.resolves(mockSecurityContext);
            mockConnection.ping.resolves();
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);

            return businessNetworkConnection.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret', { some: 'other', options: true })
            .then((result) => {
                sinon.assert.calledOnce(businessNetworkConnection.connectionProfileManager.connect);
                sinon.assert.calledWith(businessNetworkConnection.connectionProfileManager.connect, 'testprofile', 'testnetwork', { some: 'other', options: true });
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'enrollmentID', 'enrollmentSecret');
                sinon.assert.calledOnce(mockConnection.ping);
                sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
                sinon.assert.calledOnce(Util.queryChainCode);
                sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getBusinessNetwork', []);
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, Buffer.from('aGVsbG8=', 'base64'));
                businessNetworkConnection.connection.should.equal(mockConnection);
                result.should.be.an.instanceOf(BusinessNetworkDefinition);
                businessNetworkConnection.dynamicQueryFile.should.equal(mockQueryFile);
            });
        });

        it('should create a connection, listen for events, and emit the events it detects individually', () => {
            sandbox.stub(businessNetworkConnection.connectionProfileManager, 'connect').resolves(mockConnection);
            mockConnection.login.resolves(mockSecurityContext);
            mockConnection.ping.resolves();
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            const cb = sinon.stub();
            businessNetworkConnection.on('event', cb);
            mockConnection.on.withArgs('events', sinon.match.func).yields(['event1', 'event2']);
            mockSerializer.fromJSON.onCall(0).returns('event1#serialized');
            mockSerializer.fromJSON.onCall(1).returns('event2#serialized');

            return businessNetworkConnection.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret', { some: 'other', options: true })
            .then((result) => {
                sinon.assert.calledTwice(cb); // two events
                sinon.assert.calledWith(cb, 'event1#serialized');
                sinon.assert.calledWith(cb, 'event2#serialized');
            });
        });
    });

    describe('#disconnect', () => {

        it('should do nothing if not connected', () => {
            return businessNetworkConnection.disconnect();
        });

        it('should disconnect the connection if connected', () => {
            mockConnection.disconnect.returns(Promise.resolve());
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.disconnect);
                    sinon.assert.calledOnce(mockConnection.removeListener);
                    return businessNetworkConnection.disconnect();
                })
                .then(() => {
                    mockConnection.removeListener.withArgs('events', sinon.match.func).yield(['event1', 'event2']);
                    should.equal(businessNetworkConnection.connection, null);
                    sinon.assert.calledOnce(mockConnection.disconnect);
                });
        });

    });

    describe('#getAllAssetRegistries', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllAssetRegistries()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry1 = sinon.createStubInstance(AssetRegistry);
            let assetRegistry2 = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([assetRegistry1, assetRegistry2]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllAssetRegistries()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.have.lengthOf(2);
                    result[0].should.equal(assetRegistry1);
                    result[1].should.equal(assetRegistry2);
                });

        });

    });

    describe('#getAssetRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .getAssetRegistry('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getAssetRegistry('wowsuchregistry')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#assetRegistryExists', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'assetRegistryExists').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .assetRegistryExists('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let stub = sandbox.stub(AssetRegistry, 'assetRegistryExists').resolves(true);

            // Invoke the function.
            return businessNetworkConnection
                .assetRegistryExists('wowsuchregistry')
                .then((exists) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    exists.should.equal(true);
                });

        });

    });


    describe('#addAssetRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves();

            businessNetworkConnection.mockSecurityContext = mockSecurityContext;

            // Invoke the function.
            return businessNetworkConnection
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', 'much assets are here', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#getAllParticipantRegistries', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(ParticipantRegistry, 'getAllParticipantRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllParticipantRegistries()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let participantRegistry1 = sinon.createStubInstance(ParticipantRegistry);
            let participantRegistry2 = sinon.createStubInstance(ParticipantRegistry);
            let stub = sandbox.stub(ParticipantRegistry, 'getAllParticipantRegistries').resolves([participantRegistry1, participantRegistry2]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllParticipantRegistries()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.have.lengthOf(2);
                    result[0].should.equal(participantRegistry1);
                    result[1].should.equal(participantRegistry2);
                });

        });

    });

    describe('#getParticipantRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(ParticipantRegistry, 'getParticipantRegistry').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .getParticipantRegistry('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let participantRegistry = sinon.createStubInstance(ParticipantRegistry);
            let stub = sandbox.stub(ParticipantRegistry, 'getParticipantRegistry').resolves(participantRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getParticipantRegistry('wowsuchregistry')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(participantRegistry);
                });

        });

    });

    describe('#participantRegistryExists', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(ParticipantRegistry, 'participantRegistryExists').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .participantRegistryExists('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let stub = sandbox.stub(ParticipantRegistry, 'participantRegistryExists').resolves(true);

            // Invoke the function.
            return businessNetworkConnection
                .participantRegistryExists('wowsuchregistry')
                .then((exists) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    exists.should.equal(true);
                });

        });

    });

    describe('#addParticipantRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(ParticipantRegistry, 'addParticipantRegistry').resolves();

            businessNetworkConnection.mockSecurityContext = mockSecurityContext;

            // Invoke the function.
            return businessNetworkConnection
                .addParticipantRegistry('wowsuchregistry', 'much participants are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let participantRegistry = sinon.createStubInstance(ParticipantRegistry);
            let stub = sandbox.stub(ParticipantRegistry, 'addParticipantRegistry').resolves(participantRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .addParticipantRegistry('wowsuchregistry', 'much participants are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', 'much participants are here', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(participantRegistry);
                });

        });

    });

    describe('#getTransactionRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            let transactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([transactionRegistry]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            let stub = sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([mockTransactionRegistry]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockTransactionRegistry);
                });

        });

        it('should throw when the default transaction registry does not exist', () => {

            // Set up the mock.
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .should.be.rejectedWith(/default transaction registry/);

        });

    });

    describe('#submitTransaction', () => {

        it('should throw when transaction not specified', () => {
            (function () {
                businessNetworkConnection.submitTransaction(null);
            }).should.throw(/transaction not specified/);
        });

        it('should throw when type is not a transaction', () => {
            let assetDecl = sinon.createStubInstance(AssetDeclaration);
            let asset = sinon.createStubInstance(Resource);
            assetDecl.getFullyQualifiedName.returns('such.ns.suchType');
            asset.getClassDeclaration.returns(assetDecl);
            mockFactory.newResource.returns(asset);
            (function () {
                businessNetworkConnection.submitTransaction(asset);
            }).should.throw(/such\.ns\.suchType is not a transaction/);
        });

        it('should invoke the chain-code', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);
            tx.getIdentifier.returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');
            tx.timestamp = new Date();

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the submitTransaction function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);
                });

        });

        it('should generate a transaction ID if one not specified', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

        it('should generate a transaction timestamp if one not specified', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Check the timestamp was added.
                    sinon.assert.calledWith(mockSerializer.toJSON, sinon.match((tx) => {
                        tx.timestamp.should.be.an.instanceOf(Date);
                        return true;
                    }));

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', json]);

                });

        });

        it('should handle an error from the chain-code', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);
            tx.getIdentifier.returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            mockSerializer.toJSON.returns(json);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {
                    throw new Error('should not get here');
                }).catch((error) => {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#buildQuery', () => {

        it('should build the query', () => {
            const mockCommonQuery = sinon.createStubInstance(commonQuery);
            businessNetworkConnection.dynamicQueryFile = mockQueryFile;
            mockQueryFile.buildQuery.withArgs('Dynamic query', 'Dynamic query', 'SELECT doge').returns(mockCommonQuery);
            const result = businessNetworkConnection.buildQuery('SELECT doge');
            result.should.be.an.instanceOf(Query);
            result.getIdentifier().should.equal('SELECT doge');
            sinon.assert.calledOnce(mockCommonQuery.validate);
        });

    });

    describe('#query', () => {

        let mockResource1, mockResource2;

        beforeEach(() => {
            mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.$identifier = 'ASSET_1';
            mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.$identifier = 'ASSET_2';
            mockSerializer.fromJSON.withArgs({ $identifier: 'ASSET_1' }).returns(mockResource1);
            mockSerializer.fromJSON.withArgs({ $identifier: 'ASSET_2' }).returns(mockResource2);
        });

        it('should throw for an invalid query', () => {
            (() => {
                businessNetworkConnection.query(3.124);
            }).should.throw(/Invalid query; expecting a built query or the name of a query/);
        });

        it('should submit a built query', () => {
            const query = new Query('SELECT doge');
            const response = [
                { $identifier: 'ASSET_1' },
                { $identifier: 'ASSET_2' }
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['build', 'SELECT doge', '{}']).resolves(buffer);
            return businessNetworkConnection.query(query)
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].should.equal(mockResource1);
                    response[1].should.equal(mockResource2);
                });
        });

        it('should submit a built query with parameters', () => {
            const query = new Query('SELECT doge');
            const response = [
                { $identifier: 'ASSET_1' },
                { $identifier: 'ASSET_2' }
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['build', 'SELECT doge', '{"param1":true}']).resolves(buffer);
            return businessNetworkConnection.query(query, { param1: true })
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].should.equal(mockResource1);
                    response[1].should.equal(mockResource2);
                });
        });

        it('should submit a named query', () => {
            const response = [
                { $identifier: 'ASSET_1' },
                { $identifier: 'ASSET_2' }
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['named', 'Q1', '{}']).resolves(buffer);
            return businessNetworkConnection.query('Q1')
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].should.equal(mockResource1);
                    response[1].should.equal(mockResource2);
                });
        });

        it('should submit a named query with parameters', () => {
            const response = [
                { $identifier: 'ASSET_1' },
                { $identifier: 'ASSET_2' }
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['named', 'Q1', '{"param1":true}']).resolves(buffer);
            return businessNetworkConnection.query('Q1', { param1: true })
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].should.equal(mockResource1);
                    response[1].should.equal(mockResource2);
                });
        });

    });

    describe('#ping', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version: version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version: version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

    describe('#issueIdentity', () => {

        beforeEach(() => {
            businessNetworkConnection.connection = mockConnection;
            mockConnection.createIdentity.withArgs(mockSecurityContext, 'dogeid1').resolves({
                userID: 'dogeid1',
                userSecret: 'suchsecret'
            });
        });

        it('should throw if participant not specified', () => {
            (() => {
                businessNetworkConnection.issueIdentity(null, 'ZLBYrYMQve2vp74m');
            }).should.throw(/participant not specified/);
        });

        it('should throw if userID not specified', () => {
            (() => {
                let mockResource = sinon.createStubInstance(Resource);
                mockResource.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
                businessNetworkConnection.issueIdentity(mockResource, null);
            }).should.throw(/userID not specified/);
        });

        it('should submit a request to the chaincode for a resource', () => {
            sandbox.stub(Util, 'invokeChainCode').resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            return businessNetworkConnection.issueIdentity(mockResource, 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'addParticipantIdentity', ['org.doge.Doge#DOGE_1', 'dogeid1']);
                    result.should.deep.equal({
                        userID: 'dogeid1',
                        userSecret: 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode for a fully qualified identifier', () => {
            sandbox.stub(Util, 'invokeChainCode').resolves();
            return businessNetworkConnection.issueIdentity('org.doge.Doge#DOGE_1', 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'addParticipantIdentity', ['org.doge.Doge#DOGE_1', 'dogeid1']);
                    result.should.deep.equal({
                        userID: 'dogeid1',
                        userSecret: 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode with additional options', () => {
            sandbox.stub(Util, 'invokeChainCode').resolves();
            return businessNetworkConnection.issueIdentity('org.doge.Doge#DOGE_1', 'dogeid1', { issuer: true })
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1', { issuer: true });
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'addParticipantIdentity', ['org.doge.Doge#DOGE_1', 'dogeid1']);
                    result.should.deep.equal({
                        userID: 'dogeid1',
                        userSecret: 'suchsecret'
                    });
                });
        });

    });

    describe('#revokeIdentity', () => {

        it('should throw if identity not specified', () => {
            (() => {
                let mockResource = sinon.createStubInstance(Resource);
                mockResource.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
                businessNetworkConnection.revokeIdentity(null);
            }).should.throw(/identity not specified/);
        });

        it('should submit a request to the chaincode', () => {
            sandbox.stub(Util, 'invokeChainCode').resolves();
            return businessNetworkConnection.revokeIdentity('dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'removeIdentity', ['dogeid1']);
                });
        });

    });

});
