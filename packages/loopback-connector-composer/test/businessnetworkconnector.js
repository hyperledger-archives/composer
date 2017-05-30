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

const AssetDeclaration = require('composer-common/lib/introspect/assetdeclaration');
const AssetRegistry = require('composer-client/lib/assetregistry');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const BusinessNetworkConnectionWrapper = require('../lib/businessnetworkconnectionwrapper');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Introspector = require('composer-common').Introspector;
const LoopbackVisitor = require('composer-common').LoopbackVisitor;
const ModelManager = require('composer-common').ModelManager;
const NodeCache = require('node-cache');
const ParticipantDeclaration = require('composer-common/lib/introspect/participantdeclaration');
const ParticipantRegistry = require('composer-client/lib/participantregistry');
const Resource = require('composer-common/lib/model/resource');
const Serializer = require('composer-common').Serializer;
const TransactionDeclaration = require('composer-common/lib/introspect/transactiondeclaration');
const TransactionRegistry = require('composer-client/lib/transactionregistry');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('BusinessNetworkConnector', () => {

    const MODEL_FILE = `
    namespace org.acme.base
    concept BaseConcept {
        o String theValue
    }
    asset BaseAsset identified by theValue {
        o String theValue
    }
    participant BaseParticipant identified by theValue {
        o String theValue
    }
    transaction BaseTransaction identified by theValue {
        o String theValue
    }`;

    let settings;
    let mockBusinessNetworkConnectionWrapper;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockSerializer;
    let sandbox;
    let testConnector;
    let modelManager;
    let introspector;

    beforeEach(() => {

        settings = {
            connectionProfileName : 'MockProfileName',
            businessNetworkIdentifier : 'MockBusinessNetId',
            participantId : 'MockEnrollmentId',
            participantPwd : 'MockEnrollmentPwd'
        };

        // // create mocks
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);

        // // setup mocks
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.ping.resolves();
        mockBusinessNetworkConnection.disconnect.resolves();
        mockBusinessNetworkConnection.submitTransaction.resolves();
        mockBusinessNetworkDefinition.getIntrospector.returns(introspector);

        // // create real instances
        modelManager = new ModelManager();
        modelManager.addModelFile(MODEL_FILE);
        introspector = new Introspector(modelManager);

        sandbox = sinon.sandbox.create();

        // setup test instance
        testConnector = new BusinessNetworkConnector(settings);
        mockBusinessNetworkConnectionWrapper = sinon.createStubInstance(BusinessNetworkConnectionWrapper);
        mockBusinessNetworkConnectionWrapper.getBusinessNetwork.returns(mockBusinessNetworkDefinition);
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

        it('should throw if connectionProfileName not specified', () => {
            delete settings.connectionProfileName;
            (() => {
                testConnector = new BusinessNetworkConnector(settings);
            }).should.throw(/connectionProfileName not specified/);
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            delete settings.businessNetworkIdentifier;
            (() => {
                testConnector = new BusinessNetworkConnector(settings);
            }).should.throw(/businessNetworkIdentifier not specified/);
        });

        it('should throw if participantId not specified', () => {
            delete settings.participantId;
            (() => {
                testConnector = new BusinessNetworkConnector(settings);
            }).should.throw(/participantId not specified/);
        });

        it('should throw if participantPwd not specified', () => {
            delete settings.participantPwd;
            (() => {
                testConnector = new BusinessNetworkConnector(settings);
            }).should.throw(/participantPwd not specified/);
        });

    });

    describe('#getConnectionWrapper', () => {

        it('should return the default connection wrapper if no options specified', () => {
            testConnector.getConnectionWrapper().should.equal(mockBusinessNetworkConnectionWrapper);
        });

        it('should return the default connection wrapper if options specified but no access token', () => {
            testConnector.getConnectionWrapper({}).should.equal(mockBusinessNetworkConnectionWrapper);
        });

        it('should throw if no enrollment ID or enrollment secret specified', () => {
            (() => {
                testConnector.getConnectionWrapper({
                    accessToken: {
                        id: '999'
                    }
                });
            }).should.throw(/No enrollment ID or enrollment secret/);
        });

        it('should create a new connection wrapper if not already cached', () => {
            const connectionWrapper = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw'
            });
            connectionWrapper.should.not.equal(mockBusinessNetworkConnectionWrapper);
            connectionWrapper.should.be.an.instanceOf(BusinessNetworkConnectionWrapper);
        });

        it('should return the cached connection wrapper if already cached', () => {
            const connectionWrapper1 = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw'
            });
            const connectionWrapper2 = testConnector.getConnectionWrapper({
                accessToken: {
                    id: '999'
                },
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw'
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

        it('should throw for a ClassDeclaration that is a Transaction', () => {
            return testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.BaseTransaction')
                .should.be.rejectedWith(/No registry for specified model name/);
        });

        it('should throw for a ClassDeclaration that does not exist', () => {
            (() => {
                testConnector.getRegistryForModel(mockBusinessNetworkConnection, 'org.acme.base.Thing');
            }).should.throw(/No type org.acme.base.Thing in namespace org.acme.base/);
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
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, { test: 'options' }, (error, result) => {
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

        it('should retrieve a fully resolved specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.resolve.resolves({theValue : 'mockId'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve'}, { test: 'options' }, (error, result) => {
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
                    result[0].theValue.should.equal('mockId');
                });
        });

        it('should handle an error when an invalid model name is specified', () => {
            mockAssetRegistry.get.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.WrongBaseAsset', {'where':{'theValue':'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/No type org.acme.base.WrongBaseAsset in namespace org.acme.base/);
        });

        it('should handle an error when trying to retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, { test: 'options' }, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve'}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/expected test error/);
        });


        it('should return an empty list after an error when trying to retrieve a specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.get.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equal({});
            });

        });

        it('should return an empty list after an error when trying to retrieve a fully resolved specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.resolve.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                result.should.deep.equal({});
            });

        });

        it('should handle an error when validating the id in a where clause', () => {
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theINvalidValue':'mockId'}}, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/The specified filter does not match the identifier in the model/);
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
                testConnector.all('org.acme.base.BaseAsset', {'include' : 'resolve'}, { test: 'options' }, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'include' : 'resolve'}, { test: 'options' }, (error, result) => {
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
            let FILTER = {'include' : 'resolve'};
            testConnector.isResolveSet(FILTER).should.equal(true);
        });

        it('should return false if resolve is set to be true in a filter include', () => {
            let FILTER = {'where' : { 'vin' : '1234' }, 'include' : 'noresolve'};
            testConnector.isResolveSet(FILTER).should.equal(false);
        });

        it('should return false if resolve is not set in a filter include', () => {
            let FILTER = {'where' : { 'vin' : '1234' } };
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
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, { test: 'options' }, (error, result) => {
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
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, { test: 'options' }, (error, result) => {
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

        it('should handle an error if an invalid identifier is supplied', () => {
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theWrongValue':'mockId' }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/theWrongValue is not valid for asset org.acme.base.BaseAsset/);
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
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, { test: 'options' }, (error, result) => {
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
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, { test: 'options' }, (error, result) => {
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
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, { test: 'options' }, (error, result) => {
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
        let mockResourceToUpdate;

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
            mockResourceToUpdate = sinon.createStubInstance(Resource);
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.WrongBaseAsset', 'theId', { 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/No type org.acme.base.WrongBaseAsset in namespace org.acme.base/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { 'theValue' : 'updated' }, { test: 'options' }, (error) => {
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
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('does not exist'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { 'theValue' : 'updated' }, { test: 'options' }, (error) => {
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
        let mockResourceToUpdate;

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
            mockResourceToUpdate = sinon.createStubInstance(Resource);
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.WrongBaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/No type org.acme.base.WrongBaseAsset in namespace org.acme.base/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
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
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('does not exist'));
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, { test: 'options' }, (error) => {
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
        let mockAssetDeclaration;
        let mockParticipantDeclaration;
        let mockTransactionDeclaration;
        let mockResource;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);

        });

        it('should use the model name as the class name if not specified', () => {

            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

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
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().resolves(mockAssetRegistry);
            mockResource.getClassDeclaration.onFirstCall().returns({});

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
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

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
                    sinon.assert.calledWith(mockAssetRegistry.add, mockResource);
                    should.equal(identifier, undefined);
                });
        });

        it('should handle an error adding an asset to the default asset registry', () => {
            mockAssetRegistry.add.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().resolves(mockAssetRegistry);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

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
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseParticipant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

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
                    sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);
                    should.equal(identifier, undefined);
                });
        });

        it('should handle an error adding a participant to the default participant registry', () => {
            mockParticipantRegistry.add.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getParticipantRegistry.onFirstCall().resolves(mockParticipantRegistry);
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseParticipant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

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
            mockTransactionDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Transaction');
            mockResource.getIdentifier.returns('f7cf42d6-492f-4b7e-8b6a-2150ac5bcc5f');
            mockResource.getClassDeclaration.onFirstCall().returns(mockTransactionDeclaration);

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
                    sinon.assert.calledWith(mockBusinessNetworkConnection.submitTransaction, mockResource);
                    identifier.should.equal('f7cf42d6-492f-4b7e-8b6a-2150ac5bcc5f');
                });
        });

        it('should handle an error submitting a transaction', () => {
            mockBusinessNetworkConnection.submitTransaction.onFirstCall().rejects(new Error('expected error'));
            mockTransactionDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Transaction');
            mockResource.getClassDeclaration.onFirstCall().returns(mockTransactionDeclaration);

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

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.connected = true;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should retrieve an asset', () => {
            mockAssetRegistry.get.resolves({assetId : 'myId', stringValue : 'a big car'});
            mockSerializer.toJSON.onFirstCall().returns({assetId : 'myId', stringValue : 'a big car'});
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockModelManager.getType.returns(mockAssetDeclaration);

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
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockAssetRegistry.get.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().resolves(mockAssetRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockModelManager.getType.returns(mockAssetDeclaration);


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
            let mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockParticipantRegistry.get.resolves({participantId : 'myId', stringValue : 'a big car'});
            mockSerializer.toJSON.onFirstCall().returns({participantId : 'myId', stringValue : 'a big car'});
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockModelManager.getType.returns(mockParticipantDeclaration);

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
            let mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockParticipantRegistry.get.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getParticipantRegistry.onFirstCall().resolves(mockParticipantRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockModelManager.getType.returns(mockParticipantDeclaration);

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
            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            mockModelManager.getType.returns({});

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
        let mockResource;
        let mockAssetDeclaration;
        let mockParticipantDeclaration;
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
            mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockResource = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should update an asset', ()=> {

            return new Promise((resolve, reject) => {
                mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
                mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

                testConnector.update('org.acme.base.BaseAsset', {
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
                    sinon.assert.calledWith(mockAssetRegistry.update, mockResource);
                });
        });

        it('should update a participant', ()=> {
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseParticipant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseParticipant', {
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
                    sinon.assert.calledWith(mockParticipantRegistry.update, mockResource);
                });
        });

        it('should handle error if unsupported class', () => {
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseConcept', {
                    assetId : 'myId',
                    stringValue : 'a bigger car'
                }, { test: 'options' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/No registry for specified model name/);
        });

        it('should handle asset errors', () => {
            mockAssetRegistry.update.onFirstCall().throws(new Error('expected error'));
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseAsset', {
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
            mockParticipantRegistry.update.onFirstCall().throws(new Error('expected error'));
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseParticipant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseParticipant', {
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
            mockAssetRegistry.update.onFirstCall().throws(new Error('does not exist'));
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.base.BaseAsset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.base.BaseAsset', {
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
        let mockResourceToDelete;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockResourceToDelete = sinon.createStubInstance(Resource);
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.resolves(mockResourceToDelete);
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
            mockAssetRegistry.get.resolves(mockResourceToDelete);
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
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('does not exist'));
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
        let mockResourceToDelete;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockResourceToDelete = sinon.createStubInstance(Resource);
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.resolves();
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, { test: 'options' }, (error) => {
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

        it('should handle an error when an invalid Object identifier is specified', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theWrongValue' : 'foo' }, { test: 'options' }, (error) => {
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
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, { test: 'options' }, (error) => {
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
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('removal error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, { test: 'options' }, (error) => {
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
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, { test: 'options' }, (error) => {
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
                    result.should.deep.equal(identity);
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

    describe('#getAllTransactions', () => {

        let mockTransactionRegistry;
        let mockTransaction1, mockTransaction2;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransaction1 = sinon.createStubInstance(Resource);
            mockTransaction1.transactionId = 'tx1';
            mockTransaction2 = sinon.createStubInstance(Resource);
            mockTransaction2.transactionId = 'tx2';
            testConnector.serializer = mockSerializer;
        });

        it('should get all of the transactions in the transaction registry', () => {
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransactionRegistry.getAll.resolves([mockTransaction1, mockTransaction2]);
            mockSerializer.toJSON.withArgs(mockTransaction1).returns({ transactionId: 'tx1', $class: 'sometx' });
            mockSerializer.toJSON.withArgs(mockTransaction2).returns({ transactionId: 'tx2', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getAllTransactions({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockTransactionRegistry.getAll);
                    sinon.assert.calledWith(mockTransactionRegistry.getAll);
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
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransactionRegistry.getAll.rejects(new Error('such error'));
            const cb = sinon.stub();
            return testConnector.getAllTransactions({ test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockTransactionRegistry.getAll);
                    sinon.assert.calledWith(mockTransactionRegistry.getAll);
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

    });

    describe('#getTransactionByID', () => {

        let mockTransactionRegistry;
        let mockTransaction1;

        beforeEach(() => {
            sinon.stub(testConnector, 'ensureConnected').resolves(mockBusinessNetworkConnection);
            testConnector.connected = true;
            mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransaction1 = sinon.createStubInstance(Resource);
            mockTransaction1.transactionId = 'tx1';
            testConnector.serializer = mockSerializer;
        });

        it('should get the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransactionRegistry.get.withArgs('tx1').resolves(mockTransaction1);
            mockSerializer.toJSON.withArgs(mockTransaction1).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getTransactionByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockTransactionRegistry.get);
                    sinon.assert.calledWith(mockTransactionRegistry.get, 'tx1');
                    const result = cb.args[0][1]; // First call, second argument (error, transactions)
                    result.should.deep.equal({
                        transactionId: 'tx1',
                        $class: 'sometx'
                    });
                });
        });

        it('should handle an error getting the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransactionRegistry.get.withArgs('tx1').rejects(new Error('such error'));
            mockSerializer.toJSON.withArgs(mockTransaction1).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getTransactionByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockTransactionRegistry.get);
                    sinon.assert.calledWith(mockTransactionRegistry.get, 'tx1');
                    const error = cb.args[0][0]; // First call, first argument (error)
                    error.should.match(/such error/);
                });
        });

        it('should return a 404 error getting the specified transaction in the transaction registry', () => {
            mockBusinessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            mockTransactionRegistry.get.withArgs('tx1').rejects(new Error('the thing does not exist'));
            mockSerializer.toJSON.withArgs(mockTransaction1).returns({ transactionId: 'tx1', $class: 'sometx' });
            const cb = sinon.stub();
            return testConnector.getTransactionByID('tx1', { test: 'options' }, cb)
                .then(() => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledWith(testConnector.ensureConnected, { test: 'options' });
                    sinon.assert.calledOnce(mockTransactionRegistry.get);
                    sinon.assert.calledWith(mockTransactionRegistry.get, 'tx1');
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
                    name: 'org.acme.base.BaseConcept'
                }, {
                    type: 'table',
                    name: 'org.acme.base.BaseAsset'
                }, {
                    type: 'table',
                    name: 'org.acme.base.BaseParticipant'
                }, {
                    type: 'table',
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
                    name: 'BaseConcept'
                }, {
                    type: 'table',
                    name: 'BaseAsset'
                }, {
                    type: 'table',
                    name: 'BaseParticipant'
                }, {
                    type: 'table',
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
                    name: 'org.acme.base.BaseConcept'
                }, {
                    type: 'table',
                    name: 'org.acme.base.BaseAsset'
                }, {
                    type: 'table',
                    name: 'org.acme.base.BaseParticipant'
                }, {
                    type: 'table',
                    name: 'org.acme.base.BaseTransaction'
                }, {
                    type: 'table',
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
                    name: 'BaseConcept'
                }, {
                    type: 'table',
                    name: 'BaseAsset'
                }, {
                    type: 'table',
                    name: 'BaseParticipant'
                }, {
                    type: 'table',
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
            'acls' : [],
            'base' : 'PersistedModel',
            'description' : 'An asset named BaseAsset',
            'idInjection' : false,
            'methods' : [],
            'name' : 'org_acme_base_BaseAsset',
            'options' : {
                'validateUpsert' : true,
                'composer': {
                    'type': 'asset',
                    'namespace': 'org.acme.base',
                    'name': 'BaseAsset',
                    'fqn': 'org.acme.base.BaseAsset'
                }
            },
            'plural' : 'org.acme.base.BaseAsset',
            'properties' : {
                '$class' : {
                    'default': 'org.acme.base.BaseAsset',
                    'description': 'The class identifier for this type',
                    'required': false,
                    'type': 'string'
                },
                'theValue' : {
                    'description' : 'The instance identifier for this type',
                    'id' : true,
                    'required' : true,
                    'type' : 'string'
                }
            },
            'relations' : {},
            'validations' : []
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
