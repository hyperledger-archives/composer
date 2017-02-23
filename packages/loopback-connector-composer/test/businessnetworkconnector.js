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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const AssetRegistry = require('composer-client/lib/assetregistry');
const ParticipantRegistry = require('composer-client/lib/participantregistry');
const TransactionRegistry = require('composer-client/lib/transactionregistry');
const AssetDeclaration = require('composer-common/lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('composer-common/lib/introspect/participantdeclaration');
const Resource = require('composer-common/lib/model/resource');
const Serializer = require('composer-common').Serializer;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const Introspector = require('composer-common').Introspector;
const ModelManager = require('composer-common').ModelManager;
const TransactionDeclaration = require('composer-common/lib/introspect/transactiondeclaration');


require('chai').should();
const sinon = require('sinon');

describe('BusinessNetworkConnector Unit Test', () => {

    const settings = {
        connectionProfileName : 'MockProfileName',
        businessNetworkIdentifier : 'MockBusinessNetId',
        participantId : 'MockEnrollmentId',
        participantPwd : 'MockEnrollmentPwd'
    };

    const MODEL_FILE = `
    namespace org.acme.base
    asset BaseAsset identified by theValue {
        o String theValue
    }
    participant BaseParticipant identified by theValue {
        o String theValue
    }
    transaction BaseTransaction identified by theValue {
        o String theValue
    }`;

    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockSerializer;
    let sandbox;
    let testConnector;
    let modelManager;
    let introspector;

    beforeEach(() => {
        // create mocks
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);

        // setup mocks
        mockBusinessNetworkConnection.connect.returns(Promise.resolve(mockBusinessNetworkDefinition));
        mockBusinessNetworkConnection.disconnect.returns(Promise.resolve());
        mockBusinessNetworkConnection.submitTransaction.returns(Promise.resolve());
        mockBusinessNetworkDefinition.getIntrospector.returns(introspector);

        // create real instances
        modelManager = new ModelManager();
        modelManager.addModelFile(MODEL_FILE);
        introspector = new Introspector(modelManager);

        sandbox = sinon.sandbox.create();

        // setup test instance
        testConnector = new BusinessNetworkConnector(settings);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should create a new instance of the connector', () => {
            testConnector.settings.should.equal(settings);
            testConnector.businessNetworkConnection.should.be.an.instanceOf(BusinessNetworkConnection);
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
            testConnector.connectionPromise = new Promise((resolve, reject) => {
                resolve('passed');
            })
                .then((result) => {
                    result.should.equal('passed');
                })
                .catch((error) => {
                    throw new Error('should not get here');
                });

            testConnector.connected = false;
            testConnector.connecting = true;
            let spy = sinon.spy(testConnector, 'connect');
            testConnector.ensureConnected();
            sinon.assert.notCalled(spy);
        });

        it('should connect to a BusinessNetwork if we aren\'t', () => {
            let testConnector = new BusinessNetworkConnector(settings);
            testConnector.connected = false;
            let stub = sinon.stub(testConnector, 'connect');
            testConnector.ensureConnected();
            sinon.assert.called(stub);
        });

        it('should handle a connection error', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                mockBusinessNetworkConnection.connect.onFirstCall().returns(Promise.reject(new Error('Unit Test Error')));
                testConnector.connect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Unit Test Error/);
                });
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
                mockBusinessNetworkConnection.disconnect.onFirstCall().returns(Promise.reject(new Error('Unit Test Error')));
                testConnector.disconnect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Unit Test Error/);
                });
        });
    });

    describe('#ping', () => {

        it('should ping the BusinessNetworkConnection successfully', () => {
            return new Promise((resolve, reject) => {
                mockBusinessNetworkConnection.ping.returns(Promise.resolve());
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
                mockBusinessNetworkConnection.ping.returns(Promise.reject('Ping error'));
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.ping((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            }).catch((error) => {
                sinon.assert.calledOnce(mockBusinessNetworkConnection.ping);
                error.should.equal('Ping error');
            });
        });
    });

    describe('#discover', () => {

        beforeEach(() => {
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
        });

        it('should discover the model definitions from the business network', () => {
            sinon.spy(introspector, 'getClassDeclarations');
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
                result[0].type.should.equal('table');
                result[0].name.should.equal('org.acme.base.BaseAsset');
                result[1].type.should.equal('table');
                result[1].name.should.equal('org.acme.base.BaseParticipant');
            });
        });

        it('should discover model definitions from the business network with no Assets or Participants defined', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclarations', () => {
                    return [{'test' : 'thing'}];
                });
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
                sinon.stub(introspector, 'getClassDeclarations', () => {
                    throw new Error('Unit Test Error');
                });
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then(() => {
                throw new Error('should not get here');
            }).catch((error) => {
                error.should.match(/Unit Test Error/);
            });
        });

        it('should discover the schema from the business network', () => {
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
                let EXPECTED = {
                    'acls' : [],
                    'base' : 'PersistedModel',
                    'description' : 'An asset named BaseAsset',
                    'idInjection' : true,
                    'methods' : [],
                    'name' : 'BaseAsset',
                    'options' : {
                        'validateUpsert' : true
                    },
                    'plural' : 'org.acme.base.BaseAsset',
                    'properties' : {
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
                result.should.deep.equals(EXPECTED);
            });
        });

        it('should handle an error when discovering the schema from the business network', () => {
            return new Promise((resolve, reject) => {
                sinon.stub(introspector, 'getClassDeclaration', () => {
                    throw new Error('Unit Test Error');
                });
                testConnector.discoverSchemas('org.acme.base.BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });

            })
            .then(() => {
                throw new Error('should not get here');
            }).catch((error) => {
                error.should.match(/Unit Test Error/);
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

            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
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
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Unable to handle resource of type/);
                });
        });

        it('should add an asset to the default asset registry', () => {
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
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
            mockAssetRegistry.add.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
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
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });

        it('should add a participant to the default participant registry', () => {
            mockBusinessNetworkConnection.getParticipantRegistry.returns(Promise.resolve(mockParticipantRegistry));
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
            mockParticipantRegistry.add.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getParticipantRegistry.onFirstCall().returns(Promise.resolve(mockParticipantRegistry));
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
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
            mockBusinessNetworkConnection.submitTransaction.onFirstCall().returns(Promise.reject(new Error('expected error')));
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
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });
    });





    describe('#getRegistryForModel', () => {

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.modelManager = modelManager;
        });

        it('should get the AssetRegistry for a ClassDeclaration that is an asset', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
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
            testConnector.businessNetworkConnection.getParticipantRegistry.returns(Promise.resolve(mockParticipantRegistry));
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
            testConnector.businessNetworkConnection.getTransactionRegistry.returns(Promise.resolve(mockTransactionRegistry));
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
            })
            .then((result) => {
                console.log('ERROR: Should not get here');
            })
            .catch((error) => {
                error.should.match(/Error: No type org.acme.base.Thing in namespace org.acme.base/);
            });
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
            })
            .then((result) => {
                console.log('ERROR: Should not get here');
            })
            .catch((error) => {
                error.should.match(/Error: No registry for specified model name/);
            });
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

    describe('#count and #exists', () => {

        let mockAssetRegistry;

        beforeEach(() => {
            testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
            testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
            testConnector.modelManager = modelManager;
            testConnector.introspector = introspector;
            testConnector.connected = true;
            sinon.spy(testConnector, 'ensureConnected');
            mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
        });

        it('should return 1 if the object exists', () => {
            mockAssetRegistry.exists.returns(Promise.resolve(true));
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(1);
            });
        });
        it('should return 0 if the object does not exist', () => {
            mockAssetRegistry.exists.returns(Promise.resolve(false));
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(0);
            });
        });
        it('should handle an error from the composer registry.exists API', () => {
            mockAssetRegistry.exists.returns(Promise.reject('existence test error'));
            return new Promise((resolve, reject) => {
                testConnector.exists('org.acme.base.BaseAsset', { 'theValue':'mockId' }, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                throw new Error('test error');
            })
            .catch((error) => {
                error.should.equal('existence test error');
            });
        });

        it('should return count of 1 if the object exists', () => {
            mockAssetRegistry.exists.returns(Promise.resolve(true));
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(1);
            });
        });

        it('should return count of 0 if the object exists', () => {
            mockAssetRegistry.exists.returns(Promise.resolve(false));
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                result.should.equal(0);
            });
        });

        it('should handle an error if an invalid identifier is supplied', () => {
            return new Promise((resolve, reject) => {
                testConnector.count('org.acme.base.BaseAsset', { 'theWrongValue':'mockId' }, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                throw new Error('test error');
            })
            .catch((error) => {
                error.should.equal('ERROR: theWrongValue is not valid for asset org.acme.base.BaseAsset');
            });
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
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            testConnector.businessNetworkConnection.getParticipantRegistry.returns(Promise.resolve(mockParticipantRegistry));
        });

        it('should retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.returns(Promise.resolve([{theValue : 'mockId'}]));
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
            mockAssetRegistry.resolve.returns(Promise.resolve({theValue : 'mockId'}));

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
            mockAssetRegistry.get.returns(Promise.reject('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.WrongBaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/Error: No type org.acme.base.WrongBaseAsset in namespace org.acme.base/);
            });
        });

        it('should handle an error when trying to retrieve a specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.get.returns(Promise.reject('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/expected test error/);
            });
        });

        it('should handle an error when trying to retrieve a fully resolved specific Asset for a given id in a where clause', () => {
            mockAssetRegistry.resolve.returns(Promise.reject('expected test error'));
            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'where':{'theValue':'mockId'}, 'include' : 'resolve'}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/expected test error/);
            });
        });


        it('should return an empty list after an error when trying to retrieve a specific Asset by id if the error just indicates that the asset does not exist', () => {
            mockAssetRegistry.get.returns(Promise.reject('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
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
            mockAssetRegistry.resolve.returns(Promise.reject('Error: Object with ID \'1112\' in collection with ID \'Asset:org.acme.vehicle.auction.Vehicle\' does not exist'));
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
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/ERROR: the specified filter does not match the identifier in the model/);
            });
        });


        it('should retrieve all Assets for a given modelname', () => {
            mockAssetRegistry.getAll.returns(Promise.resolve([{mock : 'mockId'}, {mock2 : 'mockID2'}]));
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
            mockAssetRegistry.resolveAll.returns(Promise.resolve([{assetId : 'mockId', stringValue : 'a big car'}, {assetId : 'mockId2', stringValue : 'a big fox'}]));
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
            mockAssetRegistry.resolveAll.returns(Promise.reject('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseAsset', {'include' : 'resolve'}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/expected error/);
            });
        });

        it('should handle errors when getting all Assets', () => {
            mockAssetRegistry.getAll.returns(Promise.reject('expected error'));
            return new Promise((resolve, reject) => {

                testConnector.all('org.acme.base.BaseAsset', {}, {}, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/expected error/);
            });
        });

        it('should retrieve all Participants for a given modelname', () => {
            mockParticipantRegistry.getAll.returns(Promise.resolve([{mock : 'mockId'}, {mock2 : 'mockID2'}]));
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
            mockParticipantRegistry.getAll.returns(Promise.reject('expected error'));

            return new Promise((resolve, reject) => {
                testConnector.all('org.acme.base.BaseParticipant', {}, {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/expected error/);
            });
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
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            mockResourceToUpdate = sinon.createStubInstance(Resource);
        });

        it('should update the attributes for the given object id on the blockchain', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.returns(Promise.resolve());
                testConnector.updateAttributes('org.acme.base.BaseAsset', { 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
            });
        });

        it('should handle the error when an invalid model is specified', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.returns(Promise.resolve());
                testConnector.updateAttributes('org.acme.base.WrongBaseAsset', { 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                error.should.match(/Error: No type org.acme.base.WrongBaseAsset in namespace org.acme.base/);

            });
        });

        it('should handle an update error from the composer api', () => {
            return new Promise((resolve, reject) => {
                mockSerializer.fromJSON.returns(mockResourceToUpdate);
                mockAssetRegistry.update.returns(Promise.reject('Update error from Composer'));
                testConnector.updateAttributes('org.acme.base.BaseAsset', { 'theValue' : 'updated' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(testConnector.getRegistryForModel);
                sinon.assert.calledOnce(mockAssetRegistry.update);
                error.should.match(/Update error from Composer/);

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
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            mockResourceToDelete = sinon.createStubInstance(Resource);
        });

        it('should delete the object for the given id from the blockchain', () => {
            mockAssetRegistry.get.returns(Promise.resolve(mockResourceToDelete));
            mockAssetRegistry.remove.returns(Promise.resolve());
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
            mockAssetRegistry.get.returns(Promise.reject('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theWrongValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw Error('Test Error');
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                error.should.match(/ERROR: the specified filter does not match the identifier in the model/);
            });
        });

        it('should handle an error when calling composer get for the given id', () => {
            mockAssetRegistry.get.returns(Promise.reject('get error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw Error('Test Error');
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockAssetRegistry.get);
                error.should.match(/get error/);
            });
        });

        it('should handle an error when calling composer remove for the given id', () => {
            mockAssetRegistry.get.returns(Promise.resolve(mockResourceToDelete));
            mockAssetRegistry.remove.returns(Promise.reject('removal error'));
            return new Promise((resolve, reject) => {
                testConnector.destroyAll('org.acme.base.BaseAsset', { 'theValue' : 'foo' }, {}, (error) => {
                    if(error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
            .then(() => {
                throw Error('Test Error');
            })
            .catch((error) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockAssetRegistry.get);
                sinon.assert.calledOnce(mockAssetRegistry.remove);
                error.should.match(/removal error/);
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
            testConnector.businessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
        });

        it('should retrieve an asset', () => {
            mockAssetRegistry.get.returns(Promise.resolve({assetId : 'myId', stringValue : 'a big car'}));
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));

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
            mockAssetRegistry.get.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));

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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });

        it('should retrieve a participant', () => {
            let mockParticipantRegistry = sinon.createStubInstance(ParticipantRegistry);
            mockParticipantRegistry.get.returns(Promise.resolve({participantId : 'myId', stringValue : 'a big car'}));
            mockBusinessNetworkConnection.getParticipantRegistry.returns(Promise.resolve(mockParticipantRegistry));

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
            mockParticipantRegistry.get.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getParticipantRegistry.onFirstCall().returns(Promise.resolve(mockParticipantRegistry));

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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Unable to handle resource of type/);
                });
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
            mockBusinessNetworkConnection.getParticipantRegistry.returns(Promise.resolve(mockParticipantRegistry));
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Unable to handle resource of type/);
                });
        });

        it('should handle asset errors', () => {
            mockAssetRegistry.update.onFirstCall().throws('expected error');
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });

        it('should handle participant errors', () => {
            mockParticipantRegistry.update.onFirstCall().throws('expected error');
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
            })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });
    });
});
