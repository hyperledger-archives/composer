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
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
require('loopback-component-passport');
const server = require('../server/server');

const MemoryCardStore = require('composer-common').MemoryCardStore;
const chai = require('chai');
chai.should();
chai.use(require('chai-http'));




['always', 'never'].forEach((namespaces) => {

    describe(`Query REST API unit tests namespaces[${namespaces}]`, () => {

        const assetData = [{
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_1',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                currency: 'USD',
                exchangeId: [
                    'LDN'
                ],
                dayCount: 100000,
                isMatured: false,
                faceAmount: 1000,
                instrumentId: [
                    'AliceCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_1',
                maturity: '2017-06-27T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'MONTH',
                    periodMultiplier: 7
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_2',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                currency: 'USD',
                exchangeId: [
                    'NYSE'
                ],
                dayCount: 1000000,
                isMatured: false,
                faceAmount: 1000,
                instrumentId: [
                    'BobCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_2',
                maturity: '2017-02-27T21:03:52.000Z',
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
                currency: 'GBP',
                exchangeId: [
                    'NYSE'
                ],
                dayCount: 2000000,
                isMatured: true,
                faceAmount: 500,
                instrumentId: [
                    'CharlieCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_3',
                maturity: '2018-02-27T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_4',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                currency: 'EUR',
                exchangeId: [
                    'NYSE'
                ],
                dayCount: 3000000,
                isMatured: true,
                faceAmount: 400,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_4',
                maturity: '2018-02-27T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_5',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                currency: 'EUR',
                exchangeId: [
                    'NYSE'
                ],
                dayCount: 3000000,
                isMatured: true,
                faceAmount: 1400,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_5',
                maturity: '2017-09-06T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
                }
            }
        }, {
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_6',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                currency: 'EUR',
                exchangeId: [
                    'NYSE'
                ],
                dayCount: 3000000,
                isMatured: false,
                faceAmount: 1400,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#MEMBER_6',
                maturity: '2017-09-06T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
                }
            }
        }];
        const participantData = [{
            $class: 'org.acme.bond.Issuer',
            memberId: 'MEMBER_1',
            name: 'Alice'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'MEMBER_2',
            name: 'Bob'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'MEMBER_3',
            name: 'Charlie'
        }, {
            $class: 'org.acme.bond.Issuer',
            memberId: 'MEMBER_4',
            name: 'Doge'
        }];
        const transactionData = [{
            $class: 'org.acme.bond.PublishBond',
            ISINCode: assetData[4].ISINCode,
            bond: assetData[4].bond
        }, {
            $class: 'org.acme.bond.PublishBond',
            ISINCode: assetData[5].ISINCode,
            bond: assetData[5].bond
        }];
        const transactionIds = [];

        let app;
        let businessNetworkConnection;
        let idCard;
        let assetRegistry;
        let participantRegistry;
        let serializer;



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
                    namespaces: 'never'
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
            .then((assetRegistry_) => {
                assetRegistry = assetRegistry_;
                return assetRegistry.addAll([
                    serializer.fromJSON(assetData[0]),
                    serializer.fromJSON(assetData[1]),
                    serializer.fromJSON(assetData[2]),
                    serializer.fromJSON(assetData[3])
                ]);
            })
            .then(() => {
                return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
            })
            .then((participantRegistry_) => {
                participantRegistry = participantRegistry_;
                return participantRegistry.addAll([
                    serializer.fromJSON(participantData[0]),
                    serializer.fromJSON(participantData[1]),
                    serializer.fromJSON(participantData[2]),
                    serializer.fromJSON(participantData[3])
                ]);
            })
            .then(() => {
                return transactionData.reduce((promise, transaction) => {
                    return promise.then(() => {
                        const tx = serializer.fromJSON(transaction);
                        return businessNetworkConnection.submitTransaction(tx)
                            .then(() => {
                                transactionIds.push(tx.getIdentifier());
                            });
                    });
                }, Promise.resolve());
            });
        });



        describe(`GET / namespaces[${namespaces}]`, () => {

            it('should return all of the assets with a double type variable above a specified value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondAboveAFaceAmount?faceAmount=500')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                            assetData[4],
                            assetData[5]
                        ]);
                    });
            });
            it('should return all of the assets with a double type variable value not greater than a specified value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByFaceAmountNotAboveAValue?faceAmount=500')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2],
                            assetData[3],
                        ]);
                    });
            });
            it('should return empty array if query a double type vairable with a non-existing value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondAboveAFaceAmount?faceAmount=10000')
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });
            it('should return all of the assets with an enum type variable', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByPaymentFrequencyPeriod?period=MONTH')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                        ]);
                    });
            });
            it('should return empty if query an enum type variable with a non-existing value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByPaymentFrequencyPeriod?period=QUARTER')
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });
            it('should return all of the assets with an integer type variable above a specified multiplier', () => {
                return chai.request(app)
                    .get('/api/queries/findBondAboveAPaymentFrequencyPeriodMultiplierValue?multiplier=6')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });
            it('should return all of the assets with a boolean type variable with a specified value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByIsMatured?isMatured=true')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2],
                            assetData[3],
                            assetData[4]
                        ]);
                    });
            });
            it('should return empty if query an integer type vairable with a non-existing value', () => {
                return chai.request(app)
                    .get('/api/queries/findBondAboveAPaymentFrequencyPeriodMultiplierValue?multiplier=8')
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });
            it('should return all of the assets with a string type variable for a specified currency name', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrency?currency=GBP')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2]
                        ]);
                    });
            });
            it('should return all of the assets before a datetime type variable for a specified inclusive timestamp', () => {
                return chai.request(app)
                    .get('/api/queries/findBondBeforeMaturity?maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                            assetData[4],
                            assetData[5]
                        ]);
                    });
            });
            it('should return all of the assets after a datetime type variable for a specified timestamp', () => {
                return chai.request(app)
                    .get('/api/queries/findBondAfterMaturity?maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2],
                            assetData[3]
                        ]);
                    });
            });
            it('should return all of the assets by matured status and before a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByIsMaturedBeforeMaturity?maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                            assetData[2],
                            assetData[3],
                            assetData[4]
                        ]);
                    });
            });
            it('should return all of the assets with a matured and a specific currency OR dayCount ', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByTheIsMaturedAndCurrencyORDayCount?currency=GBP&dayCount=2000000')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                            assetData[2]
                        ]);
                    });
            });
            it('should return all of the assets with a specific currency OR a specific dayCount and after a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrencyORTheDayCountAndMaturity?currency=GBP&dayCount=2000000&maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2]
                        ]);
                    });
            });
            it('should return all of the assets by currency AND the dayCount or after a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrencyANDTheDayCountOrMaturity?currency=GBP&dayCount=2000000&maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2]
                        ]);
                    });
            });
            it('should return all of the assets by currency or the dayCount AND after a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByTheCurrencyOrDayCountANDMaturity?currency=GBP&dayCount=2000000&maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2]
                        ]);
                    });
            });
            it('should return all of the assets by currency or the dayCount or after a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrencyOrDayCountOrMaturity?currency=GBP&dayCount=2000000&maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                            assetData[2],
                            assetData[3]
                        ]);
                    });
            });
            it('should return all of the assets by currency and the dayCount and after a mature date', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrencyAndDayCountAndMaturity?currency=GBP&dayCount=2000000&maturity=2017-09-06T21:03:52.000Z')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[2]
                        ]);
                    });
            });
            it('should return an empty if one of the variable type is unsupported', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByCurrencyAndUnsupportedType?currency=GBP&instrumentId[]=BobCorp')
                    .then((res) =>{
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([]);
                    });
            });

            it('should return all asset if the query specified variable is an array type', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByExchangeIdUnsupported?exchangeId[]=LDN')
                    .then((res) => {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.deep.equal([
                            assetData[0]
                        ]);
                    });
            });
            it('should return an issuer with a member id', () => {
                return chai.request(app)
                    .get('/api/queries/findIssuerById?memberId=MEMBER_3')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            participantData[2]
                        ]);
                    });
            });
            it('should return an issuer with a name', () => {
                return chai.request(app)
                    .get('/api/queries/findIssuerByName?name=Bob')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            participantData[1]
                        ]);
                    });
            });

            it('should return all Transactions with a specified transaction type', () => {
                return chai.request(app)
                    .get('/api/queries/findTxnByTransactionType')
                    .then((res) => {
                        res.should.be.json;
                        res.should.not.be.null;
                        res.body.length.should.equal(2);
                        res.body[0].transactionType.should.equal('org.acme.bond.PublishBond');
                        res.body[1].transactionType.should.equal('org.acme.bond.PublishBond');
                    });
            });
            it('should return a 404 if the specified query does not exist', () => {
                return chai.request(app)
                    .get('/api/queries/nonDefinedQuery?wombat=cuddly')
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });
        });
    });
});
