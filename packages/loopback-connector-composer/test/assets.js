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
const MemoryCardStore = require('composer-common').MemoryCardStore;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const connector = require('..');
const IdCard = require('composer-common').IdCard;
const loopback = require('loopback');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));



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
            faceAmount: 2000,
            instrumentId: [
                'BobCorp'
            ],
            issuer: 'resource:org.acme.bond.Issuer#2',
            maturity: '2018-12-27T21:03:52.000Z',
            parValue: 1000,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                period: 'YEAR',
                periodMultiplier: 12
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
        let adminConnection;
        let idCard;

        before(() => {
            const cardStore = new MemoryCardStore();
            adminConnection = new AdminConnection({ cardStore });
            let metadata = { version:1, userName: 'admin', enrollmentSecret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin'] };
            const deployCardName = 'deployer-card';

            let idCard_PeerAdmin = new IdCard(metadata, {type : 'embedded',name:'defaultProfile'});
            let businessNetworkDefinition;

            return adminConnection.importCard(deployCardName, idCard_PeerAdmin)
            .then(() => {
                return adminConnection.connect(deployCardName);
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
            })
            .then((result) => {
                businessNetworkDefinition = result;
                serializer = businessNetworkDefinition.getSerializer();
                return adminConnection.install(businessNetworkDefinition.getName());
            })
            .then(()=>{
                return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',enrollmentSecret :'adminpw'}] });
            })
            .then(() => {
                idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })

            .then(() => {
                app = loopback();
                const connectorSettings = {
                    name: 'composer',
                    connector: connector,
                    card: 'admin@bond-network',
                    namespaces: namespaces,
                    cardStore
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
                businessNetworkConnection = new BusinessNetworkConnection({ cardStore });
                return businessNetworkConnection.connect('admin@bond-network');
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
            return adminConnection.connect('admin@bond-network')
            .then( ()=>{
                return adminConnection.reset('bond-network');
            }).then(() => {
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

            it('should count an existing asset using the other asset property', () => {
                return app.models[prefix + 'BondAsset'].count({'bond.faceAmount': 1000 })
                    .then((count) => {
                        count.should.equal(1);
                    });
            });

            it('should count an existing asset using the combination of the asset properties with the or operator', () => {
                return app.models[prefix + 'BondAsset'].count({'or':[{'bond.faceAmount': 1000}, {'bond.paymentFrequency.period': 'YEAR'}]})
                    .then((count) => {
                        count.should.equal(2);
                    });
            });

            it('should count an existing asset using the combination of the asset properties with the nested and|or operator', () => {
                return app.models[prefix + 'BondAsset'].count({'and':[{'bond.issuer': 'resource:org.acme.bond.Issuer#1'},{'or':[{'bond.faceAmount': 1000}, {'bond.paymentFrequency.period': 'YEAR'}]}]})
                    .then((count) => {
                        count.should.equal(1);
                    });
            });

            it('should count an existing asset using the range of the asset properties', () => {
                return app.models[prefix + 'BondAsset'].count({'bond.maturity': {'between':['2018-02-27T21:03:52.000Z', '2018-12-27T21:03:52.000Z']}})
                    .then((count) => {
                        count.should.equal(2);
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

        describe(`#destroyAll namespaces[${namespaces}]`, () => {

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'BondAsset'].destroyAll()
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should remove a single specified asset', () => {
                return app.models[prefix + 'BondAsset'].destroyAll({ ISINCode: 'ISIN_1' })
                    .then(() => {
                        return assetRegistry.exists('ISIN_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return an error if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].destroyAll({ ISINCode: 'ISIN_999' })
                    .should.be.rejected;
            });

        });

        describe(`#destroyById namespaces[${namespaces}]`, () => {

            it('should delete the specified asset', () => {
                return app.models[prefix + 'BondAsset'].destroyById('ISIN_1')
                    .then(() => {
                        return assetRegistry.exists('ISIN_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return an error if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].destroyById('ISIN_999')
                    .should.be.rejected;
            });

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
                    });
            });

        });

        describe(`#replaceById namespaces[${namespaces}]`, () => {

            const updatedAsset = {
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
                        'AliceNewCorp'
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
            };

            it('should update the specified asset', () => {
                return app.models[prefix + 'BondAsset'].replaceById('ISIN_1', updatedAsset)
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

            it('should return an error if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].replaceById('ISIN_999', updatedAsset)
                    .should.be.rejected;
            });

        });

        describe(`#replaceOrCreate namespaces[${namespaces}]`, () => {

            const updatedAsset = {
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
                        'AliceNewCorp'
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
            };

            it('should update the specified asset', () => {
                return app.models[prefix + 'BondAsset'].replaceOrCreate(updatedAsset)
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

            it('should create a new asset if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].replaceOrCreate(assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                    });
            });

        });

        describe(`#updateAll namespaces[${namespaces}]`, () => {

            const updatedAsset = {
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
                        'AliceNewCorp'
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
            };

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'BondAsset'].updateAll(updatedAsset)
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should remove a single specified asset', () => {
                return app.models[prefix + 'BondAsset'].updateAll({ ISINCode: 'ISIN_1' }, updatedAsset)
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

            it('should return an error if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].updateAll({ ISINCode: 'ISIN_999' }, updatedAsset)
                    .should.be.rejected;
            });

        });

        describe(`#upsert namespaces[${namespaces}]`, () => {

            const updatedAsset = {
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
                        'AliceNewCorp'
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
            };

            it('should update the specified asset', () => {
                return app.models[prefix + 'BondAsset'].upsert(updatedAsset)
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

            it('should create a new asset if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].upsert(assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                    });
            });

        });

        describe(`#upsertWithWhere namespaces[${namespaces}]`, () => {

            const updatedAsset = {
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
                        'AliceNewCorp'
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
            };

            it('should throw without a where clause as it is unsupported', () => {
                return app.models[prefix + 'BondAsset'].upsertWithWhere({}, updatedAsset)
                    .should.be.rejectedWith(/is not supported/);

            });

            it('should update the specified asset', () => {
                return app.models[prefix + 'BondAsset'].upsertWithWhere({ ISINCode: 'ISIN_1' }, updatedAsset)
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

            it('should create a new asset if the specified asset does not exist', () => {
                return app.models[prefix + 'BondAsset'].upsertWithWhere({ ISINCode: 'ISIN_3' }, assetData[2])
                    .then(() => {
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                    });
            });

        });

        describe(`#destroy namespaces[${namespaces}]`, () => {

            it('should delete the specified asset', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_1')
                    .then((asset) => {
                        return asset.destroy();
                    })
                    .then(() => {
                        return assetRegistry.exists('ISIN_1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

        });

        describe(`#replaceAttributes namespaces[${namespaces}]`, () => {

            it('should replace attributes in the specified asset', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_1')
                    .then((asset) => {
                        return asset.replaceAttributes({
                            bond: {
                                $class: 'org.acme.bond.Bond',
                                dayCountFraction: 'EOM',
                                exchangeId: [
                                    'NYSE'
                                ],
                                faceAmount: 1000,
                                instrumentId: [
                                    'AliceNewCorp'
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
                        });
                    })
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

        });

        describe(`#updateAttribute namespaces[${namespaces}]`, () => {

            it('should replace attribute in the specified asset', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_1')
                    .then((asset) => {
                        return asset.updateAttribute('bond', {
                            $class: 'org.acme.bond.Bond',
                            dayCountFraction: 'EOM',
                            exchangeId: [
                                'NYSE'
                            ],
                            faceAmount: 1000,
                            instrumentId: [
                                'AliceNewCorp'
                            ],
                            issuer: 'resource:org.acme.bond.Issuer#1',
                            maturity: '2018-02-27T21:03:52.000Z',
                            parValue: 1000,
                            paymentFrequency: {
                                $class: 'org.acme.bond.PaymentFrequency',
                                period: 'MONTH',
                                periodMultiplier: 6
                            }
                        });
                    })
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

        });

        describe(`#updateAttributes namespaces[${namespaces}]`, () => {

            it('should replace attributes in the specified asset', () => {
                return app.models[prefix + 'BondAsset'].findById('ISIN_1')
                    .then((asset) => {
                        return asset.updateAttributes({
                            bond: {
                                $class: 'org.acme.bond.Bond',
                                dayCountFraction: 'EOM',
                                exchangeId: [
                                    'NYSE'
                                ],
                                faceAmount: 1000,
                                instrumentId: [
                                    'AliceNewCorp'
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
                        });
                    })
                    .then(() => {
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        asset.bond.instrumentId.should.deep.equal([ 'AliceNewCorp' ]);
                    });
            });

        });

    });

});
