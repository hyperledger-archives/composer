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
const fs = require('fs');
require('loopback-component-passport');
const path = require('path');
const server = require('../server/server');
const version = require('../package.json').version;

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('System REST API unit tests', () => {

    const participantData = [{
        $class: 'org.acme.bond.Member',
        memberId: 'MEMBER_1',
        name: 'Alice'
    }, {
        $class: 'org.acme.bond.Member',
        memberId: 'MEMBER_2',
        name: 'Bob'
    }, {
        $class: 'org.acme.bond.Issuer',
        memberId: 'ISSUER_1',
        name: 'Charlie'
    }, {
        $class: 'org.acme.bond.Issuer',
        memberId: 'ISSUER_2',
        name: 'Dave'
    }];

    const transactionData = [{
        $class: 'org.acme.bond.PublishBond',
        ISINCode: 'ISIN_1',
        bond: {
            $class: 'org.acme.bond.Bond',
            instrumentId: [ 'INST_1' ],
            exchangeId: [ 'EXCHG_1' ],
            maturity: '1970-01-01T00:00:00.000Z',
            parValue: 1.0,
            faceAmount: 1.0,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                periodMultiplier: 1,
                period: 'DAY'
            },
            dayCountFraction: 'wat',
            issuer: 'resource:org.acme.bond.Issuer#ISSUER_1'
        }
    }, {
        $class: 'org.acme.bond.PublishBond',
        ISINCode: 'ISIN_2',
        bond: {
            $class: 'org.acme.bond.Bond',
            instrumentId: [ 'INST_2' ],
            exchangeId: [ 'EXCHG_2' ],
            maturity: '1970-01-01T00:00:00.000Z',
            parValue: 2.0,
            faceAmount: 2.0,
            paymentFrequency: {
                $class: 'org.acme.bond.PaymentFrequency',
                periodMultiplier: 2,
                period: 'DAY'
            },
            dayCountFraction: 'wat',
            issuer: 'resource:org.acme.bond.Issuer#ISSUER_2'
        }
    }];

    const transactionIds = [];

    let app;
    let businessNetworkConnection;
    let participantRegistry;
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
            return server({
                connectionProfileName: 'defaultProfile',
                businessNetworkIdentifier: 'bond-network',
                participantId: 'admin',
                participantPwd: 'adminpw',
                fs: bfs_fs,
                namespaces: 'never'
            });
        })
        .then((app_) => {
            app = app_;
            businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
            return businessNetworkConnection.connect('defaultProfile', 'bond-network', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Member');
        })
        .then((participantRegistry_) => {
            participantRegistry = participantRegistry_;
            return participantRegistry.addAll([
                serializer.fromJSON(participantData[0]),
                serializer.fromJSON(participantData[1])
            ]);
        })
        .then(() => {
            return businessNetworkConnection.getParticipantRegistry('org.acme.bond.Issuer');
        })
        .then((participantRegistry_) => {
            participantRegistry = participantRegistry_;
            return participantRegistry.addAll([
                serializer.fromJSON(participantData[2]),
                serializer.fromJSON(participantData[3])
            ]);
        })
        .then(() => {
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_2', 'bob1', { issuer: true });
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

    describe('GET /ping', () => {

        it('should ping the business network', () => {
            return chai.request(app)
                .get('/api/system/ping')
                .then((res) => {
                    res.should.be.json;
                    res.body.should.deep.equal({
                        version: version,
                        participant: null
                    });
                });
        });

    });

    describe('POST /issueIdentity', () => {

        it('should issue an identity for a participant in the business network', () => {
            return chai.request(app)
                .post('/api/system/issueIdentity')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_1',
                    userID: 'alice1',
                    options: {
                        issuer: true
                    }
                })
                .then((res) => {
                    res.should.be.json;
                    res.body.userID.should.equal('alice1');
                    res.body.userSecret.should.be.a('string');
                });
        });

        it('should return a 500 if the specified participant does not exist', () => {
            return chai.request(app)
                .post('/api/system/issueIdentity')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_X',
                    userID: 'alice1',
                    options: {
                        issuer: true
                    }
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

    describe('POST /revokeIdentity', () => {

        it('should revoke an identity for a participant in the business network', () => {
            return businessNetworkConnection.getIdentityRegistry()
                .then((identityRegistry) => {
                    return identityRegistry.getAll();
                })
                .then((identities) => {
                    const identity = identities.find((identity) => {
                        return identity.name === 'bob1';
                    });
                    return chai.request(app)
                        .post('/api/system/revokeIdentity')
                        .send({
                            userID: identity.getIdentifier()
                        });
                })
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(204);
                    res.body.should.have.lengthOf(0);
                });
        });

        it('should return a 500 if the specified identity does not exist', () => {
            return chai.request(app)
                .post('/api/system/revokeIdentity')
                .send({
                    userID: 'bobX'
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

    describe('GET /transactions', () => {

        it('should return all of the transactions', () => {
            return chai.request(app)
                .get('/api/system/transactions')
                .then((res) => {
                    res.should.be.json;
                    console.log(res.body);
                    res.body.filter((tx) => {
                        return tx.$class === 'org.acme.bond.PublishBond';
                    }).sort((a, b) => {
                        return a.ISINCode.localeCompare(b.ISINCode);
                    }).map((tx) => {
                        delete tx.transactionId;
                        delete tx.timestamp;
                        return tx;
                    }).should.deep.equal(transactionData);
                });
        });

    });

    describe('GET /transactions/:id', () => {

        it('should return the specified transaction', () => {
            return chai.request(app)
                .get('/api/system/transactions/' + transactionIds[0])
                .then((res) => {
                    res.should.be.json;
                    const tx = res.body;
                    delete tx.transactionId;
                    delete tx.timestamp;
                    tx.should.deep.equal(transactionData[0]);
                });
        });

        it('should return a 404 if the specified transaction does not exist', () => {
            return chai.request(app)
                .get('/api/system/transactions/LOL')
                .catch((err) => {
                    err.response.should.have.status(404);
                });
        });

    });

});
