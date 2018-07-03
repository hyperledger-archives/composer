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
const AssetRegistry = require('../lib/assetregistry');
const BusinessNetworkConnection = require('..').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const CardStore = require('composer-common').BusinessNetworkCardStore;
const Connection = require('composer-common').Connection;
const Factory = require('composer-common').Factory;
const IdCard = require('composer-common').IdCard;
const IdentityRegistry = require('../lib/identityregistry');
const ModelManager = require('composer-common').ModelManager;
const ParticipantRegistry = require('../lib/participantregistry');
const Query = require('../lib/query');
const Resource = require('composer-common').Resource;
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const TransactionRegistry = require('../lib/transactionregistry');
const Registry = require('../lib/registry');
const Historian = require('../lib/historian');
const Util = require('composer-common').Util;
const uuid = require('uuid');
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('BusinessNetworkConnection', () => {

    let sandbox;
    let clock;
    let businessNetworkConnection;
    let mockSecurityContext;
    let mockConnection;
    let businessNetworkDefinition;
    let businessNetworkArchive;
    let modelManager;
    let factory;
    let serializer;
    let mockParticipantRegistry;

    beforeEach(async () => {
        sandbox = sinon.sandbox.create();
        clock = sinon.useFakeTimers();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockConnection = sinon.createStubInstance(Connection);
        mockSecurityContext.getConnection.returns(mockConnection);
        businessNetworkDefinition = new BusinessNetworkDefinition('super-doge-network@0.0.1');
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.businessNetwork = businessNetworkDefinition;
        modelManager = businessNetworkDefinition.getModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        asset MyAsset identified by assetId {
            o String assetId
        }
        participant MyParticipant identified by participantId {
            o String participantId
        }
        transaction MyTransaction {

        }
        event MyEvent {

        }
        concept MyConcept {
            o String value
        }
        @returns(MyConcept)
        transaction MyTransactionThatReturnsConcept {

        }
        @returns(MyConcept[])
        transaction MyTransactionThatReturnsConceptArray {

        }
        @returns(DateTime)
        transaction MyTransactionThatReturnsDateTime {

        }
        @returns(Integer)
        transaction MyTransactionThatReturnsInteger {

        }
        @returns(Long)
        transaction MyTransactionThatReturnsLong {

        }
        @returns(Double)
        transaction MyTransactionThatReturnsDouble {

        }
        @returns(Boolean)
        transaction MyTransactionThatReturnsBoolean {

        }
        @returns(String)
        transaction MyTransactionThatReturnsString {

        }
        @returns(String[])
        transaction MyTransactionThatReturnsStringArray {

        }
        @returns(Double[])
        transaction MyTransactionThatReturnsDoubleArray {

        }
        enum MyEnum {
            o WOW
            o SUCH
            o MANY
            o MUCH
        }
        @returns(MyEnum)
        transaction MyTransactionThatReturnsEnum {

        }
        @returns(MyEnum[])
        transaction MyTransactionThatReturnsEnumArray {

        }
        `);
        factory = modelManager.getFactory();
        serializer = modelManager.getSerializer();
        businessNetworkArchive = await businessNetworkDefinition.toArchive();
        businessNetworkConnection.securityContext = mockSecurityContext;
        mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
        delete process.env.COMPOSER_CONFIG;
    });

    afterEach(() => {
        sandbox.restore();
        clock.restore();
        delete process.env.COMPOSER_CONFIG;
    });

    describe('#constructor', () => {

        it('should create a new instance with a specified card store', () => {
            const mockCardStore = sinon.createStubInstance(BusinessNetworkCardStore);
            businessNetworkConnection = new BusinessNetworkConnection({cardStore : mockCardStore});
            should.equal(businessNetworkConnection.connection, null);
            businessNetworkConnection.cardStore.should.equal(mockCardStore);
        });

        it('should create a new instance with a specified wallet', () => {
            const wallet = {type:'composer-wallet-inmemory'};

            businessNetworkConnection = new BusinessNetworkConnection({wallet : wallet});
            should.equal(businessNetworkConnection.connection, null);
            businessNetworkConnection.cardStore.should.be.an.instanceOf(BusinessNetworkCardStore);
        });
    });

    describe('#connect', () => {
        const userName = 'FredBloggs';
        const enrollmentSecret = 'password';
        const keyValStore = '/conga/conga/conga';
        let mockIdCard;
        let idcard;

        beforeEach(() => {

            const metadata = {
                userName : 'Pingu',
                roles : ['PeerAdmin', 'ChannelAdmin']
            };
            const connection = {};
            connection.card = 'user@penguin-network';
            connection.name = 'connectionName';

            idcard = new IdCard(metadata, connection);
            const certificate = 'CERTIFICATE_DATA';
            const privateKey = 'PRIVATE_KEY_DATA';
            idcard.setCredentials({certificate : certificate, privateKey : privateKey});

            sandbox.stub(businessNetworkConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
            let mockCardStore = sinon.createStubInstance(CardStore);
            mockIdCard = sinon.createStubInstance(IdCard);
            mockCardStore.get.withArgs('cardName').resolves(mockIdCard);
            mockCardStore.get.withArgs('CARD_NAME').resolves(mockIdCard);
            mockCardStore.get.withArgs('credentialsCardName').resolves(idcard);
            mockIdCard.getEnrollmentCredentials.returns({secret : enrollmentSecret});
            mockIdCard.getUserName.returns(userName);
            mockIdCard.getConnectionProfile.returns({keyValStore : keyValStore});
            businessNetworkConnection.cardStore = mockCardStore;

            mockConnection.login.resolves(mockSecurityContext);
            mockConnection.ping.resolves();
            const buffer = Buffer.from(JSON.stringify({
                data : businessNetworkArchive.toString('base64')
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            const cb = sinon.stub();
            businessNetworkConnection.on('event', cb);
            mockConnection.on.withArgs('events', sinon.match.func).yields([
                {$class : 'org.acme.MyEvent', eventId : 'event1'},
                {$class : 'org.acme.MyEvent', eventId : 'event2'}
            ]);
        });

        afterEach(() => {
            sandbox.reset();
        });


        it('Correct with with existing card name & additional options', () => {
            return businessNetworkConnection.connect('cardName', {some : 'other', options : true})
                .then((result) => {
                    sinon.assert.calledWith(mockConnection.login, userName, enrollmentSecret);
                    businessNetworkConnection.getCard().should.equal(mockIdCard);
                });
        });

        it('Correct with with existing card name & additional options, without using the enrollmentsecret', () => {

            return businessNetworkConnection.connect('credentialsCardName', {some : 'other', options : true})
                .then((result) => {
                    sinon.assert.calledWith(mockConnection.login, 'Pingu', 'na');
                    businessNetworkConnection.getCard().should.equal(idcard);
                });
        });

        it('should add card name to connection profile additional options when additional options not specified', () => {
            const cardName = 'CARD_NAME';
            return businessNetworkConnection.connect(cardName)
                .then(result => {
                    sinon.assert.calledWith(businessNetworkConnection.connectionProfileManager.connectWithData,
                        sinon.match.any,
                        sinon.match.any,
                        sinon.match.has('cardName', cardName));
                    businessNetworkConnection.getCard().should.equal(mockIdCard);
                });
        });

        it('should override cardName property specified in additional options', () => {
            const cardName = 'CARD_NAME';
            return businessNetworkConnection.connect(cardName, {cardName : 'WRONG'})
                .then(result => {
                    sinon.assert.calledWith(businessNetworkConnection.connectionProfileManager.connectWithData,
                        sinon.match.any,
                        sinon.match.any,
                        sinon.match.has('cardName', cardName));
                    businessNetworkConnection.getCard().should.equal(mockIdCard);
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

    describe('#getRegistry', () => {
        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves({});
            // businessNetworkConnection.getModelManager.returns(modelManager);
            // Invoke the function.
            return businessNetworkConnection
                .getAssetRegistry('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should get an tx registry based on name', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistry.id = 'id';
            mockRegistry.name = 'name';
            sandbox.stub(Registry, 'getRegistry').resolves(mockRegistry);
            return businessNetworkConnection.getRegistry('org.acme.MyTransaction');
        });
        it('should get an asset registry based on name', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistry.id = 'id';
            mockRegistry.name = 'name';
            sandbox.stub(Registry, 'getRegistry').resolves(mockRegistry);
            return businessNetworkConnection.getRegistry('org.acme.MyAsset');
        });
        it('should get an participant registry based on name', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistry.id = 'id';
            mockRegistry.name = 'name';
            sandbox.stub(Registry, 'getRegistry').resolves(mockRegistry);
            return businessNetworkConnection.getRegistry('org.acme.MyParticipant');
        });

    });

    describe('#getAllAssetRegistries', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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
            let stub = sandbox.stub(Util, 'securityCheck');
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


    describe('#getHistorian', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            let historian = sinon.createStubInstance(Historian);
            sandbox.stub(Historian, 'getHistorian').resolves(historian);

            // Invoke the function.
            return businessNetworkConnection
                .getHistorian()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockHistorian = sinon.createStubInstance(Historian);
            let stub = sandbox.stub(Historian, 'getHistorian').resolves(mockHistorian);

            // Invoke the function.
            return businessNetworkConnection
                .getHistorian()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockHistorian);
                });

        });

        it('should throw when the default transaction registry does not exist', () => {

            // Set up the mock.
            sandbox.stub(Historian, 'getHistorian').resolves(null);

            // Invoke the function.
            return businessNetworkConnection
                .getHistorian()
                .should.be.rejectedWith(/historian/);

        });

    });

    describe('#getTransactionRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            let transactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getTransactionRegistry').resolves(transactionRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry('a-test-registry-id')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            let stub = sandbox.stub(TransactionRegistry, 'getTransactionRegistry').resolves(mockTransactionRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry('a-test-registry-id')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'a-test-registry-id', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockTransactionRegistry);
                });

        });

    });

    describe('#transactionRegistryExists', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(TransactionRegistry, 'transactionRegistryExists').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .transactionRegistryExists('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let stub = sandbox.stub(TransactionRegistry, 'transactionRegistryExists').resolves(true);

            // Invoke the function.
            return businessNetworkConnection
                .transactionRegistryExists('wowsuchregistry')
                .then((exists) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    exists.should.equal(true);
                });

        });

    });


    describe('#getAllTransactionRegistries', () => {

        it('should perform a security check', () => {
            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllTransactionRegistries()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockTransactionRegistry1 = sinon.createStubInstance(TransactionRegistry);
            let mockTransactionRegistry2 = sinon.createStubInstance(TransactionRegistry);
            let stub = sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([mockTransactionRegistry1, mockTransactionRegistry2]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllTransactionRegistries()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer), businessNetworkConnection, false);
                    result.should.have.lengthOf(2);
                    result[0].should.equal(mockTransactionRegistry1);
                    result[1].should.equal(mockTransactionRegistry2);
                });

        });

        it('does transaction regisitry exist', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllTransactionRegistries()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

    });

    describe('#submitTransaction', () => {

        it('should throw when transaction not specified', async () => {
            await businessNetworkConnection.submitTransaction(null)
                .should.be.rejectedWith(/transaction not specified/);
        });

        it('should throw when type is not a transaction', async () => {
            const asset = factory.newResource('org.acme', 'MyAsset', 'ASSET_1');
            await businessNetworkConnection.submitTransaction(asset)
                .should.be.rejectedWith(/org.acme.MyAsset is not a transaction/);
        });

        it('should invoke the chain-code for a transaction that does not return data', () => {

            // Fake the transaction registry.
            const txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').resolves(txRegistry);

            // Create the transaction.
            const tx = factory.newResource('org.acme', 'MyTransaction', 'c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });

            // Invoke the submitTransaction function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Force the transaction to be serialized as some fake JSON.
                    const json = JSON.stringify(serializer.toJSON(tx));

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', [json]);

                });

        });

        it('should invoke the chain-code for a transaction that does return data', () => {

            // Fake the transaction registry.
            const txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').resolves(txRegistry);

            // Create the transaction.
            const tx = factory.newResource('org.acme', 'MyTransactionThatReturnsString', 'c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode').resolves(Buffer.from('"hello world"'));
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });

            // Invoke the submitTransaction function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then((result) => {

                    // Check the result.
                    result.should.equal('hello world');

                    // Force the transaction to be serialized as some fake JSON.
                    const json = JSON.stringify(serializer.toJSON(tx));

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', [json]);

                });

        });

        it('should generate a transaction ID if one not specified', () => {

            // Fake the transaction registry.
            const txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').resolves(txRegistry);

            // Create the transaction.
            const tx = factory.newTransaction('org.acme', 'MyTransaction');
            delete tx.$identifier;

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Force the transaction to be serialized as some fake JSON.
                    const json = JSON.stringify(serializer.toJSON(tx));

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', [json]);

                });

        });

        it('should overwrite a user passed timestamp', () => {

            // Fake the transaction registry.
            const txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').resolves(txRegistry);

            // Create the transaction.
            const tx = factory.newTransaction('org.acme', 'MyTransaction');
            tx.timestamp = new Date('October 24, 1994');

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Force the transaction to be serialized as some fake JSON.
                    const serialized = serializer.toJSON(tx);
                    const json = JSON.stringify(serialized);

                    // Check that timestamp was overwritten
                    serialized.timestamp.should.deep.equal('1970-01-01T00:00:00.000Z');

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'submitTransaction', [json]);

                });

        });

        it('should handle an error from the chain-code', () => {

            // Fake the transaction registry.
            const txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').resolves(txRegistry);

            // Create the transaction.
            const tx = factory.newTransaction('org.acme', 'MyTransaction');
            delete tx.timestamp;

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode').rejects(new Error('such error'));
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#_processReturnData', () => {

        it('should handle no expected return value with no return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransaction');
            should.equal(businessNetworkConnection._processReturnData(transaction, [undefined]), undefined);
        });

        it('should handle no expected return value and ignore a return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransaction');
            should.equal(businessNetworkConnection._processReturnData(transaction, ['hello world']), undefined);
        });

        it('should handle a string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            businessNetworkConnection._processReturnData(transaction, '"hello world"').should.equal('hello world');
        });

        it('should handle a string array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsStringArray');
            businessNetworkConnection._processReturnData(transaction, '["hello", "world"]').should.deep.equal(['hello', 'world']);
        });

        it('should handle an enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            businessNetworkConnection._processReturnData(transaction, '"WOW"').should.equal('WOW');
        });

        it('should handle a concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            const json = serializer.toJSON(concept);
            const result = businessNetworkConnection._processReturnData(transaction, JSON.stringify(json));
            serializer.toJSON(result).should.deep.equal(json);
        });

        it('should throw if a return value required but return value was not provided', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                businessNetworkConnection._processReturnData(transaction, undefined);
            }).should.throw(/but nothing was returned by any functions/);
        });

    });

    describe('#_processComplexReturnData', () => {

        it('should throw for invalid JSON return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, 'lulz');
            }).should.throw(/return value of type MyConcept was expected/);
        });

        it('should handle a concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            const json = serializer.toJSON(concept);
            const result = businessNetworkConnection._processComplexReturnData(transaction, JSON.stringify(json));
            serializer.toJSON(result).should.deep.equal(json);
        });

        it('should handle a concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            const concept1 = factory.newConcept('org.acme', 'MyConcept');
            concept1.value = 'hello world';
            const concept2 = factory.newConcept('org.acme', 'MyConcept');
            concept2.value = 'purple mushroom';
            const json1 = serializer.toJSON(concept1);
            const json2 = serializer.toJSON(concept2);
            const result = businessNetworkConnection._processComplexReturnData(transaction, JSON.stringify([json1, json2])).map(item => serializer.toJSON(item));
            result.should.deep.equal([json1, json2]);
        });

        it('should throw for an invalid (wrong type) concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, '"hello world"');
            }).should.throw(/but a non-typed value was returned/);
        });

        it('should throw for an invalid (wrong element type) concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, '["hello world"]');
            }).should.throw(/but a non-typed value was returned/);
        });

        it('should throw for an invalid (wrong array type) concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, '3.142');
            }).should.throw(/but a value of type undefined was returned/);
        });

        it('should throw for a non-matching concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newTransaction('org.acme', 'MyTransaction');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, JSON.stringify(serializer.toJSON(concept)));
            }).should.throw(/but a value of type MyTransaction was returned/);
        });

        it('should throw for a non-matching concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            const concept1 = factory.newConcept('org.acme', 'MyConcept');
            concept1.value = 'hello world';
            const concept2 = factory.newTransaction('org.acme', 'MyTransaction');
            (() => {
                businessNetworkConnection._processComplexReturnData(transaction, JSON.stringify([serializer.toJSON(concept1), serializer.toJSON(concept2)]));
            }).should.throw(/but a value of type MyTransaction was returned/);
        });

    });

    describe('#_processEnumReturnValue', () => {

        it('should throw for invalid JSON return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            (() => {
                businessNetworkConnection._processEnumReturnData(transaction, 'lulz');
            }).should.throw(/return value of type MyEnum was expected/);
        });

        it('should handle an enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            businessNetworkConnection._processEnumReturnData(transaction, '"WOW"').should.equal('WOW');
        });

        it('should throw for an invalid enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            (() => {
                businessNetworkConnection._processEnumReturnData(transaction, '3.142');
            }).should.throw(/return value of type MyEnum was expected/);
        });

        it('should throw for an undefined enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            (() => {
                businessNetworkConnection._processEnumReturnData(transaction, '"CATZ RULE"');
            }).should.throw(/return value of type MyEnum was expected/);
        });

        it('should handle an enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            businessNetworkConnection._processEnumReturnData(transaction, '["SUCH", "MANY"]').should.deep.equal(['SUCH', 'MANY']);
        });

        it('should throw for an invalid enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            (() => {
                businessNetworkConnection._processEnumReturnData(transaction, '3.142');
            }).should.throw(/return value of type MyEnum\[\] was expected/);
        });

        it('should throw for an undefined enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            (() => {
                businessNetworkConnection._processEnumReturnData(transaction, '["CATZ", "RULE"]');
            }).should.throw(/return value of type MyEnum\[\] was expected/);
        });

    });

    describe('#_processPrimitiveReturnData', () => {

        it('should throw for invalid JSON return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, 'lulz');
            }).should.throw(/return value of type String was expected/);
        });

        it('should handle a date/time return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDateTime');
            const result = businessNetworkConnection._processPrimitiveReturnData(transaction, '"1970-01-01T00:00:00.000Z"');
            result.should.be.an.instanceOf(Date);
            result.getTime().should.equal(0);
        });

        it('should throw for an invalid date/time return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDateTime');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '3.142');
            }).should.throw(/return value of type DateTime was expected/);
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '"not a string"');
            }).should.throw(/return value of type DateTime was expected/);
        });

        it('should handle an integer return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsInteger');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '16384').should.equal(16384);
        });

        it('should throw for an invalid integer return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsInteger');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '"not a string"');
            }).should.throw(/return value of type Integer was expected/);
        });

        it('should handle a long return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsLong');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '10000000000').should.equal(10000000000);
        });

        it('should throw for an invalid long return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsLong');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '"not a string"');
            }).should.throw(/return value of type Long was expected/);
        });

        it('should handle a double return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDouble');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '3.142').should.equal(3.142);
        });

        it('should throw for an invalid double return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDouble');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '"not a string"');
            }).should.throw(/return value of type Double was expected/);
        });

        it('should handle a boolean return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsBoolean');
            businessNetworkConnection._processPrimitiveReturnData(transaction, 'true').should.equal(true);
        });

        it('should throw for an invalid boolean return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsBoolean');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '"not a string"');
            }).should.throw(/return value of type Boolean was expected/);
        });

        it('should handle a string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '"hello world"').should.equal('hello world');
        });

        it('should throw for an invalid string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '3.142');
            }).should.throw(/return value of type String was expected/);
        });

        it('should handle a string array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsStringArray');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '["hello", "world"]').should.deep.equal(['hello', 'world']);
        });

        it('should throw for an invalid string array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsStringArray');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, '[3.142]');
            }).should.throw(/return value of type String\[\] was expected/);
        });

        it('should handle a double array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDoubleArray');
            businessNetworkConnection._processPrimitiveReturnData(transaction, '[3.142, 1.234]').should.deep.equal([3.142, 1.234]);
        });

        it('should throw for an invalid double array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDoubleArray');
            (() => {
                businessNetworkConnection._processPrimitiveReturnData(transaction, 'null');
            }).should.throw(/return value of type Double\[\] was expected/);
        });

    });

    describe('#buildQuery', () => {

        it('should build the query', () => {
            businessNetworkConnection.dynamicQueryFile = businessNetworkDefinition.getQueryManager().createQueryFile('$dynamic_queries.qry', '');
            const result = businessNetworkConnection.buildQuery('SELECT org.acme.MyAsset');
            result.should.be.an.instanceOf(Query);
            result.getIdentifier().should.equal('SELECT org.acme.MyAsset');
        });

        it('should validate the query', () => {
            businessNetworkConnection.dynamicQueryFile = businessNetworkDefinition.getQueryManager().createQueryFile('$dynamic_queries.qry', '');
            (() => {
                businessNetworkConnection.buildQuery('SELECT org.acme.NoSuchAsset');
            }).should.throw(/Type NoSuchAsset is not defined in namespace org.acme/);
        });

    });

    describe('#query', () => {

        it('should throw for an invalid query', () => {
            (() => {
                businessNetworkConnection.query(3.124);
            }).should.throw(/Invalid query; expecting a built query or the name of a query/);
        });

        it('should submit a built query', () => {
            const query = new Query('SELECT doge');
            const response = [
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_1'},
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_2'}
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['build', 'SELECT doge', '{}']).resolves(buffer);
            return businessNetworkConnection.query(query)
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].instanceOf('org.acme.MyAsset').should.be.true;
                    response[0].getIdentifier().should.equal('ASSET_1');
                    response[1].instanceOf('org.acme.MyAsset').should.be.true;
                    response[1].getIdentifier().should.equal('ASSET_2');
                });
        });

        it('should submit a built query with parameters', () => {
            const query = new Query('SELECT doge');
            const response = [
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_1'},
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_2'}
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['build', 'SELECT doge', '{"param1":true}']).resolves(buffer);
            return businessNetworkConnection.query(query, {param1 : true})
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].instanceOf('org.acme.MyAsset').should.be.true;
                    response[0].getIdentifier().should.equal('ASSET_1');
                    response[1].instanceOf('org.acme.MyAsset').should.be.true;
                    response[1].getIdentifier().should.equal('ASSET_2');
                });
        });

        it('should submit a named query', () => {
            const response = [
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_1'},
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_2'}
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['named', 'Q1', '{}']).resolves(buffer);
            return businessNetworkConnection.query('Q1')
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].instanceOf('org.acme.MyAsset').should.be.true;
                    response[0].getIdentifier().should.equal('ASSET_1');
                    response[1].instanceOf('org.acme.MyAsset').should.be.true;
                    response[1].getIdentifier().should.equal('ASSET_2');
                });
        });

        it('should submit a named query with parameters', () => {
            const response = [
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_1'},
                {$class : 'org.acme.MyAsset', assetId : 'ASSET_2'}
            ];
            const buffer = Buffer.from(JSON.stringify(response));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'executeQuery', ['named', 'Q1', '{"param1":true}']).resolves(buffer);
            return businessNetworkConnection.query('Q1', {param1 : true})
                .then((response) => {
                    response.should.have.lengthOf(2);
                    response[0].instanceOf('org.acme.MyAsset').should.be.true;
                    response[0].getIdentifier().should.equal('ASSET_1');
                    response[1].instanceOf('org.acme.MyAsset').should.be.true;
                    response[1].getIdentifier().should.equal('ASSET_2');
                });
        });

    });

    describe('#ping', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

        it('should throw any errors that do not match ACTIVATION_REQUIRED', () => {
            mockConnection.ping.onFirstCall().rejects(new Error('something something ACTIVATION NOT REQUIRED'));
            mockConnection.ping.onSecondCall().resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity"}']).resolves();
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .should.be.rejectedWith(/ACTIVATION NOT REQUIRED/);
        });

        it('should activate the identity if the ping returns ACTIVATION_REQUIRED', () => {
            mockConnection.ping.onFirstCall().rejects(new Error('something something ACTIVATION_REQUIRED'));
            mockConnection.ping.onSecondCall().resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            mockConnection.invokeChainCode.resolves();
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledTwice(mockConnection.ping);
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","timestamp":"1970-01-01T00:00:00.000Z","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1"}']);
                });
        });

    });

    describe('#pingInner', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.pingInner()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.pingInner()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

    describe('#activate', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.invokeChainCode.resolves();
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.activate()
                .then(() => {
                    sinon.assert.calledTwice(Util.securityCheck);
                });
        });

        it('should submit a request to the chaincode for activation', () => {
            sandbox.stub(Util, 'createTransactionId').resolves({
                id : 'c89291eb-969f-4b04-b653-82deb5ee0ba1',
                idStr : 'c89291eb-969f-4b04-b653-82deb5ee0ba1'
            });
            mockConnection.invokeChainCode.resolves();
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.activate()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","timestamp":"1970-01-01T00:00:00.000Z","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1"}']);
                });
        });

    });

    describe('#issueIdentity', () => {

        beforeEach(() => {
            businessNetworkConnection.connection = mockConnection;
            mockConnection.createIdentity.withArgs(mockSecurityContext, 'dogeid1').resolves({
                userID : 'dogeid1',
                userSecret : 'suchsecret'
            });

            mockParticipantRegistry.exists.resolves(true);
            businessNetworkConnection.getParticipantRegistry = () => {
                return Promise.resolve(mockParticipantRegistry);
            };
        });

        it('should throw if participant not specified', () => {
            (() => {
                businessNetworkConnection.issueIdentity(null, 'ZLBYrYMQve2vp74m');
            }).should.throw(/participant not specified/);
        });

        it('should throw if identityName not specified', () => {
            (() => {
                let mockResource = sinon.createStubInstance(Resource);
                mockResource.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
                businessNetworkConnection.issueIdentity(mockResource, null);
            }).should.throw(/identityName not specified/);
        });

        it('should throw if participant does not exist', () => {
            sandbox.stub(Util, 'invokeChainCode').resolves();
            mockParticipantRegistry.exists.resolves(false);

            return businessNetworkConnection.issueIdentity('org.acme.MyParticipant#dogeid1', 'dogeid1')
                .catch((error) => {
                    error.should.match(/does not exist /);
                });
        });

        it('should throw an error if the identity exists in the registry and connection is requires registry check', () => {
            mockConnection.registryCheckRequired.returns(true);

            let identityRegistry = sinon.createStubInstance(IdentityRegistry);
            identityRegistry.getAll.resolves([{name: 'dogeid1'}]);
            sandbox.stub(IdentityRegistry, 'getIdentityRegistry').resolves(identityRegistry);

            return businessNetworkConnection.issueIdentity('org.acme.MyParticipant#dogeid1', 'dogeid1')
            .catch((error) => {
                error.should.match(/Identity with name dogeid1 already exists in super-doge-network/);
            });
        });

        it('should submit a request to the chaincode if the identity does not exist in the registry and connection is WebConnection', () => {
            mockConnection.registryCheckRequired.returns(true);

            let identityRegistry = sinon.createStubInstance(IdentityRegistry);
            identityRegistry.getAll.resolves([{name: 'dogeid0'}]);
            sandbox.stub(IdentityRegistry, 'getIdentityRegistry').resolves(identityRegistry);

            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();

            return businessNetworkConnection.issueIdentity('org.acme.MyParticipant#dogeid1', 'dogeid1')
            .then((result) => {
                sinon.assert.calledOnce(mockConnection.createIdentity);
                sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                const tx = businessNetworkConnection.submitTransaction.args[0][0];
                tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                tx.participant.isRelationship().should.be.true;
                tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                tx.identityName.should.equal('dogeid1');
                result.should.deep.equal({
                    userID : 'dogeid1',
                    userSecret : 'suchsecret'
                });
            });
        });

        it('should submit a request to the chaincode for a fully qualified identifier', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.issueIdentity('org.acme.MyParticipant#dogeid1', 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.identityName.should.equal('dogeid1');
                    result.should.deep.equal({
                        userID : 'dogeid1',
                        userSecret : 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode for a URI', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.issueIdentity('resource:org.acme.MyParticipant#dogeid1', 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.identityName.should.equal('dogeid1');
                    result.should.deep.equal({
                        userID : 'dogeid1',
                        userSecret : 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode for an resource', () => {
            const participant = factory.newResource('org.acme', 'MyParticipant', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.issueIdentity(participant, 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.identityName.should.equal('dogeid1');
                    result.should.deep.equal({
                        userID : 'dogeid1',
                        userSecret : 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode for an relationship', () => {
            const participant = factory.newRelationship('org.acme', 'MyParticipant', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.issueIdentity(participant, 'dogeid1')
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1');
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.identityName.should.equal('dogeid1');
                    result.should.deep.equal({
                        userID : 'dogeid1',
                        userSecret : 'suchsecret'
                    });
                });
        });

        it('should submit a request to the chaincode with additional options', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.issueIdentity('org.acme.MyParticipant#dogeid1', 'dogeid1', {
                issuer : true,
                affiliation : 'dogecorp'
            })
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.createIdentity);
                    sinon.assert.calledWith(mockConnection.createIdentity, mockSecurityContext, 'dogeid1', {
                        issuer : true,
                        affiliation : 'dogecorp'
                    });
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.IssueIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.identityName.should.equal('dogeid1');
                    result.should.deep.equal({
                        userID : 'dogeid1',
                        userSecret : 'suchsecret'
                    });
                });
        });

    });

    describe('#bindIdentity', () => {

        const pem = '-----BEGIN CERTIFICATE-----\nMIIB8jCCAZmgAwIBAgIULKt4c4xcdMwGgjNef9IL92HQkyAwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNzA4MTg1NzAwWhcNMTgwNzA4MTg1\nNzAwWjASMRAwDgYDVQQDEwdib29iaWVzMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD\nQgAE5P4RNqfEy8pArDxAbVIjRxqkwlpHUY7ANR6X7a4uvVIzIPDx4p7lf37xuc+5\nI9VZCvcI1SA5nIRphet0yYSgZaNsMGowDgYDVR0PAQH/BAQDAgIEMAwGA1UdEwEB\n/wQCMAAwHQYDVR0OBBYEFAmjJfUZvdB8pHvklsdd1HiVog+VMCsGA1UdIwQkMCKA\nIBmrZau7BIB9rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0cA\nMEQCIGtqR9rUR2ESu2UfUpNUfEeeBsshMkMHmuP/r5uvo2fSAiBtFB9Aid/3nexB\nI5qkVbdRSRQpt7uxoKFDLV/LUDM9xw==\n-----END CERTIFICATE-----\n';

        beforeEach(() => {
            businessNetworkConnection.connection = mockConnection;
        });

        it('should throw if participant not specified', () => {
            (() => {
                businessNetworkConnection.bindIdentity(null, pem);
            }).should.throw(/participant not specified/);
        });

        it('should throw if certificate not specified', () => {
            (() => {
                let mockResource = sinon.createStubInstance(Resource);
                mockResource.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
                businessNetworkConnection.bindIdentity(mockResource, null);
            }).should.throw(/certificate not specified/);
        });

        it('should submit a request to the chaincode for a fully qualified identifier', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.bindIdentity('org.acme.MyParticipant#dogeid1', pem)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.BindIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.certificate.should.equal(pem);
                });
        });

        it('should submit a request to the chaincode for a URI', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.bindIdentity('resource:org.acme.MyParticipant#dogeid1', pem)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.BindIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.certificate.should.equal(pem);
                });
        });

        it('should submit a request to the chaincode for an resource', () => {
            const participant = factory.newResource('org.acme', 'MyParticipant', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.bindIdentity(participant, pem)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.BindIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.certificate.should.equal(pem);
                });
        });

        it('should submit a request to the chaincode for an relationship', () => {
            const participant = factory.newRelationship('org.acme', 'MyParticipant', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.bindIdentity(participant, pem)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.BindIdentity').should.be.true;
                    tx.participant.isRelationship().should.be.true;
                    tx.participant.getFullyQualifiedIdentifier().should.equal('org.acme.MyParticipant#dogeid1');
                    tx.certificate.should.equal(pem);
                });
        });

    });

    describe('#revokeIdentity', () => {

        it('should throw if identity not specified', () => {
            (() => {
                businessNetworkConnection.revokeIdentity(null);
            }).should.throw(/identity not specified/);
        });

        it('should submit a request to the chaincode for a identifier', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.revokeIdentity('dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.RevokeIdentity').should.be.true;
                    tx.identity.isRelationship().should.be.true;
                    tx.identity.getFullyQualifiedIdentifier().should.equal('org.hyperledger.composer.system.Identity#dogeid1');
                });
        });

        it('should submit a request to the chaincode for a fully qualified identifier', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.revokeIdentity('org.hyperledger.composer.system.Identity#dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.RevokeIdentity').should.be.true;
                    tx.identity.isRelationship().should.be.true;
                    tx.identity.getFullyQualifiedIdentifier().should.equal('org.hyperledger.composer.system.Identity#dogeid1');
                });
        });

        it('should submit a request to the chaincode for a URI', () => {
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.revokeIdentity('resource:org.hyperledger.composer.system.Identity#dogeid1')
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.RevokeIdentity').should.be.true;
                    tx.identity.isRelationship().should.be.true;
                    tx.identity.getFullyQualifiedIdentifier().should.equal('org.hyperledger.composer.system.Identity#dogeid1');
                });
        });

        it('should submit a request to the chaincode for an resource', () => {
            const identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.revokeIdentity(identity)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.RevokeIdentity').should.be.true;
                    tx.identity.isRelationship().should.be.true;
                    tx.identity.getFullyQualifiedIdentifier().should.equal('org.hyperledger.composer.system.Identity#dogeid1');
                });
        });

        it('should submit a request to the chaincode for an relationship', () => {
            const identity = factory.newRelationship('org.hyperledger.composer.system', 'Identity', 'dogeid1');
            sandbox.stub(businessNetworkConnection, 'submitTransaction').resolves();
            return businessNetworkConnection.revokeIdentity(identity)
                .then(() => {
                    sinon.assert.calledOnce(businessNetworkConnection.submitTransaction);
                    const tx = businessNetworkConnection.submitTransaction.args[0][0];
                    tx.instanceOf('org.hyperledger.composer.system.RevokeIdentity').should.be.true;
                    tx.identity.isRelationship().should.be.true;
                    tx.identity.getFullyQualifiedIdentifier().should.equal('org.hyperledger.composer.system.Identity#dogeid1');
                });
        });

    });

    describe('#getIdentityRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox.stub(Util, 'securityCheck');
            let identityRegistry = sinon.createStubInstance(IdentityRegistry);
            sandbox.stub(IdentityRegistry, 'getIdentityRegistry').resolves(identityRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getIdentityRegistry()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockIdentityRegistry = sinon.createStubInstance(IdentityRegistry);
            let stub = sandbox.stub(IdentityRegistry, 'getIdentityRegistry').resolves(mockIdentityRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getIdentityRegistry()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockIdentityRegistry);
                });

        });

        it('should throw when the default identity registry does not exist', () => {

            // Set up the mock.
            sandbox.stub(IdentityRegistry, 'getIdentityRegistry').resolves(null);

            // Invoke the function.
            return businessNetworkConnection
                .getIdentityRegistry()
                .should.be.rejectedWith(/identity registry/);

        });
    });

    describe('#getNativeAPI', () => {

        it('should throw an error if not connected', () => {
            const nativeAPI = {
                getChannel: sinon.stub().returns({ channel: true })
            };
            mockConnection.getNativeAPI.returns(nativeAPI);
            (() => {
                businessNetworkConnection.getNativeAPI();
            }).should.throw(/not connected; must call connect\(\) first/);
        });

        it('should return the native API from the connection', () => {
            const nativeAPI = {
                getChannel: sinon.stub().returns({ channel: true })
            };
            mockConnection.getNativeAPI.returns(nativeAPI);
            businessNetworkConnection.connection = mockConnection;
            businessNetworkConnection.getNativeAPI().getChannel().should.deep.equal({ channel: true });
        });

    });

});
