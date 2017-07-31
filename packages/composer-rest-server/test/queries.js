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

const bfs_fs = BrowserFS.BFSRequire('fs');

['always', 'never'].forEach((namespaces) => {

    describe(`Query REST API unit tests namespaces[${namespaces}]`, () => {

        const assetData = [{
            $class: 'org.acme.bond.BondAsset',
            ISINCode: 'ISIN_1',
            bond: {
                $class: 'org.acme.bond.Bond',
                dayCountFraction: 'EOM',
                exchangeId: [
                    'LDN'
                ],
                faceAmount: 1000,
                instrumentId: [
                    'AliceCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#1',
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
                issuer: 'resource:org.acme.bond.Issuer#2',
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
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 500,
                instrumentId: [
                    'CharlieCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#3',
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
                exchangeId: [
                    'NYSE'
                ],
                faceAmount: 500,
                instrumentId: [
                    'DogeCorp'
                ],
                issuer: 'resource:org.acme.bond.Issuer#4',
                maturity: '2018-02-27T21:03:52.000Z',
                parValue: 1000,
                paymentFrequency: {
                    $class: 'org.acme.bond.PaymentFrequency',
                    period: 'YEAR',
                    periodMultiplier: 1
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
                    serializer.fromJSON(assetData[1]),
                    serializer.fromJSON(assetData[2]),
                    serializer.fromJSON(assetData[3])
                ]);
            });
        });

        describe(`GET / namespaces[${namespaces}]`, () => {

            it('should return all of the assets with a double type variable', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByFaceAmount?faceAmount=500')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                        ]);
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
            it('should return all of the assets with an integer type variable', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByPaymentFrequencyPeriodMultiplier?multiplier=6')
                    .then((res) => {
                        res.should.be.json;
                        res.body.should.deep.equal([
                            assetData[0],
                            assetData[1],
                        ]);
                    });
            });
            it('should return a 404 if the query specified variable is an unsupported array type', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByExchangeIdUnsupported?exchangeId[]=LDN')
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });
            it('should return a 404 if the specified asset does not exist', () => {
                return chai.request(app)
                    .get('/api/queries/findBondByMaturity?maturity=2019-02-27T21:03:52.000Z')
                    .catch((err) => {
                        err.response.should.have.status(404);
                    });
            });
        });
    });
});
