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
const fs = require('fs');
const loopback = require('loopback');
const path = require('path');

const chai = require('chai');
const should = chai.should();
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

    describe(`Asset persisted model unit tests namespaces[${namespaces}]`, () => {

        let app;
        let dataSource;
        let businessNetworkConnection;
        let assetRegistry;
        let serializer;

        before(() => {
            BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
            const adminConnection = new AdminConnection({ fs: bfs_fs });
            return adminConnection.createProfile('defaultProfile', {
                type : 'embedded'
            })
            .then(() => {
                return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
            })
            .then(() => {
                const banana = fs.readFileSync(path.resolve(__dirname, 'bond-network.bna'));
                return BusinessNetworkDefinition.fromArchive(banana);
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
                return businessNetworkConnection.connect('defaultProfile', 'bond-network', 'admin', 'Xurw3yU9zI0l');
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

        describe(`#count namespaces[${namespaces}]`, () => {

            it('should count all of the assets', () => {
                return app.models[prefix + 'BondAsset'].count()
                    .then((count) => {
                        count.should.equal(2);
                    });
            });

            it('should count an existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].count({ ISINCode: 'ISIN_1' })
                    .then((count) => {
                        count.should.equal(1);
                    });
            });

            it('should count an non-existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].count({ ISINCode: 'ISIN_999' })
                    .then((count) => {
                        count.should.equal(0);
                    });
            });

        });

        describe(`#create namespaces[${namespaces}]`, () => {

            it('should create the specified asset', () => {
                return app.models[prefix + 'BondAsset'].create(assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                        return assetRegistry.remove('ISIN_3');
                    });
            });

            it('should create the specified asset without a $class property', () => {
                return app.models[prefix + 'BondAsset'].create(assetData[3])
                    .then(() => {
                        return assetRegistry.get('ISIN_4');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        delete json.$class;
                        json.should.deep.equal(assetData[3]);
                        return assetRegistry.remove('ISIN_4');
                    });
            });

            it('should return an error if the specified asset already exists', () => {
                return app.models[prefix + 'BondAsset'].create(assetData[0])
                    .should.be.rejected;
            });

            it('should create the specified array of assets', () => {
                return new Promise((resolve, reject) => {
                    return app.models[prefix + 'BondAsset'].create([ assetData[2], assetData[3] ], (err) => {
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
                    return assetRegistry.remove('ISIN_3');
                })
                .then(() => {
                    return assetRegistry.get('ISIN_4');
                })
                .then((asset) => {
                    let json = serializer.toJSON(asset);
                    delete json.$class;
                    json.should.deep.equal(assetData[3]);
                    return assetRegistry.remove('ISIN_4');
                });
            });

        });

        describe(`#destroyAll namespaces[${namespaces}]`, () => {

        });

        describe(`#destroyById namespaces[${namespaces}]`, () => {

        });

        describe(`#exists namespaces[${namespaces}]`, () => {

            it('should check the existence of an existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].exists('ISIN_1')
                    .then((exists) => {
                        exists.should.be.true;
                    });
            });

            it('should check the existence of an non-existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].exists('ISIN_999')
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

        });

        describe(`#find namespaces[${namespaces}]`, () => {

            it('should find all existing assets', () => {
                return app.models[prefix + 'BondAsset'].find()
                    .then((assets) => {
                        JSON.parse(JSON.stringify(assets)).should.deep.equal([assetData[0], assetData[1]]);
                    });
            });

            it('should find an existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].find({ where: { ISINCode: 'ISIN_1' } })
                    .then((assets) => {
                        JSON.parse(JSON.stringify(assets)).should.deep.equal([assetData[0]]);
                    });
            });

        });

        describe(`#findById namespaces[${namespaces}]`, () => {

            it('should find an existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_1')
                    .then((asset) => {
                        JSON.parse(JSON.stringify(asset)).should.deep.equal(assetData[0]);
                    });
            });

            it('should not find an non-existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_999')
                    .then((asset) => {
                        should.equal(asset, null);
                    });
            });

        });

        describe(`#findOne namespaces[${namespaces}]`, () => {

            it('should find the first of all existing assets', () => {
                return app.models[prefix + 'BondAsset'].findOne()
                    .then((asset) => {
                        JSON.parse(JSON.stringify(asset)).should.deep.equal(assetData[0]);
                    });
            });

            it('should find an existing asset using the asset ID', () => {
                return app.models[prefix + 'BondAsset'].findOne({ where: { ISINCode: 'ISIN_1' } })
                    .then((asset) => {
                        JSON.parse(JSON.stringify(asset)).should.deep.equal(assetData[0]);
                    });
            });

        });

        describe(`#findOrCreate namespaces[${namespaces}]`, () => {

            it('should find an existing asset using the input asset', () => {
                return app.models[prefix + 'BondAsset'].findOrCreate(assetData[0])
                    .then((parts) => {
                        const asset = parts[0];
                        const created = parts[1];
                        JSON.parse(JSON.stringify(asset)).should.deep.equal(assetData[0]);
                        created.should.be.false;
                    });
            });

            it('should find an existing asset using a where clause', () => {
                return app.models[prefix + 'BondAsset'].findOrCreate({ where: { ISINCode: 'ISIN_1' } }, assetData[0])
                    .then((parts) => {
                        const asset = parts[0];
                        const created = parts[1];
                        JSON.parse(JSON.stringify(asset)).should.deep.equal(assetData[0]);
                        created.should.be.false;
                    });
            });

            it('should not find and create the specified asset using the input asset', () => {
                return app.models[prefix + 'BondAsset'].findOrCreate(assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                        return assetRegistry.remove('ISIN_3');
                    });
            });

            it('should not find and create the specified asset using a where clause', () => {
                return app.models[prefix + 'BondAsset'].findOrCreate({ where: { ISINCode: 'ISIN_3' } }, assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                        return assetRegistry.remove('ISIN_3');
                    });
            });

        });

        describe(`#replaceById namespaces[${namespaces}]`, () => {

        });

        describe(`#replaceOrCreate namespaces[${namespaces}]`, () => {

        });

        describe(`#updateAll namespaces[${namespaces}]`, () => {

        });

        describe(`#upsert namespaces[${namespaces}]`, () => {

        });

        describe(`#upsertWithWhere namespaces[${namespaces}]`, () => {

        });

        describe(`#destroy namespaces[${namespaces}]`, () => {

        });

        describe(`#replaceAttributes namespaces[${namespaces}]`, () => {

        });

        describe(`#updateAttribute namespaces[${namespaces}]`, () => {

        });

        describe(`#updateAttributes namespaces[${namespaces}]`, () => {

        });

    });

});
