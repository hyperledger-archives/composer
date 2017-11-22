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
const IdCard = require('composer-common').IdCard;
require('loopback-component-passport');
const server = require('../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org.acme.bond.' : '';

    describe(`Filter REST API unit tests namespaces[${namespaces}]`, () => {
        const participants = [{
            $class: 'org.acme.bond.Issuer',
            memberId: 'ISSUER_1',
            name: 'Billy Banterlope'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'ISSUER_2',
            name: 'Conga Block'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'ISSUER_3',
            name: 'Percy Penguin'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'ISSUER_4',
            name: 'Wendy Wombat'
        }];

        const assetData = [{
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_1',
            bond: {
                $class: 'org.acme.bond.Bond',
                description: 'A',
                dayCountFraction: 'EOM',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 1000,
                instrumentId: [
                    'AliceCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_1',
                maturity: '2018-01-27T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 1
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_2',
            bond: {
                $class: 'org.acme.bond.Bond',
                description: 'B',
                dayCountFraction: 'EOY',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 2000,
                instrumentId: [
                    'BobCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_2',
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
                description: 'C',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 1500,
                instrumentId: [
                    'CharlieCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_3',
                maturity: '2017-02-27T21:03:52.000Z',
                parValue: 3000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 4
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_4',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOY',
                description: 'D',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 4000,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_4',
                maturity: '2016-02-27T21:03:52.000Z',
                parValue: 4000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 6
                }
            }
        },
        {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_5',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOY',
                description: 'E',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 5000,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_5',
                maturity: '2016-02-27T21:03:52.000Z',
                parValue: 5000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 6
                }
            }
        },
        {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_6',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOY',
                description: 'F',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 6000,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_6',
                maturity: '2015-02-27T21:03:52.000Z',
                parValue: 6000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 6
                }
            }
        },
        {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_7',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOY',
                description: 'A',
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 60000,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#ISSUER_3',
                owners: ['resource:org.acme.bond.Issuer#ISSUER_1', 'resource:org.acme.bond.Issuer#ISSUER_2'],
                maturity: '2010-02-27T21:03:52.000Z',
                parValue: 60000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 6
                }
            }
        }
        ];

        let app;
        let businessNetworkConnection;
        let serializer;
        let idCard;

        before(() => {
            const cardStore = new MemoryCardStore();
            const adminConnection = new AdminConnection({ cardStore });
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
                return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',enrollmentSecret:'adminpw'}] });
            })
            .then(() => {
                idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })
            .then(() => {
                return server({
                    card: 'admin@bond-network',
                    cardStore,
                    namespaces: namespaces
                });
            })
            .then((result) => {
                app = result.app;
                businessNetworkConnection = new BusinessNetworkConnection({ cardStore });
                return businessNetworkConnection.connect('admin@bond-network');
            })

            .then(() => {
                return businessNetworkConnection.getAssetRegistry('org.acme.bond.BondAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.addAll([
                    serializer.fromJSON(assetData[0]),
                    serializer.fromJSON(assetData[1]),
                    serializer.fromJSON(assetData[2]),
                    serializer.fromJSON(assetData[3]),
                    serializer.fromJSON(assetData[4]),
                    serializer.fromJSON(assetData[5]),
                    serializer.fromJSON(assetData[6])
                ]);
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
            })
            .then((participantRegistry) => {
                return participantRegistry.addAll([
                    serializer.fromJSON(participants[0]),
                    serializer.fromJSON(participants[1]),
                    serializer.fromJSON(participants[2]),
                    serializer.fromJSON(participants[3])
                ]);
            });

        });

        describe('Filter Equivalence', () => {

            // Identifier field
            it('should return matches with a specified identifying field using json format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":"ISIN_1"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            it('should return matches with a specified identifying using object format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter[where][ISINCode]=ISIN_1`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });

            // Non-identifier field
            it('should return matches with a STRING property using json format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[2]
                        ]);
                    });
            });

            xit('should return matches with a STRING property using json format', () => {
            });

            xit('should return matches with a DATETIME property using json format', () => {
            });

            xit('should return matches with a DOUBLE property using json format', () => {
            });

            xit('should return matches with an INTEGER CONCEPT property using json format', () => {
            });

            xit('should return matches with an ENUM CONCEPT property using json format', () => {
            });

            it('should return matches with multiple properties, STRING and DATETIME, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM", "bond.maturity":"2018-01-27T21:03:52.000Z"}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0]
                    ]);
                });
            });

            it('should return matches with multiple properties, STRING and DOUBLE, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"EOM", "bond.faceAmount":1000}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0]
                    ]);
                });
            });

            it('should return an empty array if nothing matches the filter on an identifier field, using json format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter={"where":{"bond.dayCountFraction":"DOES_NOT_EXIST"}}`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });

            xit('should return an empty array if nothing matches the filter on a property field, using json format', () => {
            });

            it('should return an empty array if nothing matches the filter on an identifier field using object format', () => {
                return chai.request(app)
                    .get(`/api/${prefix}BondAsset?filter[where][ISINCode]=DOES_NOT_EXIST`)
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });
        });

        describe('Filter Greater/Less Than', () => {
            // valid only for numerical and date values
            xit('should return GREATER THAN matches with a DOUBLE property, using json format', () => {
            });

            xit('should return GREATER THAN matches with an INTEGER property, using json format', () => {
            });

            xit('should return GREATER THAN matches with a DATETIME property, using json format', () => {
            });

            xit('should return LESS THAN matches with a DOUBLE property, using json format', () => {
            });

            xit('should return LESS THAN matches with an INTEGER property, using json format', () => {
            });

            xit('should return LESS THAN matches with a DATETIME property, using json format', () => {
            });

            xit('should return an empty array if no matching GREATER THAN DOUBLE property, using json format', () => {
            });

            xit('should return an empty array if no matching GREATER THAN DATETIME property, using json format', () => {
            });

            xit('should return an empty array if no matching LESS THAN DOUBLE property using, json format', () => {
            });

            xit('should return an empty array if no matching LESS THAN DATETIME property using,json format', () => {
            });

        });

        describe('Filter AND', () => {
            // interested in depth and combination
            xit('should return matches with an identifier field AND non-identifier STRING property, using json format', () => {
            });

            xit('should return matches with an identifier field AND non-identifier DOUBLE property, using json format', () => {
            });

            xit('should return matches with an identifier field AND non-identifier DATETIME property, using json format', () => {
            });

            xit('should return matches with TWO non-identifier STRING properties, using json format', () => {
            });

            xit('should return matches with THREE non-identifier STRING properties, using json format', () => {
            });

            xit('should return matches with non-identifier STRING AND DOUBLE properties, using json format', () => {

            });

            it('should return matches with non-identifier STRING AND LESS THAN DATETIME properties, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"and":[{"bond.dayCountFraction":"EOM"},{"bond.maturity":{"lt":"2018-06-27T21:03:52.000Z"}}]}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[2]
                    ]);
                });
            });

            xit('should return matches with non-identifier DOUBLE AND DATETIME properties, using json format', () => {
            });

            xit('should return matches with non-identifier STRING AND DOUBLE AND DATETIME properties, using json format', () => {
            });

            xit('should return an empty array if no matching AND properties, using json format', () => {
            });
        });

        describe('Filter OR', () => {
            xit('should return matches on the identifier when filtering on the identifier field OR a property, using json format', () => {
            });

            xit('should return matches on the property when filtering on the identifier field OR a property, using json format', () => {
            });

            xit('should return matches on the property when filtering on the identifier field OR a property, using object format', () => {
            });

            xit('should return matches on a DOUBLE when filtering on DOUBLE OR STRING properties, using json format', () => {
            });

            xit('should return matches on a STRING when filtering on DOUBLE OR STRING properties, using json format', () => {
            });

            xit('should return matches on a DATETIME when filtering on DATETIME OR STRING properties, using json format', () => {
            });

            it('should return matches when filtering on DATETIME OR STRING OR DOUBLE properties, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"or":[{"bond.dayCountFraction":"EOM"}, {"bond.maturity":"2018-01-27T21:03:52.000Z"}, {"bond.faceAmount":1000}]}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[2]
                    ]);
                });
            });

            xit('should return matches on a DATETIME when filtering on DATETIME OR STRING properties, using object format', () => {
            });

            xit('should return an empty array if no matching OR properties, using json format', () => {
            });

            xit('should return an empty array if no matching OR properties, using object format', () => {
            });

        });

        describe('Filter AND/OR', () => {
            xit('should return matches when filtering on the identifier field AND a property OR property, using json format', () => {
                // (IDENTIFIER) AND (PROPERTY OR PROPERTY)
            });

            xit('should return matches when filtering on the identifier field OR a property AND property, using json format', () => {
                // (IDENTIFIER) OR (PROPERTY AND PROPERTY)
            });

            it('should return matches when filtering on the property AND a property OR property, using json format', () => {
                // (PROPERTY) AND (PROPERTY OR PROPERTY)
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"and":[{"bond.dayCountFraction":"EOM"},{"or":[{"bond.maturity":"2018-12-27T21:03:52.000Z"}, {"bond.faceAmount":1000}]}]}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0]
                    ]);
                });
            });

            xit('should return matches when filtering on the property OR a property AND property, using json format', () => {
                // (PROPERTY) OR (PROPERTY AND PROPERTY)
            });

            xit('should return matches when filtering with compound AND/OR clauses on properties, using json format', () => {
                // (PROPERTY AND PROPERTY) OR (PROPERTY AND PROPERTY) OR (PROPERTY AND PROPERTY)
            });

            xit('should return matches when filtering with compound AND/OR clauses on properties, using json format', () => {
                // (PROPERTY OR PROPERTY) AND (PROPERTY OR PROPERTY) AND (PROPERTY OR PROPERTY)
            });

            xit('should return matches when filtering with nested AND/OR clauses on properties, using json format', () => {
                // (PROPERTY OR (PROPERTY AND PROPERTY)) AND (PROPERTY AND (PROPERTY OR PROPERTY))
            });

            xit('should return an empty array if no matching AND/OR properties, using object format', () => {
            });
        });

        describe('Filter BETWEEN', () => {

            it('should return matches when filtering on the identifier field, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":{"between":["ISIN_1", "ISIN_3"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[1],
                        assetData[2]
                    ]);
                });
            });

            it('should return matches when filtering on STRING property field, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.description":{"between":["C", "D"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[2],
                        assetData[3]
                    ]);
                });
            });

            xit('should return matches when filtering on INTEGER property field, using json format', () => {
            });

            it('should return matches when filtering on DOUBLE property field, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[900, 1501]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[2]
                    ]);
                });
            });

            it('should return matches when filtering on DATETIME property field, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.maturity":{"between":["2017-09-27T21:03:52.000Z", "2018-12-27T21:03:52.000Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[1]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN STRING when there is a starting match, but unbounded ending match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.description":{"between":["C", "Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[2],
                        assetData[3],
                        assetData[4],
                        assetData[5]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN DOUBLE when there is a starting match, but unbounded ending match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[2000, 9000]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[1],
                        assetData[3],
                        assetData[4],
                        assetData[5]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN DATETIME when there is a starting match, but unbounded ending match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.maturity":{"between":["2017-09-27T21:03:52.000Z", "2118-12-27T21:03:52.000Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[1]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN STRING when there is an ending match, but unbounded starting match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.description":{"between":["C", "Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[2],
                        assetData[3],
                        assetData[4],
                        assetData[5]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN DOUBLE when there is an ending match, but unbounded starting match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[0, 1500]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[2]
                    ]);
                });
            });

            it('should return contained matches when searching BETWEEN DATETIME when there is an ending match, but unbounded starting match, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.maturity":{"between":["2010-09-27T21:03:52.000Z", "2017-09-27T21:03:52.000Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[2],
                        assetData[3],
                        assetData[4],
                        assetData[5]
                    ]);
                });
            });

            xit('should handle searching BETWEEN when there are unmatched types, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[0, "Penguin"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([
                        assetData[0],
                        assetData[2]
                    ]);
                });
            });

            it('should return an empty array if no matching BETWEEN STRING properties, using json format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.description":{"between":["X", "Z"]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([]);
                });
            });

            it('should return an empty array if no matching BETWEEN DOUBLE properties, using object format', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"bond.faceAmount":{"between":[9000, 10000]}}}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.deep.equal([]);
                });
            });

        });

        describe('Filter include:resolve', () => {

            it('should return a single fully resolved Resource', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":"ISIN_1"}, "include":"resolve"}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.length(1);
                    res.body[0].bond.issuer.should.deep.equal(participants[0]);
                });
            });

            it('should return a single fully resolved Resource with both a single relation and multiple relationships', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":"ISIN_7"}, "include":"resolve"}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.length(1);
                    res.body[0].bond.issuer.should.deep.equal(participants[2]);
                    res.body[0].bond.owners.should.have.length(2);
                    res.body[0].bond.owners[0].should.deep.equal(participants[0]);
                    res.body[0].bond.owners[1].should.deep.equal(participants[1]);
                });
            });

            it('should return multiple fully resolved Resources', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":{"between":["ISIN_1", "ISIN_3"]}}, "include":"resolve"}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.length(3);
                    res.body[0].bond.issuer.should.deep.equal(participants[0]);
                    res.body[1].bond.issuer.should.deep.equal(participants[1]);
                    res.body[2].bond.issuer.should.deep.equal(participants[2]);
                });
            });

            it('should return the missing reference as a string value in resolve process of single Resource', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":"ISIN_5"}, "include":"resolve"}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.length(1);
                    res.body[0].should.deep.equal(assetData[4]);
                });
            });

            it('should return missing references with string values as they are not resolved for multiple Resources', () => {
                return chai.request(app)
                .get(`/api/${prefix}BondAsset?filter={"where":{"ISINCode":{"between":["ISIN_5", "ISIN_6"]}}, "include":"resolve"}`)
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.length(2);
                    res.body[0].should.deep.equal(assetData[4]);
                    res.body[1].should.deep.equal(assetData[5]);
                });
            });
        });

        describe('Filter UNSUPPORTED', () => {

            xit('should return an error message when trying to use NEAR', () => {
            });

            xit('should return an error message when trying to use LIKE', () => {
            });

            xit('should return an error message when trying to use NLIKE', () => {
            });

            xit('should return an error message when trying to use REGEXP', () => {
            });

        });
    });
});
