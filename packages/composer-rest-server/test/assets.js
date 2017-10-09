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
require('loopback-component-passport');
const server = require('../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));
const clone = require('clone');

const bfs_fs = BrowserFS.BFSRequire('fs');

['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org.acme.bond.' : '';

    describe(`Asset REST API unit tests namespaces[${namespaces}]`, () => {

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
                dayCountFraction: 'EOY',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 2000,
                instrumentId: [
                    'BobCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#2',
                maturity: '2018-12-27T21:03:52.000Z',
                parValue: 2000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
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
                faceAmount: 3000,
                instrumentId: [
                    'CharlieCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#1',
                maturity: '2018-02-27T21:03:52.000Z',
                parValue: 3000,
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
                faceAmount: 4000,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#1',
                maturity: '2018-02-27T21:03:52.000Z',
                parValue: 4000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 6
                }
            }
        }];

        let app;
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
                return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
            })
            .then((businessNetworkDefinition) => {
                serializer = businessNetworkDefinition.getSerializer();
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                return server({
                    connectionProfileName: 'defaultProfile',
                    businessNetworkIdentifier: 'bond-network',
                    participantId: 'admin',
                    participantPwd: 'adminpw',
                    fs: bfs_fs,
                    namespaces: namespaces
                });
            })
            .then((result) => {
                app = result.app;
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

        describe(`GET / namespaces[${namespaces}]`, () => {

            it('should return all of the assets', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                        ]);
                    });
            });
            it('should return the asset with a specified id', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":"ISIN_1"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the asset with a specified non-id property', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the assets with a specified non-id property in a different format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter[where][bond.dayCountFraction]=EOM`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the asset with multiple specified non-id properties', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM", "bond.faceAmount":1000}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the asset with multiple specified non-id properties including a datetime', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM", "bond.maturity":"2018-02-27T21:03:52.000Z"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the assets with a range of specified properties for a datetime value', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.maturity":{"between":["2018-02-27T21:03:52.000Z", "2018-12-27T21:03:52.000Z"]}}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1]
                        ]);
                    });
            });

            it('should return the assets with a range of specified properties for a number value', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[1000, 1500]}}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return the assets with a range of specified properties for a string value', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":{"between":["EOM", "EOY"]}}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1]
                        ]);
                    });
            });

            it('should return the assets with a combination of the or operator with mutiple properties', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"or":[{"bond.dayCountFraction":"EOM"}, {"bond.maturity":"2018-12-27T21:03:52.000Z"}, {"bond.faceAmount":1000}]}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1]
                        ]);
                    });
            });

            it('should return the assets with a combination of the and operator with mutiple properties', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"and":[{"bond.dayCountFraction":"EOM"},{"bond.maturity":{"lt":"2018-12-27T21:03:52.000Z"}}]}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return a 500 if the and|or operator has more than three properties which is a limitation of pouchdb', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"and":[{"bond.dayCountFraction":"EOM"},{"bond.faceAmount":{"lt":2000}}, {"bond.paymentFrequency.period":"YEAR"}]}}`)
                    .then(() => {
                        throw new Error('should not get here');
                    })
                    .catch((err) => {
                        err.response.should.have.status(500);
                    });
            });

            it('should return the assets with a nested of the \'and\' and the \'or\' operator with mutiple properties', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"and":[{"bond.dayCountFraction":"EOM"},{"or":[{"bond.maturity":"2018-12-27T21:03:52.000Z"}, {"bond.faceAmount":1000}]}]}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

        });

        describe(`POST / namespaces[${namespaces}]`, () => {

            it('should create the specified asset', () => {
                return chai.request(app)
                    .post(`/api/${prefix}BondAsset`)
                    .send(assetData[2])
                    .then((res) => {
                        res.should.have.status(200);
                        return assetRegistry.get('ISIN_3');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(assetData[2]);
                        return assetRegistry.remove('ISIN_3');
                    });
            });

            it('should create the specified asset without a $class property', () => {
                return chai.request(app)
                    .post(`/api/${prefix}BondAsset`)
                    .send(assetData[3])
                    .then((res) => {
                        res.should.have.status(200);
                        return assetRegistry.get('ISIN_4');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        delete json.$class;
                        json.should.deep.equal(assetData[3]);
                        return assetRegistry.remove('ISIN_4');
                    });
            });

            it('should return a 500 if the specified asset already exists', () => {
                return chai.request(app)
                    .post(`/api/${prefix}BondAsset`)
                    .send(assetData[0])
                    .catch((err) => {
                        err.response.should.have.status(500);
                    });
            });

            it('should create the specified array of assets', () => {
                return chai.request(app)
                    .post(`/api/${prefix}BondAsset`)
                    .send([assetData[2], assetData[3]])
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

        describe(`GET /:id namespaces[${namespaces}]`, () => {

            it('should return the specified asset', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset/ISIN_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal(assetData[0]);
                    });
            });

            it('should return a 404 if the specified asset does not exist', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset/ISIN_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`HEAD /:id namespaces[${namespaces}]`, () => {

            it('should check to see if the specified asset exists', () => {
                return chai.request(app)
                    .head(`/api/${prefix}BondAsset/ISIN_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.have.lengthOf(0);
                    });
            });

            it('should return a 404 if the specified asset does not exist', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset/ISIN_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`PUT /:id namespaces[${namespaces}]`, () => {

            it('should update the specified asset', () => {
                const newAssetData = clone(assetData[0]);
                newAssetData.bond.instrumentId = [ 'DogeCorp' ];
                return chai.request(app)
                    .put(`/api/${prefix}BondAsset/ISIN_1`)
                    .set('content-type', 'application/json')
                    .send(newAssetData)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        return assetRegistry.get('ISIN_1');
                    })
                    .then((asset) => {
                        let json = serializer.toJSON(asset);
                        json.should.deep.equal(newAssetData);
                    });
            });

            it('should return a 404 if the specified asset does not exist', () => {
                const newAssetData = clone(assetData[0]);
                newAssetData.ISINCode = 'ISIN_999';
                newAssetData.bond.instrumentId = [ 'DogeCorp' ];
                return chai.request(app)
                    .put(`/api/${prefix}BondAsset/ISIN_999`)
                    .send(newAssetData)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

        describe(`DELETE /:id namespaces[${namespaces}]`, () => {

            it('should delete the specified asset', () => {
                return chai.request(app)
                    .delete(`/api/${prefix}BondAsset/ISIN_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(204);
                        res.body.should.have.lengthOf(0);
                        return assetRegistry.exists('1');
                    })
                    .then((exists) => {
                        exists.should.be.false;
                    });
            });

            it('should return a 404 if the specified asset does not exist', () => {
                return chai.request(app)
                    .delete(`/api/${prefix}BondAsset/ISIN_999`)
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });

        });

    });

});
