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
const version = require('../package.json').version;
const MemoryCardStore = require('composer-common').MemoryCardStore;
const chai = require('chai');
chai.should();
chai.use(require('chai-http'));



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

    let transactionIds = {};
    const identityIds = [];

    let app;
    let businessNetworkConnection;
    let participantRegistry;
    let serializer;
    let idCard;

    const binaryParser = (res, cb) => {
        res.setEncoding('binary');
        res.data = '';
        res.on('data', (chunk) => {
            res.data += chunk;
        });
        res.on('end', () => {
            cb(null, new Buffer(res.data, 'binary'));
        });
    };

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
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_1', 'alice1', { issuer: true });
        })
        .then(() => {
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_2', 'bob1', { issuer: true });
        })
        .then(() => {
            transactionIds=[];
            return transactionData.reduce((promise, transaction) => {
                return promise.then(() => {
                    const tx = serializer.fromJSON(transaction);
                    return businessNetworkConnection.submitTransaction(tx)
                        .then(() => {
                            transactionIds[tx.getIdentifier()]=tx;
                        });
                });
            }, Promise.resolve());
        })
        .then(() => {
            return businessNetworkConnection.getIdentityRegistry()
                .then((identityRegistry) => {
                    return identityRegistry.getAll();
                })
                .then((identities) => {
                    identities.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    })
                    .forEach((identity) => {
                        identityIds.push(identity.getIdentifier());
                    });
                });
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
                        participant: 'org.hyperledger.composer.system.NetworkAdmin#admin'
                    });
                });
        });

    });

    describe('GET /identities', () => {

        it('should return all of the identities', () => {
            return chai.request(app)
                .get('/api/system/identities')
                .then((res) => {
                    res.should.be.json;
                    const identities = res.body.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    });
                    identities[0].name.should.equal('admin');
                    identities[1].name.should.equal('alice1');
                    identities[2].name.should.equal('bob1');
                });
        });

    });

    describe('GET /identities/:id', () => {

        it('should return the specified identity', () => {
            return chai.request(app)
                .get('/api/system/identities/' + identityIds[1])
                .then((res) => {
                    res.should.be.json;
                    const identity = res.body;
                    identity.name.should.equal('alice1');
                });
        });

        it('should return a 404 if the specified identity does not exist', () => {
            return chai.request(app)
                .get('/api/system/identities/LOL')
                .catch((err) => {
                    err.response.should.have.status(404);
                });
        });

    });

    describe('POST /identities/issue', () => {

        it('should issue an identity for a participant in the business network', () => {
            return chai.request(app)
                .post('/api/system/identities/issue')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_1',
                    userID: 'alice2',
                    options: {
                        issuer: true
                    }
                })
                .buffer()
                .parse(binaryParser)
                .then((res) => {
                    res.should.have.status(200);
                    res.body.should.be.an.instanceOf(Buffer);
                    return IdCard.fromArchive(res.body);
                })
                .then((card) => {
                    card.getUserName().should.equal('alice2');
                });
        });

        it('should return a 500 if the specified participant does not exist', () => {
            return chai.request(app)
                .post('/api/system/identities/issue')
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

    describe('POST /identities/bind', () => {

        it('should bind an identity to a participant in the business network', () => {
            const certificate = [
                '----- BEGIN CERTIFICATE -----',
                Buffer.from('MEMBER_1').toString('base64'),
                '----- END CERTIFICATE -----'
            ].join('\n').concat('\n');
            return chai.request(app)
                .post('/api/system/identities/bind')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_1',
                    certificate
                })
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(204);
                    res.body.should.have.lengthOf(0);
                });
        });

        it('should return a 500 if the specified participant does not exist', () => {
            const certificate = [
                '----- BEGIN CERTIFICATE -----',
                Buffer.from('MEMBER_1').toString('base64'),
                '----- END CERTIFICATE -----'
            ].join('\n').concat('\n');
            return chai.request(app)
                .post('/api/system/identities/bind')
                .send({
                    participant: 'org.acme.bond.Member#MEMBER_X',
                    certificate
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

    describe('POST /identities/:id/revoke', () => {

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
                        .post(`/api/system/identities/${identity.getIdentifier()}/revoke`);
                })
                .then((res) => {
                    res.should.be.json;
                    res.should.have.status(204);
                    res.body.should.have.lengthOf(0);
                });
        });

        it('should return a 500 if the specified identity does not exist', () => {
            return chai.request(app)
                .post('/api/system/identities/bobX/revoke')
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

    });

    describe('GET /historian', () => {

        it('should return all of the transactions', () => {
            return chai.request(app)
                .get('/api/system/historian')
                .then((res) => {
                    res.should.be.json;
                    res.body.filter((tx) => {
                        return tx.transactionType === 'org.acme.bond.PublishBond';
                    }).reduce((accumulator, currentValue) => {
                        accumulator.push(currentValue.transactionId);
                        return accumulator;
                    },[]).sort().should.deep.equal(Object.keys(transactionIds).sort());
                });
        });

    });

    describe('GET /historian/:id', () => {

        it('should return the specified transaction', () => {
            let txId = Object.keys(transactionIds)[0];
            return chai.request(app)
                .get('/api/system/historian/' + txId)
                .then((res) => {
                    res.should.be.json;
                    const tx = res.body;
                    tx.transactionId.should.equal(transactionIds[txId].getIdentifier());
                    tx.transactionType.should.equal(transactionIds[txId].getFullyQualifiedType());
                    new Date(tx.transactionTimestamp).getUTCDate().should.equal(new Date(transactionIds[txId].timestamp).getUTCDate());
                    // nb need to do this to get the date comparision to work reliably
                });
        });

        it('should return a 404 if the specified transaction does not exist', () => {
            return chai.request(app)
                .get('/api/system/historian/LOL')
                .catch((err) => {
                    err.response.should.have.status(404);
                });
        });

    });

});
