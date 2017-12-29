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

const AssetRegistry = require('composer-client/lib/assetregistry');
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const BusinessNetworkConnectionWrapper = require('../lib/businessnetworkconnectionwrapper');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const EventEmitter = require('events');
const Factory = require('composer-common').Factory;
const IdCard = require('composer-common').IdCard;
const IdentityRegistry = require('composer-client/lib/identityregistry');
const Introspector = require('composer-common').Introspector;
const LoopbackVisitor = require('composer-common').LoopbackVisitor;
const ModelManager = require('composer-common').ModelManager;
const Query = require('composer-common').Query;
const QueryManager = require('composer-common').QueryManager;
const QueryFile = require('composer-common').QueryFile;
const NodeCache = require('node-cache');
const ParticipantRegistry = require('composer-client/lib/participantregistry');
const Serializer = require('composer-common').Serializer;
const TransactionRegistry = require('composer-client/lib/transactionregistry');
const Historian = require('composer-client/lib/historian');
const TypeNotFoundException = require('composer-common/lib/typenotfoundexception');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('BusinessNetworkConnector', () => {

    const MODEL_FILE = `
    namespace org.acme.base
    concept BaseConcept {
        o String theValue
    }
    asset BaseAsset identified by theValue {
        o String theValue
        o String theString optional
        o Integer theInteger optional
        o Boolean theBoolean optional
        o DateTime theDateTime optional
        o Double theDouble optional
        o Long theLong optional
        --> Member theMember optional
    }
    participant BaseParticipant identified by theValue {
        o String theValue
        o String theDescription optional
    }
    participant Member extends BaseParticipant {
    }
    transaction BaseTransaction {
    }`;

    let settings;
    let mockBusinessNetworkConnectionWrapper;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockSerializer;
    let mockQueryManager;
    let sandbox;
    let testConnector;
    let modelManager;
    let factory;
    let introspector;
    let mockQueryFile;
    let mockCardStore;
    let mockCard;

    beforeEach(() => {

        // create real instances
        modelManager = new ModelManager();
        modelManager.addModelFile(MODEL_FILE);
        introspector = new Introspector(modelManager);
        factory = new Factory(modelManager);

        // create mocks
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockCardStore = sinon.createStubInstance(BusinessNetworkCardStore);
        mockCard = sinon.createStubInstance(IdCard);

        // setup mocks
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.ping.resolves();
        mockBusinessNetworkConnection.disconnect.resolves();
        mockBusinessNetworkConnection.submitTransaction.resolves();
        mockBusinessNetworkDefinition.getIntrospector.returns(introspector);
        mockCard.getBusinessNetworkName.returns('biznet');
        mockCard.getConnectionProfile.returns({ type: 'hlfv1', name: 'hlfv1' });
        mockBusinessNetworkConnection.getCard.returns(mockCard);

        settings = {
            card: 'admin@biznet',
            cardStore: mockCardStore,
            multiuser: true
        };

        sandbox = sinon.sandbox.create();

        // setup test instance
        testConnector = new BusinessNetworkConnector(settings);
        mockBusinessNetworkConnectionWrapper = sinon.createStubInstance(BusinessNetworkConnectionWrapper);
        mockBusinessNetworkConnectionWrapper.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
        mockBusinessNetworkConnectionWrapper.getBusinessNetworkDefinition.returns(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnectionWrapper.getSerializer.returns(mockSerializer);
        mockBusinessNetworkConnectionWrapper.getModelManager.returns(modelManager);
        mockBusinessNetworkConnectionWrapper.getIntrospector.returns(introspector);
        testConnector.defaultConnectionWrapper = mockBusinessNetworkConnectionWrapper;

        // Generate models for our model file.
        // We don't want to set up the whole of LoopBack, so we override a base method.
        sandbox.stub(testConnector, 'getModelDefinition');//.throws(new Error('no type registered'));
        let visitor = new LoopbackVisitor(true);
        let modelSchemas = modelManager.accept(visitor, {});
        modelSchemas.forEach((modelSchema) => {
            modelSchema.settings = modelSchema.options;
            testConnector.getModelDefinition.withArgs(modelSchema.name).returns(modelSchema);
        });

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a new instance of the connector', () => {
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.connectionWrappers.should.be.an.instanceOf(NodeCache);
            testConnector.defaultConnectionWrapper.should.be.an.instanceOf(BusinessNetworkConnectionWrapper);
            testConnector.eventemitter.should.be.an.instanceOf(EventEmitter);
        });

        it('should default the namepsaces setting if not specified', () => {
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.settings.namespaces.should.equal('always');
        });

        it('should accept the specified the namepsaces setting', () => {
            settings.namespaces = 'never';
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.settings.namespaces.should.equal('never');
        });

        it('should install a cache function that disconnects the connection', (done) => {
            let mockBusinessNetworkConnectionWrapper = sinon.createStubInstance(BusinessNetworkConnectionWrapper);
            mockBusinessNetworkConnectionWrapper.disconnect.resolves();
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.connectionWrappers.set('key', mockBusinessNetworkConnectionWrapper);
            testConnector.connectionWrappers.del('key', (err, count) => {
                done();
            });
        });

        it('should install a cache function that handles a disconnection error', (done) => {
            let mockBusinessNetworkConnectionWrapper = sinon.createStubInstance(BusinessNetworkConnectionWrapper);
            mockBusinessNetworkConnectionWrapper.disconnect.rejects(new Error('such error'));
            sandbox.stub(console, 'error');
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.connectionWrappers.set('key', mockBusinessNetworkConnectionWrapper);
            testConnector.connectionWrappers.del('key', (err, count) => {
                done();
            });
        });

        it('should throw if card not specified', () => {
            delete settings.card;
            (() => {
                testConnector = new BusinessNetworkConnector(settings);
            }).should.throw(/card not specified/);
        });

    });

    describe('#getConnectionWrapper', () => {

        it('should return the default connection wrapper if multiuser not specified', () => {
            delete settings.multiuser;
            testConnector = new BusinessNetworkConnector(settings);
            testConnector.defaultConnectionWrapper = mockBusinessNetworkConnectionWrapper;
            testConnector.getConnectionWrapper().should.equal(mockBusinessNetworkConnectionWrapper);
        });

        it('should return the default connection wrapper if no options specified', () => {
            testConnector.getConnectionWrapper().should.equal(mockBusinessNetworkConnectionWrapper);
        });

        it('should return the default connection wrapper if options specified but no access token', () => {
            testConnector.getConnectionWrapper({}).should.equal(mockBusinessNetworkConnectionWrapper);
        });

        it('should throw if no card specified', () => {
            (() => {
                testConnector.getConnectionWrapper({
                    accessToken: {
                        id: '999'
                    },
                    cardStore: mockCardStore
                });
            }).should.throw(/A business network card has not been specified/);
        });

        it('should throw if no card store specified', () => {
            (() => {
                testConnector.getConnectionWrapper({
                    accessToken: {
                        id: '999'
                    },
                    card: 'admin@biznet'
                });
            }).should.throw(/A business network card store has not been specified/);
        });

        it('should create a new connection wrapper if not already cached', () => {
            const connectionWrapper = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                card: 'admin2@biznet',
                cardStore: mockCardStore
            });
            connectionWrapper.should.not.equal(mockBusinessNetworkConnectionWrapper);
            connectionWrapper.should.be.an.instanceOf(BusinessNetworkConnectionWrapper);
        });

        it('should return the cached connection wrapper if already cached', () => {
            const connectionWrapper1 = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                card: 'admin@biznet',
                cardStore: mockCardStore
            });
            const connectionWrapper2 = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                card: 'admin@biznet',
                cardStore: mockCardStore
            });
            connectionWrapper1.should.not.equal(mockBusinessNetworkConnectionWrapper);
            connectionWrapper1.should.be.an.instanceOf(BusinessNetworkConnectionWrapper);
            connectionWrapper2.should.not.equal(mockBusinessNetworkConnectionWrapper);
            connectionWrapper2.should.be.an.instanceOf(BusinessNetworkConnectionWrapper);
            connectionWrapper1.should.equal(connectionWrapper2);
        });

    });

    describe('#ensureConnected', () => {

        it('should ensure the connection wrapper is connected', () => {
            mockBusinessNetworkConnectionWrapper.ensureConnected.resolves();
            sandbox.spy(testConnector, 'getConnectionWrapper');
            testConnector.ensureConnected({ test: 'option' })
                .then(() => {
                    sinon.assert.calledOnce(testConnector.getConnectionWrapper);
                    sinon.assert.calledWith(testConnector.getConnectionWrapper, { test: 'option' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.ensureConnected);
                });
        });

    });

    describe('#connect', () => {

        it('should connect to a business network', () => {
            mockBusinessNetworkConnectionWrapper.connect.resolves();
            const cb = sinon.stub();
            return testConnector.connect(cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.connect);
                    testConnector.businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                    testConnector.serializer.should.equal(mockSerializer);
                    testConnector.modelManager.should.equal(modelManager);
                    testConnector.introspector.should.equal(introspector);
                    sinon.assert.calledOnce(cb);
                });

        });

        it('should connect to a business network and ignore missing callback', () => {
            mockBusinessNetworkConnectionWrapper.connect.resolves();
            return testConnector.connect()
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.connect);
                    testConnector.businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                    testConnector.serializer.should.equal(mockSerializer);
                    testConnector.modelManager.should.equal(modelManager);
                    testConnector.introspector.should.equal(introspector);
                });

        });

        it('should connect to a business network and register for events', () => {
            mockBusinessNetworkConnectionWrapper.connect.resolves();
            return testConnector.connect()
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.on);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.on, 'event', sinon.match.func);
                    const cb = sinon.stub();
                    mockSerializer.toJSON.returns({ foo: 'bar' });
                    testConnector.eventemitter.once('event', cb);
                    mockBusinessNetworkConnection.on.args[0][1]({ foo: 'bar' });
                    sinon.assert.calledOnce(mockSerializer.toJSON);
                    sinon.assert.calledWith(mockSerializer.toJSON, { foo: 'bar' });
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, { foo: 'bar' });
                });

        });

        it('should handle an error connecting to a business network', () => {
            const err = new Error('such error');
            mockBusinessNetworkConnectionWrapper.connect.rejects(err);
            const cb = sinon.stub();
            return testConnector.connect(cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.connect);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, err);
                });

        });

        it('should handle an error connecting to a business network and ignore missing callback', () => {
            const err = new Error('such error');
            mockBusinessNetworkConnectionWrapper.connect.rejects(err);
            return testConnector.connect()
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.connect);
                });

        });

    });

    describe('#ping', () => {

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
        });

        it('should ping the business network', () => {
            mockBusinessNetworkConnection.ping.resolves();
            const cb = sinon.stub();
            return testConnector.ping(cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, null);
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                    sinon.assert.calledOnce(cb);
                });
        });

        it('should handle an error pinging the business network', () => {
            const err = new Error('such error');
            mockBusinessNetworkConnection.ping.rejects(err);
            const cb = sinon.stub();
            return testConnector.ping(cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, null);
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, err);
                });
        });

        it('should ping the business network using LoopBack options', () => {
            mockBusinessNetworkConnection.ping.resolves();
            const cb = sinon.stub();
            return testConnector.ping({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                    sinon.assert.calledOnce(cb);
                });
        });

    });

    describe('#disconnect', () => {

        it('should disconnect from the business network', () => {
            mockBusinessNetworkConnectionWrapper.disconnect.resolves();
            const cb = sinon.stub();
            return testConnector.disconnect(cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.disconnect);
                    sinon.assert.calledOnce(cb);
                });
        });

        it('should handle an error disconnecting from the business network', () => {
            const err = new Error('such error');
            mockBusinessNetworkConnectionWrapper.disconnect.rejects(err);
            const cb = sinon.stub();
            return testConnector.disconnect(cb)
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnectionWrapper.disconnect);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, err);
                });
        });

    });

    describe('#subscribe', () => {

        it('should subscribe to events from the business network', () => {
            const cb = sinon.stub();
            testConnector.subscribe(cb);
            testConnector.eventemitter.emit('event', { foo: 'bar' });
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, { foo: 'bar' });
        });

    });


    describe('#unsubscribe', () => {

        it('should unsubscribe from events from the business network', () => {
            const cb = sinon.stub();
            testConnector.eventemitter.on('event', cb);
            testConnector.eventemitter.emit('event', { foo: 'bar' });
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, { foo: 'bar' });
            testConnector.unsubscribe(cb);
            testConnector.eventemitter.emit('event', { foo: 'bar' });
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, { foo: 'bar' });
        });

    });

    describe('#getComposerModelName', () => {

        it('should return the LoopBack model name if no model registered', () => {
            const lbModelName = 'org.acme.base.BaseAsset';
            testConnector.getComposerModelName(lbModelName).should.equal(lbModelName);
        });

        it('should return the Composer model name if model registered', () => {
            const lbModelName = 'org_acme_base_BaseAsset';
            const composerModelName = 'org.acme.base.BaseAsset';
            testConnector.getComposerModelName(lbModelName).should.equal(composerModelName);
        });

        it('should return the LoopBack model name if model registered but no connector specific settings', () => {
            const lbModelName = 'org_acme_base_BaseAsset';
            sandbox.stub(testConnector, 'getConnectorSpecificSettings').withArgs(lbModelName).returns(undefined);
            testConnector.getComposerModelName(lbModelName).should.equal(lbModelName);
        });

    });

    describe('#getRegistryForModel', () => {

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.modelManager = modelManager;
        });

        it('should get the AssetRegistry for a ClassDeclaration that is an asset', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            return testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.BaseAsset')
                .should.eventually.be.equal(mockAssetRegistry);
        });

        it('should get the ParticipantRegistry for a ClassDeclaration that is a particpant', () => {
            let mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            testConnector.businessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            return testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.BaseParticipant')
                .should.eventually.be.equal(mockParticipantRegistry);
        });

        it('should get the TransactionRegistry for a ClassDeclaration that is a Transaction', () => {
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            testConnector.businessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            return testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.BaseTransaction')
                .should.eventually.be.equal(mockTransactionRegistry);
        });

        it('should throw for a ClassDeclaration that does not exist', () => {
            (() => {
                testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.Thing');
            }).should.throw(TypeNotFoundException);
        });

    });

    describe('#all', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
        });

        it('should retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.resolves([{theValue : 'mockId'}]);
            mockSerializer.toJSON.onFirstCall().returns({theValue : 'myId'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.get);
                    result[0].theValue.should.equal('myId');
                });
        });
        it('should retrieve a specific Asset for a given string type property in a where clause', () => {
            mockBusinessNetworkConnection.query.resolves([{theString :'mockString'}]);
            mockBusinessNetworkConnection.buildQuery.returns({id :'mockQuery'});
            mockSerializer.toJSON.onFirstCall().returns({theString: 'myString'});
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theString:'mockString'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.query);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.query, {id :'mockQuery'});
                    result[0].theString.should.equal('myString');
                });
        });

        it('should retrieve a fully resolved specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.resolve.resolves({theValue : 'mockId', member: {theValue:'member1'}});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}, include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.resolve);
                    result.length.should.equal(1);
                    result[0].theValue.should.equal('mockId');
                    result[0].member.should.deep.equal({theValue:'member1'});
                });
        });
        it('should retrieve a fully resolved specific Asset for a given the other property in a where clause', () => {
            mockAssetRegistry.resolve.resolves({theValue: 'mockId', theString : 'mockString', member: {theValue:'member1'}});

            mockBusinessNetworkConnection.query.resolves([{theValue: 'mockId', theString :'mockString'}]);
            mockBusinessNetworkConnection.buildQuery.returns({id :'mockQuery'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theString:'mockString'}, include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.resolve);
                    sinon.assert.calledWith(mockAssetRegistry.resolve, 'mockId');
                    result.length.should.equal(1);
                    result[0].theString.should.equal('mockString');
                    result[0].member.should.deep.equal({theValue:'member1'});
                });
        });

        it('should retrieve two fully resolved specific Asset for a given the other property in a where clause', () => {
            mockAssetRegistry.resolve.onCall(0).resolves({theValue: 'mockId1', theString : 'mockString', member: {theValue:'member1'}});
            mockAssetRegistry.resolve.onCall(1).resolves({theValue: 'mockId2', theString : 'mockString', member: {theValue:'member2'}});

            mockBusinessNetworkConnection.query.resolves([{theValue: 'mockId1', theString :'mockString'},{theValue: 'mockId2', theString :'mockString'} ]);
            mockBusinessNetworkConnection.buildQuery.returns({id :'mockQuery'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theString:'mockString'}, include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledTwice(mockAssetRegistry.resolve);
                    sinon.assert.calledWith(mockAssetRegistry.resolve, 'mockId1');
                    sinon.assert.calledWith(mockAssetRegistry.resolve, 'mockId2');
                    result.length.should.equal(2);
                    result[0].theString.should.equal('mockString');
                    result[0].member.should.deep.equal({theValue:'member1'});
                    result[1].theString.should.equal('mockString');
                    result[1].member.should.deep.equal({theValue:'member2'});
                });
        });

        it('should handle an error when an invalid model name is specified', () => {
            mockAssetRegistry.get.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.WrongBaseAsset', {where:{theValue:'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(TypeNotFoundException);
        });

        it('should handle an error when trying to retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/expected test error/);
        });

        it('should handle an error when trying to retrieve a fully resolved specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.resolve.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}, include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/expected test error/);
        });

        it('should handle an error when trying to retrieve a fully resolved specific Asset for a given non-existing id in a where clause', () => {
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theInvalidValue:'mockId'}, include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Invalid property name specified in the filter/);
        });

        it('should return an empty list after an error when trying to retrieve a specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.get.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equal([]);
            });

        });

        it('should return an empty list after an error when trying to retrieve a fully resolved specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.resolve.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {where:{theValue:'mockId'}, include : 'resolve' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equal([]);
            });

        });

        it('should retrieve all Assets for a given modelname', () => {
            mockAssetRegistry.getAll.resolves([{mock : 'mockId'}, {mock2 : 'mockID2'}]);
            mockSerializer.toJSON.onFirstCall().returns({assetId : 'myId', stringValue : 'a big car'});
            mockSerializer.toJSON.onSecondCall().returns({assetId : 'anId', stringValue : 'a big fox'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                sinon.assert.calledOnce(mockAssetRegistry.getAll);
                result[0].assetId.should.equal('myId');
                result[0].stringValue.should.equal('a big car');
                result[1].assetId.should.equal('anId');
                result[1].stringValue.should.equal('a big fox');
            });
        });

        it('should retrieve all fully resolved Assets for a given modelname', () => {

            mockAssetRegistry.resolveAll.resolves([{assetId : 'mockId', stringValue : 'a big car'}, {assetId : 'mockId2', stringValue : 'a big fox'}]);
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                sinon.assert.calledOnce(mockAssetRegistry.resolveAll);
                result[0].assetId.should.equal('mockId');
                result[0].stringValue.should.equal('a big car');
                result[1].assetId.should.equal('mockId2');
                result[1].stringValue.should.equal('a big fox');
            });
        });

        it('should retrieve all fully resolved Assets for a given modelname', () => {
            mockAssetRegistry.resolveAll.rejects(new Error('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {include : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should handle errors when getting all Assets', () => {
            mockAssetRegistry.getAll.rejects(new Error('expected error'));
            return new Promise((resolve, reject) => {

                testConnector.all('org.acme.base.BaseAsset', {}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should retrieve all Participants for a given modelname', () => {
            mockParticipantRegistry.getAll.resolves([{mock : 'mockId'}, {mock2 : 'mockID2'}]);
            mockSerializer.toJSON.onFirstCall().returns({participantId : 'myId', stringValue : 'a big car'});
            mockSerializer.toJSON.onSecondCall().returns({participantId : 'anId', stringValue : 'a big fox'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseParticipant', {}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.base.BaseParticipant');
                    sinon.assert.calledOnce(mockParticipantRegistry.getAll);
                    result[0].participantId.should.equal('myId');
                    result[0].stringValue.should.equal('a big car');
                    result[1].participantId.should.equal('anId');
                    result[1].stringValue.should.equal('a big fox');
                });
        });

        it('should handle errors when getting all participants', () => {
            mockParticipantRegistry.getAll.rejects(new Error('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseParticipant', {}, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });
    });

    describe('#isResolveSet', () => {

        it('should return true if resolve is set to be true in a filter include', () => {
            let FILTER = {include : 'resolve'};
            testConnector.isResolveSet(FILTER).should.equal(true);
        });

        it('should return false if resolve is set to be true in a filter include', () => {
            let FILTER = {where : { vin : '1234' }, include : 'noresolve'};
            testConnector.isResolveSet(FILTER).should.equal(false);
        });

        it('should return false if resolve is not set in a filter include', () => {
            let FILTER = {where : { vin : '1234' } };
            testConnector.isResolveSet(FILTER).should.equal(false);
        });
    });

    describe('#getClassIdentifier', () => {

        beforeEach(() => {
            testConnector.introspector = introspector;
        });
        it('should get the classIdentifier for the given model', () => {
            testConnector.getClassIdentifier('org.acme.base.BaseAsset').should.equal('theValue');
        });

    });

    describe('#isValidId', () => {
        beforeEach(() => {
            testConnector.introspector = introspector;
        });

        it('should return true for a valid identifier field name', () => {
            testConnector.isValidId('org.acme.base.BaseAsset', 'theValue').should.equal(true);
        });
        it('should return false for an invalid identifier field name', () => {
            testConnector.isValidId('org.acme.base.BaseAsset', 'foo').should.equal(false);
        });
    });

    describe('#count', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should return count of 1 if the object exists', () => {
            mockAssetRegistry.exists.resolves(true);
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { theValue:'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .should.eventually.equal(1)
            .then(() => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
            });
        });

        it('should return count of 0 if the object exists', () => {
            mockAssetRegistry.exists.resolves(false);
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { theValue:'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .should.eventually.equal(0)
            .then(() => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
            });
        });

        it('should return count of all objects for the where condition', () => {
            mockBusinessNetworkConnection.query.resolves([{theString:'mockString'}, {theString:'mockString'}]);
            mockBusinessNetworkConnection.buildQuery.returns({id: 'mockQuery'});
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { theString:'mockString' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .should.eventually.equal(2)
            .then(() => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockBusinessNetworkConnection.query);
                sinon.assert.calledWith(mockBusinessNetworkConnection.query, {id: 'mockQuery'});
            });
        });

        it('should handle an error thrown from the build query', () => {
            mockBusinessNetworkConnection.buildQuery.throws(new Error('Test error'));
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { theString:'mockString' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .should.be.rejectedWith(/Test error/);
        });

        it('should return count of all objects', () => {
            mockAssetRegistry.getAll.resolves([{ assetId: 1 }, { assetId: 2 }]);
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', null, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .should.eventually.equal(2)
            .then(() => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
            });
        });

    });

    describe('#exists', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should return true if the object exists', () => {
            mockAssetRegistry.exists.resolves(true);
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { theValue:'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.be.true;
            });
        });

        it('should return false if the object does not exist', () => {
            mockAssetRegistry.exists.resolves(false);
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { theValue:'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.be.false;
            });
        });

        it('should handle an error from the composer registry.exists API', () => {
            mockAssetRegistry.exists.rejects(new Error('existence test error'));
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { theValue:'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/existence test error/);
        });

    });

    describe('#updateAttributes',  () => {

        let mockAssetRegistry;
        let resource;

        beforeEach(() => {
            sinon.spy(testConnector, 'getRegistryForModel');
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            resource = factory.newResource('org.acme.base', 'BaseAsset', 'theId');
            mockAssetRegistry.get.withArgs('theId').resolves(resource);
            mockSerializer.toJSON.withArgs(resource).returns({ theValue: 'theId', prop1: 'woohoo' });
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(resource);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { $class: 'org.acme.base.BaseAsset', theValue : 'updated', prop1: 'woohoo' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, resource);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(resource);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { $class: 'org.acme.base.BaseAsset', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { $class: 'org.acme.base.BaseAsset', theValue : 'updated', prop1: 'woohoo' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, resource);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(resource);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.WrongBaseAsset', 'theId', { theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(TypeNotFoundException)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(resource);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/Update error from Composer/)
            .then((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
            });
        });

        it('should handle an update error from the composer api for an asset that does not exist', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(resource);
                mockAssetRegistry.update.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                error.statusCode.should.equal(404);
                error.status.should.equal(404);
                throw error;
            })
            .should.be.rejectedWith(/does not exist/);
        });
    });

    describe('#replaceById',  () => {

        let mockAssetRegistry;
        let asset;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            sinon.spy(testConnector, 'getRegistryForModel');
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            asset = factory.newResource('org.acme.base', 'BaseAsset', 'myId');
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(asset);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { assetId: '1', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { $class: 'org.acme.base.BaseAsset', assetId: '1', theValue : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, asset);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(asset);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { $class: 'org.acme.base.BaseAsset', assetId: '1', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { $class: 'org.acme.base.BaseAsset', assetId: '1', theValue : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, asset);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(asset);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.WrongBaseAsset', '1', { assetId: '1', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(TypeNotFoundException)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(asset);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { assetId: '1', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/Update error from Composer/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
            });
        });

        it('should handle an update error from the composer api for an asset that does not exist', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(asset);
                mockAssetRegistry.update.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { assetId: '1', theValue : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                error.statusCode.should.equal(404);
                error.status.should.equal(404);
                throw error;
            })
            .should.be.rejectedWith(/does not exist/);
        });

    });

    describe('#create', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;
        let asset;
        let participant;
        let transaction;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            asset = factory.newResource('org.acme.base', 'BaseAsset', 'myId');
            participant = factory.newResource('org.acme.base', 'BaseParticipant', 'myId');
            transaction = factory.newResource('org.acme.base', 'BaseTransaction', 'myId');
        });

        it('should use the model name as the class name if not specified', () => {
            mockSerializer.fromJSON.onFirstCall().returns(asset);
            return new Promise((resolve, reject) => {

                testConnector.create('org.acme.base.BaseAsset', {
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockSerializer.fromJSON);
                    sinon.assert.calledWith(mockSerializer.fromJSON, sinon.match((data) => {
                        return data.$class === 'org.acme.base.BaseAsset';
                    }));
                });
        });

        it('should throw if the type is not an asset or a transaction', () => {
            let concept = factory.newConcept('org.acme.base', 'BaseConcept');
            mockSerializer.fromJSON.onFirstCall().returns(concept);
            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.base.BaseConcept', {
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/No registry for specified model name/);
        });

        it('should add an asset to the default asset registry', () => {
            mockSerializer.fromJSON.onFirstCall().returns(asset);
            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.base.BaseAsset', {
                    $class : 'org.acme.base.BaseAsset',
                    some : 'data'
                }, { test: 'options' }, (error, identifier) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(identifier);
                });
            })
                .then((identifier) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.add);
                    sinon.assert.calledWith(mockAssetRegistry.add, asset);
                    should.equal(identifier, undefined);
                });
        });

        it('should handle an error adding an asset to the default asset registry', () => {
            mockAssetRegistry.add.onFirstCall().rejects(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(asset);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.base.BaseAsset', {
                    $class : 'org.acme.base.BaseAsset',
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should add a participant to the default participant registry', () => {
            mockSerializer.fromJSON.onFirstCall().returns(participant);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.base.BaseParticipant', {
                    $class : 'org.acme.base.BaseParticipant',
                    some : 'data'
                }, { test: 'options' }, (error, identifier) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(identifier);
                });
            })
                .then((identifier) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.base.BaseParticipant');
                    sinon.assert.calledOnce(mockParticipantRegistry.add);
                    sinon.assert.calledWith(mockParticipantRegistry.add, participant);
                    should.equal(identifier, undefined);
                });
        });

        it('should handle an error adding a participant to the default participant registry', () => {
            mockParticipantRegistry.add.onFirstCall().rejects(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(participant);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.base.BaseParticipant', {
                    $class : 'org.acme.base.BaseParticipant',
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should submit a transaction', () => {
            mockSerializer.fromJSON.onFirstCall().returns(transaction);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Transaction', {
                    $class : 'org.acme.Transaction',
                    some : 'data'
                }, { test: 'options' }, (error, identifier) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(identifier);
                });
            })
                .then((identifier) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.submitTransaction);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.submitTransaction, transaction);
                    identifier.should.equal('myId');
                });
        });

        it('should handle an error submitting a transaction', () => {
            mockBusinessNetworkConnection.submitTransaction.onFirstCall().rejects(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(transaction);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Transaction', {
                    $class : 'org.acme.Transaction',
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });
    });

    describe('#retrieve', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;
        let asset;
        let participant;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.connected = true;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            asset = factory.newResource('org.acme.base', 'BaseAsset', 'theId');
            participant = factory.newResource('org.acme.base', 'BaseParticipant', 'theId');
        });

        it('should retrieve an asset', () => {
            mockAssetRegistry.get.resolves(asset);
            mockSerializer.toJSON.onFirstCall().returns({assetId : 'myId', stringValue : 'a big car'});

            return new Promise((resolve, reject) => {

                testConnector.retrieve('org.acme.base.BaseAsset', 'myId', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.get);
                    sinon.assert.calledWith(mockAssetRegistry.get, 'myId');
                    result.assetId.should.equal('myId');
                    result.stringValue.should.equal('a big car');
                });
        });

        it('should handle asset errors', () => {
            mockAssetRegistry.get.onFirstCall().rejects(new Error('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.retrieve('org.acme.base.BaseAsset', {
                    assetId : 'myId'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should retrieve a participant', () => {
            mockParticipantRegistry.get.resolves(participant);
            mockSerializer.toJSON.onFirstCall().returns({participantId : 'myId', stringValue : 'a big car'});

            return new Promise((resolve, reject) => {
                testConnector.retrieve('org.acme.base.BaseParticipant', 'myId', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.base.BaseParticipant');
                    sinon.assert.calledOnce(mockParticipantRegistry.get);
                    sinon.assert.calledWith(mockParticipantRegistry.get, 'myId');
                    result.participantId.should.equal('myId');
                    result.stringValue.should.equal('a big car');
                });
        });

        it('should handle participant errors', () => {
            mockParticipantRegistry.get.onFirstCall().rejects(new Error('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.retrieve('org.acme.base.BaseParticipant', {
                    participantId : 'myId'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should throw error on unsupported type', () => {
            return new Promise((resolve, reject) => {
                testConnector.retrieve('org.acme.base.BaseConcept', 'myId', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/No registry for specified model name/);
        });
    });

    describe('#update', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;
        let asset;
        let participant;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.connected = true;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            asset = factory.newResource('org.acme.base', 'BaseAsset', 'myId');
            participant = factory.newResource('org.acme.base', 'BaseParticipant', 'myId');
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should update an asset', ()=> {
            mockSerializer.fromJSON.onFirstCall().returns(asset);
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseAsset', { theValue: 'myId' }, {
                    $class : 'org.acme.base.BaseAsset',
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.update);
                    sinon.assert.calledWith(mockAssetRegistry.update, asset);
                });
        });

        it('should update a participant', ()=> {
            mockSerializer.fromJSON.onFirstCall().returns(participant);
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseParticipant', { theValue: 'myId' }, {
                    $class : 'org.acme.base.BaseParticipant',
                    some : 'data'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.base.BaseParticipant');
                    sinon.assert.calledOnce(mockParticipantRegistry.update);
                    sinon.assert.calledWith(mockParticipantRegistry.update, participant);
                });
        });

        it('should handle error if no where clause', () => {
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseConcept', { }, {
                    assetId : 'myId',
                    stringValue : 'a bigger car'
                }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/is not supported/);
        });

        it('should handle error if unsupported ID field', () => {
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseConcept', { doge: 'myId' }, {
                    assetId : 'myId',
                    stringValue : 'a bigger car'
                }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/does not match the identifier/);
        });

        it('should handle error if mismatched ID field', () => {
            mockSerializer.fromJSON.onFirstCall().returns(asset);
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseConcept', { theValue: 'doge' }, {
                    theValue : 'lolz'
                }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/does not match the identifier/);
        });

        it('should handle asset errors', () => {
            mockAssetRegistry.update.onFirstCall().rejects(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(asset);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseAsset', { theValue: 'myId' }, {
                    assetId : 'myId',
                    stringValue : 'value'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should handle participant errors', () => {
            mockParticipantRegistry.update.onFirstCall().rejects(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(participant);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseParticipant', { theValue: 'myId' }, {
                    participantId : 'myId',
                    stringValue : 'value'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should handle asset errors for assets that do not exist', () => {
            mockAssetRegistry.update.onFirstCall().rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            mockSerializer.fromJSON.onFirstCall().returns(asset);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseAsset', { theValue: 'myId' }, {
                    assetId : 'myId',
                    stringValue : 'value'
                }, { test: 'options' }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .catch((error) => {
                error.statusCode.should.equal(404);
                error.status.should.equal(404);
                throw error;
            })
            .should.be.rejectedWith(/does not exist/);
        });
    });

    describe('#destroy', () => {

        let mockAssetRegistry;
        let resourceToDelete;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            resourceToDelete = factory.newResource('org.acme.base', 'BaseAsset', 'foo');
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.resolves();
            return new Promise((resolve, reject) => {
                testConnector.destroy('org.acme.base.BaseAsset','foo' , { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });



        it('should handle an error when calling composer get for the given id', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroy('org.acme.base.BaseAsset', 'foo' , { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/get error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
            });
        });

        it('should handle an error when calling composer remove for the given id', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('removal error'));
            return new Promise((resolve, reject) => {
                testConnector.destroy('org.acme.base.BaseAsset','foo', { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/removal error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });

        it('should handle an error when calling composer remove for an asset that does not exist', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.destroy('org.acme.base.BaseAsset', 'foo' , { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
                error.statusCode.should.equal(404);
                error.status.should.equal(404);
                throw error;
            })
            .should.be.rejectedWith(/does not exist/);
        });
    });

    describe('#destroyAll', () => {

        let mockAssetRegistry;
        let resourceToDelete;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            resourceToDelete = factory.newResource('org.acme.base', 'BaseAsset', 'foo');
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.resolves();
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { theValue : 'foo' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });

        it('should handle an error when an empty where clause is specified', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', {}, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/is not supported/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
            });
        });

        it('should handle an error when an invalid Object identifier is specified', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { theWrongValue : 'foo' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/The specified filter does not match/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
            });
        });

        it('should handle an error when calling composer get for the given id', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { theValue : 'foo' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/get error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
            });
        });

        it('should handle an error when calling composer remove for the given id', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('removal error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { theValue : 'foo' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/removal error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });

        it('should handle an error when calling composer remove for an asset that does not exist', () => {
            mockAssetRegistry.get.resolves(resourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { theValue : 'foo' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
                error.statusCode.should.equal(404);
                error.status.should.equal(404);
                throw error;
            })
            .should.be.rejectedWith(/does not exist/);
        });
    });

    describe('#getAllIdentities', () => {

        let mockIdentityRegistry;
        let identity1, identity2;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockIdentityRegistry = sinon.createStubInstance(IdentityRegistry);
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            identity1 = factory.newResource('org.hyperledger.composer.system', 'Identity', 'id1');
            identity2 = factory.newResource('org.hyperledger.composer.system', 'Identity', 'id2');
            testConnector.serializer = mockSerializer;
        });

        it('should get all of the identities in the identity registry', () => {
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            mockIdentityRegistry.getAll.resolves([identity1, identity2]);
            mockSerializer.toJSON.withArgs(identity1).returns({ identityId: 'id1', $class: 'sometx' });
            mockSerializer.toJSON.withArgs(identity2).returns({ identityId: 'id2', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getAllIdentities({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockIdentityRegistry.getAll);
                    sinon.assert.calledWith(mockIdentityRegistry.getAll);
                    const result = cb.args[0][1]; // First call, second argument (error, identities)
                    result.should.deep.equal([{
                        identityId: 'id1',
                        $class: 'sometx'
                    }, {
                        identityId: 'id2',
                        $class: 'sometx'
                    }]);
                });
        });

        it('should handle an error getting all of the identities in the identity registry', () => {
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            mockIdentityRegistry.getAll.rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.getAllIdentities({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockIdentityRegistry.getAll);
                    sinon.assert.calledWith(mockIdentityRegistry.getAll);
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#getIdentityByID', () => {

        let mockIdentityRegistry;
        let identity;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockIdentityRegistry = sinon.createStubInstance(IdentityRegistry);
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'id1');
            testConnector.serializer = mockSerializer;
        });

        it('should get the specified identity in the identity registry', () => {
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            mockIdentityRegistry.get.withArgs('id1').resolves(identity);
            mockSerializer.toJSON.withArgs(identity).returns({ identityId: 'id1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getIdentityByID('id1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockIdentityRegistry.get);
                    sinon.assert.calledWith(mockIdentityRegistry.get, 'id1');
                    const result = cb.args[0][1]; // First call, second argument (error, identities)
                    result.should.deep.equal({
                        identityId: 'id1',
                        $class: 'sometx'
                    });
                });
        });

        it('should handle an error getting the specified identity in the identity registry', () => {
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            mockIdentityRegistry.get.withArgs('id1').rejects(new Error('such error'));
            mockSerializer.toJSON.withArgs(identity).returns({ identityId: 'id1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getIdentityByID('id1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockIdentityRegistry.get);
                    sinon.assert.calledWith(mockIdentityRegistry.get, 'id1');
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

        it('should return a 404 error getting the specified identity in the identity registry', () => {
            mockBusinessNetworkConnection.getIdentityRegistry.resolves(mockIdentityRegistry);
            mockIdentityRegistry.get.withArgs('id1').rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            mockSerializer.toJSON.withArgs(identity).returns({ identityId: 'id1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getIdentityByID('id1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockIdentityRegistry.get);
                    sinon.assert.calledWith(mockIdentityRegistry.get, 'id1');
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/does not exist/);
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

    });

    describe('#issueIdentity', () => {

        const participant = 'org.acme.Member#bob@email.com';
        const userID = 'bob1';
        const options = {
            issuer: true,
            affiliation: 'acmecorp'
        };
        const identity = {
            userID: userID,
            userSecret: 'suchs3cret'
        };

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
        });

        it('should issue an identity', () => {
            mockBusinessNetworkConnection.issueIdentity.withArgs(participant, userID, options).resolves(identity);
            const cb = sinon.stub();
            return testConnector.issueIdentity(participant, userID, options, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, participant, userID, options);
                    const result = cb.args[0][1]; // First call, second argument (error, identity)
                    return IdCard.fromArchive(result);
                })
                .then((card) => {
                    card.should.be.an.instanceOf(IdCard);
                    card.getUserName().should.equal(userID);
                    card.getBusinessNetworkName().should.equal('biznet');
                    card.getConnectionProfile().should.deep.equal({ type: 'hlfv1', name: 'hlfv1' });
                    card.getEnrollmentCredentials().secret.should.equal('suchs3cret');
                });
        });

        it('should handle an error thrown issuing an identity', () => {
            mockBusinessNetworkConnection.issueIdentity.withArgs(participant, userID, options).rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.issueIdentity(participant, userID, options, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.issueIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.issueIdentity, participant, userID, options);
                    const error = cb.args[0][0]; // First call, first argument (error, identity)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#bindIdentity', () => {

        const participant = 'org.acme.Member#bob@email.com';
        const certificate = [
            '----- BEGIN CERTIFICATE -----',
            Buffer.from('bob@email.com').toString('base64'),
            '----- END CERTIFICATE -----'
        ].join('\n').concat('\n');

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
        });

        it('should bind an identity', () => {
            mockBusinessNetworkConnection.bindIdentity.withArgs(participant, certificate).resolves();
            const cb = sinon.stub();
            return testConnector.bindIdentity(participant, certificate, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.bindIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.bindIdentity, participant, certificate);
                });
        });

        it('should handle an error thrown binding an identity', () => {
            mockBusinessNetworkConnection.bindIdentity.withArgs(participant, certificate).rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.bindIdentity(participant, certificate, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.bindIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.bindIdentity, participant, certificate);
                    const error = cb.args[0][0]; // First call, first argument (error, identity)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#revokeIdentity', () => {

        const userID = 'bob1';

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
        });

        it('should revoke an identity', () => {
            mockBusinessNetworkConnection.revokeIdentity.withArgs(userID).resolves();
            const cb = sinon.stub();
            return testConnector.revokeIdentity(userID, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.revokeIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.revokeIdentity, userID);
                });
        });

        it('should handle an error thrown revoking an identity', () => {
            mockBusinessNetworkConnection.revokeIdentity.withArgs(userID).rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.revokeIdentity(userID, { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.revokeIdentity);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.revokeIdentity, userID);
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#getAllHistorianRecords', () => {

        let mockHistorian;
        let transaction1, transaction2;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockHistorian = sinon.createStubInstance(Historian);
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            transaction1 = factory.newResource('org.acme.base', 'BaseTransaction', 'tx1');
            transaction2 = factory.newResource('org.acme.base', 'BaseTransaction', 'tx2');
            testConnector.serializer = mockSerializer;
        });

        it('should get all of the transactions in the transaction registry', () => {
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            mockHistorian.getAll.resolves([transaction1, transaction2]);
            mockSerializer.toJSON.withArgs(transaction1).returns({ transactionId: 'tx1', $class: 'sometx' });
            mockSerializer.toJSON.withArgs(transaction2).returns({ transactionId: 'tx2', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getAllHistorianRecords({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockHistorian.getAll);
                    sinon.assert.calledWith(mockHistorian.getAll);
                    const result = cb.args[0][1]; // First call, second argument (error, transactions)
                    result.should.deep.equal([{
                        transactionId: 'tx1',
                        $class: 'sometx'
                    }, {
                        transactionId: 'tx2',
                        $class: 'sometx'
                    }]);
                });
        });

        it('should handle an error getting all of the transactions in the transaction registry', () => {
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockHistorian);
            mockHistorian.getAll.rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.getAllHistorianRecords({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockHistorian.getAll);
                    sinon.assert.calledWith(mockHistorian.getAll);
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#executeQuery', () => {

        beforeEach(() => {
            // create mock query
            mockQueryFile = sinon.createStubInstance(QueryFile);
            mockQueryFile.getModelManager.returns(modelManager);
            let stringQuery = Query.buildQuery(mockQueryFile, 'stringQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theValue==_$param1)');
            let integerQuery = Query.buildQuery(mockQueryFile, 'integerQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theInteger==_$param1)');
            let doubleQuery = Query.buildQuery(mockQueryFile, 'doubleQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theDouble==_$param1)');
            let longQuery = Query.buildQuery(mockQueryFile, 'longQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theLong==_$param1)');
            let dateTimeQuery = Query.buildQuery(mockQueryFile, 'dateTimeQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theDateTime==_$param1)');
            let booleanQuery = Query.buildQuery(mockQueryFile, 'booleanQuery', 'test query', 'SELECT org.acme.base.BaseAsset WHERE (theBoolean==_$param1)');

            // // create mocks
            mockQueryManager = sinon.createStubInstance(QueryManager);
            mockQueryManager.getQuery.withArgs('stringQuery').returns(stringQuery);
            mockQueryManager.getQuery.withArgs('integerQuery').returns(integerQuery);
            mockQueryManager.getQuery.withArgs('doubleQuery').returns(doubleQuery);
            mockQueryManager.getQuery.withArgs('longQuery').returns(longQuery);
            mockQueryManager.getQuery.withArgs('dateTimeQuery').returns(dateTimeQuery);
            mockQueryManager.getQuery.withArgs('booleanQuery').returns(booleanQuery);

            // // setup mocks
            mockBusinessNetworkDefinition.getQueryManager.returns(mockQueryManager);

            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            testConnector.serializer = mockSerializer;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            mockBusinessNetworkConnection.getBusinessNetwork.returns(mockBusinessNetworkDefinition);
            mockBusinessNetworkConnection.query.resolves([{$class: 'org.acme.base.BaseAsset', theValue: 'my value'}]);
            mockSerializer.toJSON.returns({$class: 'org.acme.base.BaseAsset', theValue: 'my value'});
        });

        it('should call the executeQuery with an expected string result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'stringQuery', { param1: 'blue' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should call the executeQuery with an expected double result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'doubleQuery', { param1: '10.2' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should call the executeQuery with an expected long result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'longQuery', { param1: '100' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should call the executeQuery with an expected integer result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'integerQuery', { param1: '100' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should call the executeQuery with an expected dateTime result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'dateTimeQuery', { param1: '2007-04-05T14:30' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should call the executeQuery with an expected boolean result', () => {

            const cb = sinon.stub();
            return testConnector.executeQuery( 'booleanQuery', { param1: 'false' }, {test: 'options' }, cb)
                .then(( queryResult) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queryResult)
                    result.should.deep.equal([{
                        $class: 'org.acme.base.BaseAsset',
                        theValue: 'my value'
                    }]);
                });
        });

        it('should throw when executing a query that does not exist', () => {
            return new Promise((resolve, reject) => {
                testConnector.executeQuery( 'missing', { param1: 'false' }, {test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Named query missing does not exist in the business network./);
        });

    });

    describe('#discoverQueries', () => {

        beforeEach(() => {
            // create mock query file
            mockQueryFile = sinon.createStubInstance(QueryFile);
            mockQueryFile.getModelManager.returns(modelManager);

            // create real query
            const stringQuery = Query.buildQuery(mockQueryFile, 'stringQuery', 'test query',
                'SELECT org.acme.base.BaseAsset WHERE (theValue==_$param1)');

            // // create mocks
            mockQueryManager = sinon.createStubInstance(QueryManager);
            mockQueryManager.getQueries.returns([stringQuery]);

            // // setup mocks
            mockBusinessNetworkDefinition.getQueryManager.returns(mockQueryManager);

            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            testConnector.serializer = mockSerializer;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
        });

        it('should return the queries in the business network definition', () => {

            const cb = sinon.stub();
            return testConnector.discoverQueries( {test: 'options' }, cb)
                .then(( queries ) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });

                    const result = cb.args[0][1]; // First call, second argument (error, queries)
                    result.length.should.equal(1);
                    result[0].getName().should.equal('stringQuery');
                });
        });

        it('should throw when getQueries fails', () => {

            mockQueryManager.getQueries.throws();

            return new Promise((resolve, reject) => {
                testConnector.discoverQueries( {test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith();
        });

    });

    describe('#getHistorianRecordsByID', () => {

        let mockHistorian;
        let transaction;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockHistorian = sinon.createStubInstance(Historian);
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            transaction = factory.newResource('org.acme.base', 'BaseTransaction', 'tx1');
            testConnector.serializer = mockSerializer;
        });

        it('should get the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            mockHistorian.get.withArgs('tx1').resolves(transaction);
            mockSerializer.toJSON.withArgs(transaction).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getHistorianRecordByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockHistorian.get);
                    sinon.assert.calledWith(mockHistorian.get, 'tx1');
                    const result = cb.args[0][1]; // First call, second argument (error, transactions)
                    result.should.deep.equal({
                        transactionId: 'tx1',
                        $class: 'sometx'
                    });
                });
        });

        it('should handle an error getting the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            mockHistorian.get.withArgs('tx1').rejects(new Error('such error'));
            mockSerializer.toJSON.withArgs(transaction).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getHistorianRecordByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockHistorian.get);
                    sinon.assert.calledWith(mockHistorian.get, 'tx1');
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

        it('should return a 404 error getting the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getHistorian.resolves(mockHistorian);
            mockHistorian.get.withArgs('tx1').rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            mockSerializer.toJSON.withArgs(transaction).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getHistorianRecordByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockHistorian.get);
                    sinon.assert.calledWith(mockHistorian.get, 'tx1');
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/does not exist/);
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

    });

    describe('#discoverModelDefinitions', () => {

        beforeEach(() => {
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
        });

        it('should discover the model definitions from the business network with namespaces = always', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'always';
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(introspector.getClassDeclarations);
                result.should.deep.equal([{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseConcept'
                }, {
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseAsset'
                }, {
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseParticipant'
                },{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.Member'
                },{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseTransaction'
                }]);
            });
        });

        it('should discover the model definitions from the business network with namespaces = required and no duplicate names', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'required';
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(introspector.getClassDeclarations);
                result.should.deep.equal([{
                    type: 'table',
                    namespaces: false,
                    name: 'BaseConcept'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'BaseAsset'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'BaseParticipant'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'Member'
                },{
                    type: 'table',
                    namespaces: false,
                    name: 'BaseTransaction'
                }]);
            });
        });

        it('should discover the model definitions from the business network with namespaces = required and duplicate names', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'required';
            modelManager.addModelFile(`namespace org.acme.extra
            asset BaseAsset identified by assetId {
                o String assetId
            }`);
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(introspector.getClassDeclarations);
                result.should.deep.equal([{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseConcept'
                }, {
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseAsset'
                }, {
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseParticipant'
                }, {
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.Member'
                },{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.base.BaseTransaction'
                },{
                    type: 'table',
                    namespaces: true,
                    name: 'org.acme.extra.BaseAsset'
                }]);
            });
        });

        it('should discover the model definitions from the business network with namespaces = never', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'never';
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(introspector.getClassDeclarations);
                result.should.deep.equal([{
                    type: 'table',
                    namespaces: false,
                    name: 'BaseConcept'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'BaseAsset'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'BaseParticipant'
                },{
                    type: 'table',
                    namespaces: false,
                    name: 'Member'
                }, {
                    type: 'table',
                    namespaces: false,
                    name: 'BaseTransaction'
                }]);
            });
        });

        it('should throw discovering the model definitions from the business network with namespaces = never and duplicate names', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'never';
            modelManager.addModelFile(`namespace org.acme.extra
            asset BaseAsset identified by assetId {
                o String assetId
            }`);
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/are not unique/);
        });

        it('should discover model definitions from the business network with no Assets or Participants defined', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclarations').returns([]);
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(introspector.getClassDeclarations);
            });
        });

        it('should handle an error when discovering model definitions', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclarations').throws(new Error('Unit Test Error'));
                testConnector.discoverModelDefinitions({ test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Unit Test Error/);
        });

    });

    describe('#discoverSchemas', () => {

        const modelSchema = {
            acls : [],
            base : 'PersistedModel',
            description : 'An asset named BaseAsset',
            idInjection : false,
            methods : [],
            name : 'org_acme_base_BaseAsset',
            options : {
                validateUpsert : true,
                composer: {
                    type: 'asset',
                    namespace: 'org.acme.base',
                    name: 'BaseAsset',
                    fqn: 'org.acme.base.BaseAsset',
                    abstract: false
                }
            },
            plural : 'org.acme.base.BaseAsset',
            properties : {
                $class : {
                    default: 'org.acme.base.BaseAsset',
                    description: 'The class identifier for this type',
                    required: false,
                    type: 'string'
                },
                theValue : {
                    description: 'The instance identifier for this type',
                    id: true,
                    required : true,
                    type : 'string'
                },
                theString : {
                    required : false,
                    type : 'string'
                },
                theInteger : {
                    required : false,
                    type : 'number'
                },
                theDouble : {
                    required : false,
                    type : 'number'
                },
                theLong : {
                    required : false,
                    type : 'number'
                },
                theDateTime : {
                    required : false,
                    type : 'date'
                },
                theBoolean : {
                    required : false,
                    type : 'boolean'
                },
                theMember: {
                    description: 'The identifier of an instance of theMember',
                    required: false,
                    type: 'any'
                }
            },
            relations : {},
            validations : []
        };

        beforeEach(() => {
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
        });

        it('should discover the schema from the business network with the fully qualified name', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('org.acme.base.BaseAsset', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equals(modelSchema);
            });
        });

        it('should discover the schema from the business network with the short name', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseAsset', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equals(modelSchema);
            });
        });

        it('should throw discovering the schema from the business network if multiple matches for the short name', () => {
            modelManager.addModelFile(`namespace org.acme.extra
            asset BaseAsset identified by assetId {
                o String assetId
            }`);
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseAsset', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Found multiple type definitions for BaseAsset, must fully qualify type name/);
        });

        it('should throw discovering the schema from the business network if the type does not exist', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseTrumpet', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Failed to find type definition for BaseTrumpet/);
        });

        it('should handle an error when discovering the schema from the business network', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclarations').throws(new Error('Unit Test Error'));
                testConnector.discoverSchemas('org.acme.base.BaseAsset', { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Unit Test Error/);
        });

    });

});
