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

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

['always', 'never'].forEach((namespaces) => {

    const prefix = namespaces === 'always' ? 'org.acme.bond.' : '';

    describe(`Returning Transactions REST API unit tests namespaces[${namespaces}]`, () => {

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
            $class: 'org.acme.bond.BondAsset',
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

        const participantData = [{
            $class: 'org.acme.bond.Issuer',
            memberId: 'MEMBER_1',
            name: 'Alice'
        }];

        let app;
        let businessNetworkConnection;
        let participantRegistry;
        let assetRegistry;
        let serializer;
        let idCard;
        let adminConnection;

        before(() => {
            const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
            adminConnection = new AdminConnection({ cardStore });
            let metadata = { version:1, userName: 'admin', enrollmentSecret: 'adminpw', roles: ['PeerAdmin', 'ChannelAdmin'] };
            const deployCardName = 'deployer-card';

            let idCard_PeerAdmin = new IdCard(metadata, {'x-type' : 'embedded',name:'defaultProfile'});
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
                    return adminConnection.install(businessNetworkDefinition);
                })
                .then(()=>{
                    return adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(),{networkAdmins :[{userName:'admin',enrollmentSecret:'adminpw'}] });
                })
                .then(() => {
                    idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', 'x-type': 'embedded' });
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
                .then((assetRegistry_) => {
                    assetRegistry = assetRegistry_;
                })
                .then(() => {
                    return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
                })
                .then((participantRegistry_) => {
                    participantRegistry = participantRegistry_;
                    return participantRegistry.addAll([
                        serializer.fromJSON(participantData[0])
                    ]);
                });
        });

        after(() => {
            return adminConnection.undeploy();
        });

        describe(`POST / namespaces[${namespaces}]`, () => {

            it('should submit the transaction and return a string', () => {
                return chai.request(app)
                    .post(`/api/${prefix}PublishBondReturnString`)
                    .send({
                        $class: 'org.acme.bond.PublishBondReturnString',
                        ISINCode: assetData[0].ISINCode,
                        bond: assetData[0].bond
                    })
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('string');
                        res.body.should.be.equal(assetData[0].ISINCode);
                        return assetRegistry.get(assetData[0].ISINCode);
                    })
                    .then((bondRecord) => {
                        bondRecord.should.not.be.null;
                        bondRecord.getIdentifier().should.be.equal(assetData[0].ISINCode);
                    });
            });

            it('should submit the transaction and return a string array', () => {
                return chai.request(app)
                    .post(`/api/${prefix}PublishBondReturnStringArray`)
                    .send({
                        $class: 'org.acme.bond.PublishBondReturnStringArray',
                        ISINCode: assetData[1].ISINCode,
                        bond: assetData[1].bond
                    })
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.length.should.be.equal(1);
                        res.body[0].should.be.equal(assetData[1].ISINCode);
                        return assetRegistry.get(assetData[1].ISINCode);
                    })
                    .then((bondRecord) => {
                        bondRecord.should.not.be.null;
                        bondRecord.getIdentifier().should.be.equal(assetData[1].ISINCode);
                    });
            });

            it('should submit the transaction and return a concept', () => {
                return chai.request(app)
                    .post(`/api/${prefix}PublishBondReturnConcept`)
                    .send({
                        $class: 'org.acme.bond.PublishBondReturnConcept',
                        ISINCode: assetData[2].ISINCode,
                        bond: assetData[2].bond
                    })
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.ISINCode.should.be.equal(assetData[2].ISINCode);
                        res.body.bondIssuer.should.be.equal(assetData[2].bond.issuer);
                        return assetRegistry.get(assetData[2].ISINCode);
                    })
                    .then((bondRecord) => {
                        bondRecord.should.not.be.null;
                        bondRecord.getIdentifier().should.be.equal(assetData[2].ISINCode);
                    });
            });

            it('should submit the transaction and return an array of concepts', () => {
                return chai.request(app)
                    .post(`/api/${prefix}PublishBondReturnConceptArray`)
                    .send({
                        $class: 'org.acme.bond.PublishBondReturnConceptArray',
                        ISINCode: assetData[3].ISINCode,
                        bond: assetData[3].bond
                    })
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        for (let i = 0; i < res.body.length; i++) {
                            res.body[i].ISINCode.should.be.equal(assetData[i].ISINCode);
                            res.body[i].bondIssuer.should.be.equal(assetData[i].bond.issuer);
                        }
                        return assetRegistry.get(assetData[3].ISINCode);
                    })
                    .then((bondRecord) => {
                        bondRecord.should.not.be.null;
                        bondRecord.getIdentifier().should.be.equal(assetData[3].ISINCode);
                    });
            });

            it('should submit the read only transaction', () => {
                return chai.request(app)
                    .post(`/api/${prefix}ExistsBond`)
                    .send({
                        $class: 'org.acme.bond.ExistsBond',
                        ISINCode: assetData[2].ISINCode
                    })
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.equal(true);
                    });
            });

        });
    });
});

