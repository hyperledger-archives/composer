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

const fs = require('fs');
const path = require('path');
const BusinessNetworkDefinition = require('@ibm/concerto-admin').BusinessNetworkDefinition;
const BusinessNetworkConnector = require('../lib/businessnetworkconnector');
const TestUtil = require('./testutil');

const sinon = require('sinon');
require('chai').should();

describe('BusinessNetworkConnector Integration Test', () => {

    const badSettings = {
        connectionProfileName : 'MockProfileName',
        businessNetworkIdentifier : 'MockBusinessNetId',
        participantId : 'MockEnrollmentId',
        participantPwd : 'MockEnrollmentPwd'
    };

    // use the settings defined in the TestUtils module
    const goodSettings = {
        connectionProfileName : 'concerto-systests',
        businessNetworkIdentifier : 'loopback-integration',
        participantId : 'WebAppAdmin',
        participantPwd : 'DJY27pEnl16d'
    };

    let businessNetworkDefinition;
    let admin;
    let testConnector;

    before(() => {
        const modelFiles = [
            fs.readFileSync(path.resolve(__dirname, 'data/transactions.cto'), 'utf8')
        ];

        const scriptFiles = [
            {
                identifier : 'transactions.js',
                contents : fs.readFileSync(path.resolve(__dirname, 'data/transactions.js'), 'utf8')
            },
        ];

        businessNetworkDefinition = new BusinessNetworkDefinition('loopback-integration@0.0.1', 'The network for the loopback integration tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile);
        });

        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });

        admin = TestUtil.getAdmin();
        return admin.deploy(businessNetworkDefinition);
    });

    describe('Connect integration test', () => {

        it('should not connect to a local business network using bad connection profile name', () => {
            testConnector = new BusinessNetworkConnector(badSettings);
            return new Promise((resolve, reject) => {
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
                    error.should.match(/Failed to load connection profile MockProfileName/);
                });
        });

        it('should connect to a local business network using good settings', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            return new Promise((resolve, reject) => {
                testConnector.connect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    testConnector.connected.should.equal(true);
                    testConnector.connecting.should.equal(false);
                    testConnector.businessNetworkDefinition.identifier.should.equal('loopback-integration@0.0.1');
                });
        });

        it('should ensure we are connected to a local business network using good settings', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let spy = sinon.spy(testConnector, 'connect');
            testConnector.ensureConnected().then(() => {
                sinon.assert.calledOnce(spy);
                testConnector.connected.should.equal(true);
                testConnector.connecting.should.equal(false);
            });
        });

    });

    describe('Disconnect integration test', () => {
        it('should connect then disconnect from a local business network', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            return new Promise((resolve, reject) => {
                testConnector.connect((error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
                testConnector.disconnect((err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            })
                .then(() => {
                    // verify
                    testConnector.connected.should.equal(false);
                    testConnector.connecting.should.equal(false);
                });
        });

    });

    describe('Discover integration test', () => {

        it('should connect and discover models ', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.discoverModelDefinitions(options, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    result.length.should.equal(5);
                    result[0].should.deep.equal({'type' : 'table', 'name' : 'systest.transactions.SimpleStringAsset'});
                    result[1].should.deep.equal({'type' : 'table', 'name' : 'systest.transactions.SimpleIntegerAsset'});
                    result[2].should.deep.equal({
                        'type' : 'table',
                        'name' : 'systest.transactions.SimpleRelationshipAsset'
                    });
                    result[3].should.deep.equal({
                        'type' : 'table',
                        'name' : 'systest.transactions.SimpleRelationshipsAsset'
                    });
                    result[4].should.deep.equal({
                        'type' : 'table',
                        'name' : 'systest.transactions.SimpleConceptAsset'
                    });

                });
        });


        it('should discover schemas', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('systest.transactions.SimpleStringAsset', options, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
            .then((result) => {
                let EXPECTED_SCHEMA = {
                    'acls': [],
                    'base': 'PersistedModel',
                    'description': 'An asset named SimpleStringAsset',
                    'idInjection': true,
                    'methods': [],
                    'name': 'SimpleStringAsset',
                    'options': {
                        'validateUpsert': true
                    },
                    'plural': 'systest.transactions.SimpleStringAsset',
                    'properties': {
                        'assetId': {
                            'description': 'The instance identifier for this type',
                            'id': true,
                            'required': true,
                            'type': 'string'
                        },
                        'stringValue': {
                            'required': true,
                            'type': 'string'
                        }
                    },
                    'relations': {},
                    'validations': []
                };
                result.should.deep.equal(EXPECTED_SCHEMA);
            });
        });

        it('should discover schemas and create model with concept', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.discoverSchemas('systest.transactions.SimpleConceptAsset', options, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            })
                .then((result) => {
                    let EXPECTED_SCHEMA = {
                        'acls': [],
                        'base': 'PersistedModel',
                        'description': 'An asset named SimpleConceptAsset',
                        'idInjection': true,
                        'methods': [],
                        'name': 'SimpleConceptAsset',
                        'options': {
                            'validateUpsert': true
                        },
                        'plural': 'systest.transactions.SimpleConceptAsset',
                        'properties': {
                            'assetId': {
                                'description': 'The instance identifier for this type',
                                'id': true,
                                'required': true,
                                'type': 'string'
                            },
                            'conceptValue': {
                                'description': 'An instance of systest.transactions.SimpleConcept',
                                'properties': {
                                    'conceptField': {
                                        'required': true,
                                        'type': 'string'
                                    },
                                    'conceptId': {
                                        'required': true,
                                        'type': 'string'
                                    }
                                },
                                'required': true
                            }
                        },
                        'relations': {},
                        'validations': []
                    };
                    result.should.deep.equal(EXPECTED_SCHEMA);
                });
        });
    });

    describe('Create and retrieve integration test', () => {
        it('should connect and create an asset and retrieve the asset', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.create('systest.transactions.SimpleStringAsset', {
                    assetId : 'myId',
                    stringValue : 'a big car'
                }, options, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    testConnector.retrieve('systest.transactions.SimpleStringAsset', 'myId', options, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            })
                .then((result) => {
                    result.assetId.should.equal('myId');
                    result.stringValue.should.equal('a big car');
                })
                .catch((error) => {
                    throw new Error('should not get here ' + error);
                });
        });

        it('should connect and submit a transaction', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.create('systest.transactions.SimpleTransactionWithPrimitiveTypes', {
                    transactionId : 'myId',
                    stringValue : 'what a transaction',
                    doubleValue : 3.142,
                    integerValue : 2000000000,
                    longValue : 16000000000000,
                    dateTimeValue : new Date('2016-10-14T18:30:30+00:00'),
                    booleanValue : true,
                    enumValue : 'SUCH'
                }, options, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve();
                });
            })
                .then(() => {
                    //checks happen in transactions.js so if we get here we have successfully submitted the transaction
                })
                .catch((error) => {
                    throw new Error('should not get here ' + error);
                });
        });
    });

    describe('Update integration test', () => {
        beforeEach(() => {
            return new Promise((resolve, reject) => {
                testConnector = new BusinessNetworkConnector(goodSettings);
                let options = {};
                testConnector.create('systest.transactions.SimpleStringAsset', {
                    assetId : 'updateId',
                    stringValue : 'a big car'
                }, options, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    testConnector.retrieve('systest.transactions.SimpleStringAsset', 'updateId', options, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            })
                .then((result) => {
                    result.assetId.should.equal('updateId');
                    result.stringValue.should.equal('a big car');
                })
                .catch((error) => {
                    //don't want test to run if this fails
                    throw new Error('should not get here ' + error);
                });
        });


        it('should connect and update an asset', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.update('systest.transactions.SimpleStringAsset', {
                    assetId : 'updateId',
                    stringValue : 'a bigger car'
                }, options, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    testConnector.retrieve('systest.transactions.SimpleStringAsset', 'updateId', options, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            })
                .then((result) => {
                    result.assetId.should.equal('updateId');
                    result.stringValue.should.equal('a bigger car');
                })
                .catch((error) => {
                    throw new Error('should not get here ' + error);
                });
        });
    });

    describe('Delete integration test', () => {
        beforeEach(() => {
            return new Promise((resolve, reject) => {
                testConnector = new BusinessNetworkConnector(goodSettings);
                let options = {};
                testConnector.create('systest.transactions.SimpleStringAsset', {
                    assetId : 'deleteId',
                    stringValue : 'a big car'
                }, options, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    testConnector.retrieve('systest.transactions.SimpleStringAsset', 'deleteId', options, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            })
                .then((result) => {
                    result.assetId.should.equal('deleteId');
                    result.stringValue.should.equal('a big car');
                })
                .catch((error) => {
                    //don't want test to run if this fails
                    throw new Error('should not get here ' + error);
                });
        });


        it('should connect and delete an asset', () => {
            testConnector = new BusinessNetworkConnector(goodSettings);
            let options = {};
            return new Promise((resolve, reject) => {
                testConnector.delete('systest.transactions.SimpleStringAsset', 'deleteId', options, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    testConnector.retrieve('systest.transactions.SimpleStringAsset', 'deleteId', options, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    });
                });
            })
                .then((result) => {
                    throw new Error('should not get here ' + result);
                })
                .catch((error) => {
                    error.should.match(/does not exist/);
                });
        });
    });
});
