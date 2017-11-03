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

const bfs_fs = BrowserFS.BFSRequire('fs');

['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org_acme_bond_' : '';

    const assetData = [{
        $class: 'org.acme.bond.BondAsset',
        ISINCode: 'ISIN_1',
        bond: {
            $class: 'org.acme.bond.Bond',
            dayCountFraction: 'EOM',
            exchangeId: [
                'NYSE'
            ],
            faceAmount: 1000,
            instrumentId: [
                'AliceCorp'
            ],
            issuer: 'resource:org.acme.bond.Issuer#1',
            maturity: '2018-02-27T21:03:52.000Z',
            parValue: 1000,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                period: 'MONTH',
                periodMultiplier: 6
            }
        }
    }, {
        $class: 'org.acme.bond.BondAsset',
        ISINCode: 'ISIN_2',
        bond: {
            $class: 'org.acme.bond.Bond',
            dayCountFraction: 'EOM',
            exchangeId: [
                'NYSE'
            ],
            faceAmount: 1000,
            instrumentId: [
                'BobCorp'
            ],
            issuer: 'resource:org.acme.bond.Issuer#1',
            maturity: '2018-02-27T21:03:52.000Z',
            parValue: 1000,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                period: 'MONTH',
                periodMultiplier: 6
            }
        }
    }, {
        $class: 'org.acme.bond.BondAsset',
        ISINCode: 'ISIN_3',
        bond: {
            $class: 'org.acme.bond.Bond',
            dayCountFraction: 'EOM',
            exchangeId: [
                'NYSE'
            ],
            faceAmount: 1000,
            instrumentId: [
                'CharlieCorp'
            ],
            issuer: 'resource:org.acme.bond.Issuer#1',
            maturity: '2018-02-27T21:03:52.000Z',
            parValue: 1000,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                period: 'MONTH',
                periodMultiplier: 6
            }
        }
    }, {
        // $class: 'org.acme.bond.BondAsset',
        ISINCode: 'ISIN_4',
        bond: {
            $class: 'org.acme.bond.Bond',
            dayCountFraction: 'EOM',
            exchangeId: [
                'NYSE'
            ],
            faceAmount: 1000,
            instrumentId: [
                'DogeCorp'
            ],
            issuer: 'resource:org.acme.bond.Issuer#1',
            maturity: '2018-02-27T21:03:52.000Z',
            parValue: 1000,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                period: 'MONTH',
                periodMultiplier: 6
            }
        }
    }];

    describe(`Transaction persisted model unit tests namespaces[${namespaces}]`, () => {

        let app;
        let dataSource;
        let businessNetworkConnection;
        let assetRegistry;
        let serializer;
        let adminConnection;

        before(() => {
            BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
            adminConnection = new AdminConnection({ fs: bfs_fs });
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
                serializer = businessNetworkDefinition.getSerializer();
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
                    namespaces: namespaces,
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
            })
            .then(() => {
                return businessNetworkConnection.getAssetRegistry('org.acme.bond.BondAsset');
            })
            .then((assetRegistry_) => {
                assetRegistry = assetRegistry_;
                return assetRegistry.addAll([
                    serializer.fromJSON(assetData[0]),
                    serializer.fromJSON(assetData[1])
                ]);
            });
        });

        beforeEach(() => {
            return adminConnection.connectWithDetails('defaultProfile', 'admin', 'Xurw3yU9zI0l','bond-network')
            .then( ()=>{
                return adminConnection.reset('bond-network');
            })
                .then(() => {
                    return businessNetworkConnection.getAssetRegistry('org.acme.bond.BondAsset');
                })
                .then((assetRegistry_) => {
                    assetRegistry = assetRegistry_;
                    return assetRegistry.addAll([
                        serializer.fromJSON(assetData[0]),
                        serializer.fromJSON(assetData[1])
                    ]);
                });
        });

        describe(`#create namespaces[${namespaces}]`, () => {

            it('should submit the specified transaction', () => {
                const tx = {
                    $class: 'org.acme.bond.PublishBond',
                    ISINCode: assetData[2].ISINCode,
                    bond: assetData[2].bond
                };
                return app.models[prefix + 'PublishBond'].create(tx)
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                    });
            });

            it('should submit the specified transaction without a $class property', () => {
                const tx = {
                    ISINCode: assetData[3].ISINCode,
                    bond: assetData[3].bond
                };
                return app.models[prefix + 'PublishBond'].create(tx)
                    .then(() => {
                        return assetRegistry.get('ISIN_4');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        delete json.$class;
                        json.should.deep.equal(assetData[3]);
                    });
            });

            it('should return an error if the specified asset already exists', () => {
                const tx = {
                    ISINCode: assetData[0].ISINCode,
                    bond: assetData[0].bond
                };
                return app.models[prefix + 'PublishBond'].create(tx)
                    .should.be.rejected;
            });

            it('should submit the specified array of transactions', () => {
                const txs = [{
                    ISINCode: assetData[2].ISINCode,
                    bond: assetData[2].bond
                },
                {
                    ISINCode: assetData[3].ISINCode,
                    bond: assetData[3].bond
                }];
                return new Promise((resolve, reject) => {
                    return app.models[prefix + 'PublishBond'].create(txs, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                })
                .then(() => {
                    return assetRegistry.get('ISIN_3');
                })
                .then((asset) => {
                    let json = serializer.toJSON(asset);
                    json.should.deep.equal(assetData[2]);
                })
                .then(() => {
                    return assetRegistry.get('ISIN_4');
                })
                .then((asset) => {
                    let json = serializer.toJSON(asset);
                    delete json.$class;
                    json.should.deep.equal(assetData[3]);
                });
            });

        });

    });

});
