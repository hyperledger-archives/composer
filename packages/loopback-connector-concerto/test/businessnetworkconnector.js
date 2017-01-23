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

const BusinessNetworkConnection = require('@ibm/concerto-client').BusinessNetworkConnection;
const AssetRegistry = require('@ibm/concerto-client/lib/assetregistry');
const AssetDeclaration = require('@ibm/concerto-common/lib/introspect/assetdeclaration');
const Resource = require('@ibm/concerto-common/lib/model/resource');
const Serializer = require('@ibm/concerto-common').Serializer;
const BusinessNetworkDefinition = require('@ibm/concerto-common').BusinessNetworkDefinition;
const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const Introspector = require('@ibm/concerto-common').Introspector;
const ModelManager = require('@ibm/concerto-common').ModelManager;
const TransactionDeclaration = require('@ibm/concerto-common/lib/introspect/transactiondeclaration');


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
    }`;

    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockSerializer;
    let sandbox;
    let testConnector;
    let modelManager;
    let introspector;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(MODEL_FILE);
        introspector = new Introspector(modelManager);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockBusinessNetworkConnection.connect.returns(Promise.resolve(mockBusinessNetworkDefinition));
        mockBusinessNetworkConnection.disconnect.returns(Promise.resolve());
        mockBusinessNetworkConnection.submitTransaction.returns(Promise.resolve());
        mockBusinessNetworkDefinition.getIntrospector.returns(introspector);
        sandbox = sinon.sandbox.create();
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
            console.log('fish');
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
            let spy = sinon.spy(testConnector, 'connect');
            testConnector.ensureConnected();
            sinon.assert.called(spy);
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

        it('should discover the model definitions from the business network', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');
                sinon.spy(introspector, 'getClassDeclarations');
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIntrospector);
                sinon.assert.calledOnce(introspector.getClassDeclarations);
                result[0].type.should.equal('table');
                result[0].name.should.equal('org.acme.base.BaseAsset');
                result[1].type.should.equal('table');
                result[1].name.should.equal('org.acme.base.BaseParticipant');
            });
        });

        it('should discover model definitions from the business network with no Assets or Participants defined', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');
                sinon.stub(introspector, 'getClassDeclarations', () => { return [ {'test' : 'thing'}]; } );
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).then((result) => {
                sinon.assert.calledOnce(testConnector.ensureConnected);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIntrospector);
                sinon.assert.calledOnce(introspector.getClassDeclarations);
            });
        });

        it('should handle an error when discovering model definitions', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');
                sinon.stub(introspector, 'getClassDeclarations', () => { throw new Error('Unit Test Error'); } );
                testConnector.discoverModelDefinitions(null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then(() => {
                    throw new Error('should not get here');
                }) .catch((error) => {
                    error.should.match(/Unit Test Error/);
                });
        });

        it('should discover the schema from the business network', () => {
            return new Promise((resolve, reject) => {
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');
                testConnector.discoverSchemas('org.acme.base.BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    sinon.assert.calledOnce(testConnector.ensureConnected);
                    sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIntrospector);
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
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');
                sinon.stub(introspector, 'getClassDeclaration', () => { throw new Error('Unit Test Error'); } );
                testConnector.discoverSchemas('org.acme.base.BaseAsset', null, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });

            })
                .then(() => {
                    throw new Error('should not get here');
                }) .catch((error) => {
                    error.should.match(/Unit Test Error/);
                });
        });


    });

    describe('#create', () => {

        it('should use the model name as the class name if not specified', () => {

            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            let mockResource = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            mockResource.getClassDeclaration.onFirstCall().returns({});

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockAssetRegistry.add.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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

        it('should submit a transaction', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockTransactionDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Transaction');
            mockResource.getClassDeclaration.onFirstCall().returns(mockTransactionDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockTransactionDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Transaction');
            mockResource.getClassDeclaration.onFirstCall().returns(mockTransactionDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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

    describe('#retrieve', () => {
        it('should retrieve an asset', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockAssetRegistry.get.returns(Promise.resolve({assetId : 'myId', stringValue : 'a big car'}));
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockAssetDeclaration.getIdentifierFieldName.onFirstCall().returns('assetId');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);


            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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

        it('should handle errors', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockAssetRegistry.get.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
    });

    describe('#update', () => {
        it('should update an asset', ()=> {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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

        it('should blow up if unsupported class', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            mockResource.getClassDeclaration.onFirstCall().returns({});


            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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

        it('should handle errors', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockAssetRegistry.update.onFirstCall().throws('expected error');
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

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
    });

    describe('#delete', () => {
        it('should delete an asset', ()=> {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.returns(Promise.resolve(mockAssetRegistry));
            let mockResource = sinon.createStubInstance(Resource);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.fromJSON.onFirstCall().returns(mockResource);
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.onFirstCall().returns('org.acme.Asset');
            mockResource.getClassDeclaration.onFirstCall().returns(mockAssetDeclaration);

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

                testConnector.delete('org.acme.Asset', 'myId', {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.getAssetRegistry);
                    sinon.assert.calledWith(mockBusinessNetworkConnection.getAssetRegistry, 'org.acme.Asset');
                    sinon.assert.calledOnce(mockAssetRegistry.remove);
                    sinon.assert.calledWith(mockAssetRegistry.remove, 'myId');
                });
        });

        it('should handle errors', () => {
            let mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
            mockBusinessNetworkConnection.getAssetRegistry.onFirstCall().returns(Promise.resolve(mockAssetRegistry));
            mockAssetRegistry.remove.onFirstCall().throws('expected error');

            return new Promise((resolve, reject) => {
                testConnector.businessNetworkConnection = mockBusinessNetworkConnection;
                testConnector.businessNetworkDefinition = mockBusinessNetworkDefinition;
                testConnector.connected = true;
                sinon.spy(testConnector, 'ensureConnected');

                testConnector.delete('org.acme.Asset', 'myId', {}, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then((error) => {
                    console.log('should not get here');
                })
                .catch((error) => {
                    error.should.match(/expected error/);
                });
        });
    });
});
