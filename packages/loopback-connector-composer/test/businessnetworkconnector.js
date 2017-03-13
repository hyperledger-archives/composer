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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Introspector = require('composer-common').Introspector;
const LoopbackVisitor = require('composer-common').LoopbackVisitor;
const ModelManager = require('composer-common').ModelManager;
const ParticipantDeclaration = require('composer-common/lib/introspect/participantdeclaration');
const ParticipantRegistry = require('composer-client/lib/participantregistry');
const Resource = require('composer-common/lib/model/resource');
const Serializer = require('composer-common').Serializer;
const TransactionDeclaration = require('composer-common/lib/introspect/transactiondeclaration');
const TransactionRegistry = require('composer-client/lib/transactionregistry');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('BusinessNetworkConnector Unit Test', () => {

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

        // create mocks
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);

        // setup mocks
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkConnection.disconnect.resolves();
        mockBusinessNetworkConnection.submitTransaction.resolves();
        mockBusinessNetworkDefinition.getIntrospector.returns(introspector);

        // create real instances
        modelManager = new ModelManager();
        modelManager.addModelFile(MODEL_FILE);
        introspector = new Introspector(modelManager);

        sandbox = sinon.sandbox.create();

        // setup test instance
        testConnector = new BusinessNetworkConnector(settings);

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
            let actualSettings = Object.assign({}, settings, {
                namespaces: 'always'
            });
            testConnector.settings.should.deep.equal(actualSettings);
            testConnector.businessNetworkConnection.should.be.an.instanceOf(BusinessNetworkConnection);
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

    describe('#connect', () => {

        it('should connect to a BusinessNetwork', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.connect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.connect,
                        settings.connectionProfileName,
                        settings.businessNetworkIdentifier,
                        settings.participantId,
                        settings.participantPwd);
                    testConnector.businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                    testConnector.connected.should.equal(true);
                    testConnector.connecting.should.equal(false);
                });
        });

        it('should handle not having a callback parm after connecting to a BusinessNetwork', () => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.connect();
            sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
            sinon.assert.calledWith(mockBusinessNetworkConnection.connect,
                settings.connectionProfileName,
                settings.businessNetworkIdentifier,
                settings.participantId,
                settings.participantPwd);
        });

        it('should ensure we\'re connected to a BusinessNetwork if we are', () => {
            let testConnector = new BusinessNetworkConnector(settings);
            testConnector.connected = true;
            let spy = sinon.spy(testConnector, 'connect');
            testConnector.ensureConnected();
            sinon.assert.notCalled(spy);
        });

        it('should ensure we\'re connected to a BusinessNetwork if we are connecting', () => {
            let testConnector = new BusinessNetworkConnector(settings);
            testConnector.connectionPromise = Promise.resolve();
            testConnector.connected = false;
            testConnector.connecting = true;
            let spy = sinon.spy(testConnector, 'connect');
            testConnector.ensureConnected();
            sinon.assert.notCalled(spy);
        });

        it('should connect to a BusinessNetwork if we aren\'t', () => {
            let testConnector = new BusinessNetworkConnector(settings);
            testConnector.connected = false;
            let stub = sinon.stub(testConnector, 'connectInternal');
            testConnector.ensureConnected();
            sinon.assert.called(stub);
        });

        it('should handle a connection error', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                mockBusinessNetworkConnection.connect.onFirstCall().rejects(new Error('Unit Test Error'));
                testConnector.connect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/Unit Test Error/);
        });

        it('should handle a callback error without a callback', () => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            mockBusinessNetworkConnection.connect.onFirstCall().rejects(new Error('Unit Test Error'));
            testConnector.connect();
        });

    });

    describe('#disconnect', () => {

        it('should disconnect from a Business Network', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.disconnect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.disconnect);
                    testConnector.connected.should.equal(false);
                    testConnector.connecting.should.equal(false);
                });
        });

        it('should handle a disconnection error', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                mockBusinessNetworkConnection.disconnect.onFirstCall().rejects(new Error('Unit Test Error'));
                testConnector.disconnect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/Unit Test Error/);
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
            sandbox.stub(testConnector, 'getConnectorSpecificSettings').withArgs(lbModelName).returns({});
            testConnector.getComposerModelName(lbModelName).should.equal(lbModelName);
        });

    });

    describe('#ping', () => {

        it('should ping the BusinessNetworkConnection successfully', () => {
            return new Promise((resolve, reject) => {
                mockBusinessNetworkConnection.ping.resolves();
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.ping((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).then(() => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
            });
        });

        it('should propogate a ping error from the BusinessNetworkConnection', () => {
            return new Promise((resolve, reject) => {
                mockBusinessNetworkConnection.ping.rejects(new Error('Ping error'));
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.ping((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/Ping error/)
            .then(() => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
            });
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
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
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
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {

                testConnector.create('org.acme.Asset', {
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockSerializer.fromJSON);
                    sinon.assert.calledWith(mockSerializer.fromJSON, sinon.match((data) => {
                        return data.$class === 'org.acme.Asset';
                    }));
                });
        });

        it('should throw if the type is not an asset or a transaction', () => {
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().resolves(mockAssetRegistry);
            mockResource.getClassDeclaration.onFirstCall().returns({});

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Asset', {
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/Unable to handle resource of type/);
        });

        it('should add an asset to the default asset registry', () => {
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Asset', {
                    $class : 'org.acme.Asset',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.Asset');
                    sinon.assert.calledOnce(mockAssetRegistry.add);
                    sinon.assert.calledWith(mockAssetRegistry.add, mockResource);
                });
        });

        it('should handle an error adding an asset to the default asset registry', () => {
            mockAssetRegistry.add.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().resolves(mockAssetRegistry);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Asset', {
                    $class : 'org.acme.Asset',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should add a participant to the default participant registry', () => {
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Participant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.participant', {
                    $class : 'org.acme.Participant',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.Participant');
                    sinon.assert.calledOnce(mockParticipantRegistry.add);
                    sinon.assert.calledWith(mockParticipantRegistry.add, mockResource);
                });
        });

        it('should handle an error adding a participant to the default participant registry', () => {
            mockParticipantRegistry.add.onFirstCall().throws(new Error('expected error'));
            mockBusinessNetworkConnection.getParticipantRegistry.onFirstCall().resolves(mockParticipantRegistry);
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Participant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Participant', {
                    $class : 'org.acme.Participant',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });

        it('should submit a transaction', () => {
            mockTransactionDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Transaction');
            mockResource.getClassDeclaration.onFirstCall().returns(mockTransactionDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.create('org.acme.Transaction', {
                    $class : 'org.acme.Transaction',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.submitTransaction);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.submitTransaction, mockResource);
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
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
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
            return new Promise((resolve, reject) => {
                testConnector.getRegistryForModel('org.acme.base.BaseAsset', (error, result) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(mockAssetRegistry);
            });
        });

        it('should get the ParticipantRegistry for a ClassDeclaration that is a particpant', () => {
            let mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            testConnector.businessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
            return new Promise((resolve, reject) => {
                testConnector.getRegistryForModel('org.acme.base.BaseParticipant', (error, result) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(mockParticipantRegistry);
            });

        });

        it('should get the TransactionRegistry for a ClassDeclaration that is a Transaction', () => {
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            testConnector.businessNetworkConnection.getTransactionRegistry.resolves(mockTransactionRegistry);
            return new Promise((resolve, reject) => {
                testConnector.getRegistryForModel('org.acme.base.BaseTransaction', (error, result) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(mockTransactionRegistry);
            });

        });

        it('should throw an error trying to get a Registry for an invalid ClassDeclaration', () => {
            return new Promise((resolve, reject) => {
                testConnector.getRegistryForModel('org.acme.base.Thing', (error, result) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/No type org.acme.base.Thing in namespace org.acme.base/);
        });

        it('should throw an error if the class declaration does not have a registry type', () => {
            return new Promise((resolve, reject) => {
                let stub = sinon.stub(modelManager, 'getType');
                stub.returns({});
                testConnector.getRegistryForModel('org.acme.base.Thing', (error, result) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/No registry for specified model name/);
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

    describe('#exists', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should return true if the object exists', () => {
            mockAssetRegistry.exists.resolves(true);
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.be.true;
            });
        });

        it('should return false if the object does not exist', () => {
            mockAssetRegistry.exists.resolves(false);
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.be.false;
            });
        });

        it('should handle an error from the composer registry.exists API', () => {
            mockAssetRegistry.exists.rejects(new Error('existence test error'));
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/existence test error/);
        });

    });

    describe('#count', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should return count of 1 if the object exists', () => {
            mockAssetRegistry.exists.resolves(true);
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.eventually.equal(1);
        });

        it('should return count of 0 if the object exists', () => {
            mockAssetRegistry.exists.resolves(false);
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.eventually.equal(0);
        });

        it('should handle an error if an invalid identifier is supplied', () => {
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theWrongValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/theWrongValue is not valid for asset org.acme.base.BaseAsset/);
        });


    });

    describe('#all', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            testConnector.businessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);
        });

        it('should retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.resolves([{theValue : 'mockId'}]);
            mockSerializer.toJSON.onFirstCall().returns({theValue : 'myId'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.get);
                    result[0].theValue.should.equal('myId');
                });
        });

        it('should retrieve a fully resolved specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.resolve.resolves({theValue : 'mockId'});

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve'}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.base.BaseAsset');
                    sinon.assert.calledOnce(mockAssetRegistry.resolve);
                    result[0].theValue.should.equal('mockId');
                });
        });

        it('should handle an error when an invalid model name is specified', () => {
            mockAssetRegistry.get.rejects(new Error('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.WrongBaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve'}, {}, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.deep.equal({});
            });

        });

        it('should return an empty list after an error when trying to retrieve a fully resolved specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.resolve.rejects(new Error('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.deep.equal({});
            });

        });

        it('should handle an error when validating the id in a where clause', () => {
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theINvalidValue':'mockId'}}, {}, (error, result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'include' : 'resolve'}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
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
                testConnector.all('org.acme.base.BaseAsset', {'include' : 'resolve'}, {}, (error, result) => {
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

                testConnector.all('org.acme.base.BaseAsset', {}, {}, (error, result) => {
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
                testConnector.all('org.acme.base.BaseParticipant', {}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
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
                testConnector.all('org.acme.base.BaseParticipant', {}, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });
    });

    describe('#updateAttributes',  () => {

        let mockAssetRegistry;
        let mockResourceToUpdate;

        beforeEach(() => {
            sinon.spy(testConnector, 'ensureConnected');
            sinon.spy(testConnector, 'getRegistryForModel');
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockResourceToUpdate = sinon.createStubInstance(Resource);
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { 'theValue' : 'updated' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.updateAttributes('org.acme.base.WrongBaseAsset', 'theId', { 'theValue' : 'updated' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/No type org.acme.base.WrongBaseAsset in namespace org.acme.base/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', 'theId', { 'theValue' : 'updated' }, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/Update error from Composer/)
            .then((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
            });
        });
    });

    describe('#replaceById',  () => {

        let mockAssetRegistry;
        let mockResourceToUpdate;

        beforeEach(() => {
            sinon.spy(testConnector, 'ensureConnected');
            sinon.spy(testConnector, 'getRegistryForModel');
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockResourceToUpdate = sinon.createStubInstance(Resource);
        });

        it('should update the attributes for the given object id on the blockchain with no $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should update the attributes for the given object id on the blockchain with a $class attribute', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledWith(mockSerializer.fromJSON, { '$class': 'org.acme.base.BaseAsset', 'assetId': '1', 'theValue' : 'updated' });
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                sinon.assert.calledWith(mockAssetRegistry.update, mockResourceToUpdate);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.resolves();
                testConnector.replaceById('org.acme.base.WrongBaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/No type org.acme.base.WrongBaseAsset in namespace org.acme.base/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.rejects(new Error('Update error from Composer'));
                testConnector.replaceById('org.acme.base.BaseAsset', '1', { 'assetId': '1', 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/Update error from Composer/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
            });
        });
    });

    describe('#destroyAll', () => {

        let mockAssetRegistry;
        let mockResourceToDelete;

        beforeEach(() => {
            sinon.spy(testConnector, 'ensureConnected');
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            testConnector.connected = true;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
            mockResourceToDelete = sinon.createStubInstance(Resource);
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.resolves();
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });

        it('should handle an error when an invalid Object identifier is specified', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theWrongValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/The specified filter does not match/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
            });
        });

        it('should handle an error when calling composer get for the given id', () => {
            mockAssetRegistry.get.rejects(new Error('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/get error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockAssetRegistry.get);
            });
        });

        it('should handle an error when calling composer remove for the given id', () => {
            mockAssetRegistry.get.resolves(mockResourceToDelete);
            mockAssetRegistry.remove.rejects(new Error('removal error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .should.be.rejectedWith(/removal error/)
            .then(() => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
            });
        });
    });



    describe('#retrieve', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            sinon.spy(testConnector, 'ensureConnected');
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.connected = true;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.serializer = mockSerializer;
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);
        });

        it('should retrieve an asset', () => {
            mockAssetRegistry.get.resolves({assetId : 'myId', stringValue : 'a big car'});
            mockBusinessNetworkConnection.getAssetRegistry.resolves(mockAssetRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockModelManager.getType.returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {

                testConnector.retrieve('org.acme.Asset', 'myId', {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.Asset');
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
                testConnector.retrieve('org.acme.Asset', {
                    assetId : 'myId'
                }, {}, (error) => {
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
            mockBusinessNetworkConnection.getParticipantRegistry.resolves(mockParticipantRegistry);

            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockModelManager.getType.returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.retrieve('org.acme.Participant', 'myId', {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.Participant');
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
                testConnector.retrieve('org.acme.Participant', {
                    participantId : 'myId'
                }, {}, (error) => {
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
                testConnector.retrieve('org.acme.Asset', 'myId', {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Unable to handle resource of type/);
        });
    });



    describe('#update', () => {

        let mockAssetRegistry;
        let mockParticipantRegistry;
        let mockResource;
        let mockAssetDeclaration;
        let mockParticipantDeclaration;
        beforeEach(() => {
            sinon.spy(testConnector, 'ensureConnected');
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
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
                mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
                mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

                testConnector.update('org.acme.Asset', {
                    $class : 'org.acme.Asset',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.Asset');
                    sinon.assert.calledOnce(mockAssetRegistry.update);
                    sinon.assert.calledWith(mockAssetRegistry.update, mockResource);
                });
        });

        it('should update a participant', ()=> {
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Participant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.Participant', {
                    $class : 'org.acme.Participant',
                    some : 'data'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getParticipantRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getParticipantRegistry, 'org.acme.Participant');
                    sinon.assert.calledOnce(mockParticipantRegistry.update);
                    sinon.assert.calledWith(mockParticipantRegistry.update, mockResource);
                });
        });

        it('should handle error if unsupported class', () => {
            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.Asset', {
                    assetId : 'myId',
                    stringValue : 'a bigger car'
                }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Unable to handle resource of type/);
        });

        it('should handle asset errors', () => {
            mockAssetRegistry.update.onFirstCall().throws(new Error('expected error'));
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.Asset', {
                    assetId : 'myId',
                    stringValue : 'value'
                }, {}, (error) => {
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
            mockParticipantDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Participant');
            mockResource.getClassDeclaration.onFirstCall().returns(mockParticipantDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.update('org.acme.Participant', {
                    participantId : 'myId',
                    stringValue : 'value'
                }, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).should.be.rejectedWith(/expected error/);
        });
    });

    describe('#discoverModelDefinitions', () => {

        beforeEach(() => {
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
        });

        it('should discover the model definitions from the business network with namespaces = always', () => {
            sinon.spy(introspector, 'getClassDeclarations');
            testConnector.settings.namespaces = 'always';
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
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
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
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
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
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
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
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
                testConnector.discoverModelDefinitions(null, (error, result) => {
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
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(introspector.getClassDeclarations);
            });
        });

        it('should handle an error when discovering model definitions', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclarations').throws(new Error('Unit Test Error'));
                testConnector.discoverModelDefinitions(null, (error, result) => {
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
            sinon.spy(testConnector, 'ensureConnected');
        });

        it('should discover the schema from the business network with the fully qualified name', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('org.acme.base.BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                result.should.deep.equals(modelSchema);
            });
        });

        it('should discover the schema from the business network with the short name', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                result.should.deep.equals(modelSchema);
            });
        });

        it('should throw discovering the schema from the business network if multiple matches for the short name', () => {
            modelManager.addModelFile(`namespace org.acme.extra
            asset BaseAsset identified by assetId {
                o String assetId
            }`);
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Found multiple type definitions for BaseAsset, must fully qualify type name/);
        });

        it('should throw discovering the schema from the business network if the type does not exist', () => {
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('BaseTrumpet', null, (error, result) => {
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
                testConnector.discoverSchemas('org.acme.base.BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).should.be.rejectedWith(/Unit Test Error/);
        });

    });

});
