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

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const connector = require('..');
const loopback = require('loopback');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Event unit tests', () => {

    let app;
    let dataSource;
    let businessNetworkConnection;
    let factory;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type : 'embedded'
        })
            .then(() => {
                return adminConnection.connectWithDetails('defaultProfile', 'admin', 'Xurw3yU9zI0l');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
            })
            .then((businessNetworkDefinition) => {
                factory = businessNetworkDefinition.getFactory();
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                app = loopback();
                const connectorSettings = {
                    name: 'composer',
                    connector: connector,
                    connectionProfileName: 'defaultProfile',
                    businessNetworkIdentifier: 'bond-network',
                    participantId: 'admin',
                    participantPwd: 'adminpw',
                    namespaces: true,
                    fs: bfs_fs
                };
                dataSource = app.loopback.createDataSource('composer', connectorSettings);
                return new Promise((resolve, reject) => {
                    console.log('Discovering types from business network definition ...');
                    dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(modelDefinitions);
                    });
                });
            })
            .then((modelDefinitions) => {
                console.log('Discovered types from business network definition');
                console.log('Generating schemas for all types in business network definition ...');
                return modelDefinitions.reduce((promise, modelDefinition) => {
                    return promise.then((schemas) => {
                        return new Promise((resolve, reject) => {
                            dataSource.discoverSchemas(modelDefinition.name, { visited: {}, associations: true }, (error, modelSchema) => {
                                if (error) {
                                    return reject(error);
                                }
                                schemas.push(modelSchema);
                                resolve(schemas);
                            });
                        });
                    });
                }, Promise.resolve([]));
            })
            .then((modelSchemas) => {
                console.log('Generated schemas for all types in business network definition');
                console.log('Adding schemas for all types to Loopback ...');
                modelSchemas.forEach((modelSchema) => {
                    let model = app.loopback.createModel(modelSchema);
                    app.model(model, {
                        dataSource: dataSource,
                        public: true
                    });
                });
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connectWithDetails('defaultProfile', 'bond-network', 'admin', 'Xurw3yU9zI0l');
            });
    });

    describe('#subscribe', () => {

        it('should subscribe to and receive a single event', () => {
            const cb = sinon.stub();
            dataSource.connector.subscribe(cb);
            const tx = factory.newTransaction('org.acme.bond', 'EmitBondEvent');
            return dataSource.connector.ensureConnected()
                .then((businessNetworkConnection) => {
                    return businessNetworkConnection.submitTransaction(tx);
                })
                .then(() => {
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, {
                        $class: 'org.acme.bond.BondEvent',
                        eventId: tx.getIdentifier() + '#0',
                        timestamp: tx.timestamp.toISOString(),
                        prop1: 'foo',
                        prop2: 'bar'
                    });
                });
        });

        it('should subscribe to and receive multiple events', () => {
            const cb = sinon.stub();
            dataSource.connector.subscribe(cb);
            const tx = factory.newTransaction('org.acme.bond', 'EmitMultipleBondEvents');
            return dataSource.connector.ensureConnected()
                .then((businessNetworkConnection) => {
                    return businessNetworkConnection.submitTransaction(tx);
                })
                .then(() => {
                    sinon.assert.calledThrice(cb);
                    sinon.assert.calledWith(cb, {
                        $class: 'org.acme.bond.BondEvent',
                        eventId: tx.getIdentifier() + '#0',
                        timestamp: tx.timestamp.toISOString(),
                        prop1: 'foo',
                        prop2: 'bar'
                    });
                    sinon.assert.calledWith(cb, {
                        $class: 'org.acme.bond.BondEvent',
                        eventId: tx.getIdentifier() + '#1',
                        timestamp: tx.timestamp.toISOString(),
                        prop1: 'rah',
                        prop2: 'car'
                    });
                    sinon.assert.calledWith(cb, {
                        $class: 'org.acme.bond.BondEvent',
                        eventId: tx.getIdentifier() + '#2',
                        timestamp: tx.timestamp.toISOString(),
                        prop1: 'zoo',
                        prop2: 'moo'
                    });
                });
        });

    });

});
