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
const ldapserver = require('./ldapserver');
const server = require('../server/server');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-http'));



describe('Multiple user REST API unit tests', () => {

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

    let app;
    let businessNetworkConnection;
    let participantRegistry;
    let serializer;
    let aliceCard, aliceCardData;
    let aliceAdminCard, aliceAdminCardData;
    let bobCard, bobCardData;
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
            return ldapserver.start();
        })
        .then((ldapport) => {
            process.env.COMPOSER_PROVIDERS = JSON.stringify({
                ldap: {
                    provider: 'ldap',
                    module: 'passport-ldapauth',
                    authPath: '/auth/ldap',
                    callbackURL: '/auth/ldap/callback',
                    successRedirect: '/?success=true',
                    failureRedirect: '/?failure=true',
                    authScheme: 'ldap',
                    server: {
                        url: `ldap://localhost:${ldapport}`,
                        bindDN: 'cn=root,dc=example,dc=org',
                        bindCredentials: 'secret',
                        searchBase: 'dc=example,dc=org',
                        searchFilter: '(uid={{username}})'
                    }
                }
            });
            return server({
                card: 'admin@bond-network',
                cardStore,
                namespaces: 'never',
                authentication: true,
                multiuser: true
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
        .then((aliceIdentity) => {
            aliceCard = new IdCard({ userName: aliceIdentity.userID, enrollmentSecret: aliceIdentity.userSecret, businessNetwork: 'bond-network' }, idCard.getConnectionProfile());
            aliceAdminCard = new IdCard({ userName: aliceIdentity.userID, enrollmentSecret: aliceIdentity.userSecret }, idCard.getConnectionProfile());
            return aliceCard.toArchive({ type: 'nodebuffer' });
        })
        .then((aliceCardData_) => {
            aliceCardData = aliceCardData_;
            return aliceAdminCard.toArchive({ type: 'nodebuffer' });
        })
        .then((aliceAdminCardData_) => {
            aliceAdminCardData = aliceAdminCardData_;
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_2', 'bob1', { issuer: true });
        })
        .then((bobIdentity) => {
            bobCard = new IdCard({ userName: bobIdentity.userID, enrollmentSecret: bobIdentity.userSecret, businessNetwork: 'bond-network' }, idCard.getConnectionProfile());
            return bobCard.toArchive({ type: 'nodebuffer' });
        })
        .then((bobCardData_) => {
            bobCardData = bobCardData_;
        });
    });

    beforeEach(() => {
        return app.models.Card.destroyAll();
    });

    after(() => {
        ldapserver.close();
        delete process.env.COMPOSER_PROVIDERS;
    });

    describe('GET /api/system/ping', () => {

        it('should return 401 Unauthorized if not authenticated', () => {
            return chai.request(app)
                .get('/api/system/ping')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(401);
                });
        });

        it('should return 400 Bad Request if authenticated but no business network cards in wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent.get('/api/system/ping');
                })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                    err.response.body.error.message.should.match(/A business network card has not been specified/);
                });
        });

        it('should return 200 OK if authenticated and use first card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.participant.should.equal('org.acme.bond.Member#MEMBER_1');
                });
        });

        it('should return 204 No Content if authenticated and test first card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then(() => {
                    return agent.head('/api/wallet/alice1@bond-network');
                })
                .then((res) => {
                    res.should.have.status(204);
                });
        });

        it('should return 204 No Content if authenticated and test renamed first card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import?name=foobar')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then(() => {
                    return agent.head('/api/wallet/foobar');
                })
                .then((res) => {
                    res.should.have.status(204);
                });
        });

        it('should return 204 No Content if authenticated and test renamed first admin card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceAdminCardData, 'alice1@defaultProfile.card');
                })
                .then(() => {
                    return agent.head('/api/wallet/alice1@defaultProfile');
                })
                .then((res) => {
                    res.should.have.status(204);
                });
        });

        it('should return 200 OK if authenticated and get first card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then(() => {
                    return agent.get('/api/wallet/alice1@bond-network');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.deep.equal({
                        name: 'alice1@bond-network',
                        default: true
                    });
                });
        });

        it('should return 200 OK if authenticated and export first card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then(() => {
                    return agent
                        .get('/api/wallet/alice1@bond-network/export')
                        .buffer()
                        .parse(binaryParser);
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.body.should.be.an.instanceOf(Buffer);
                    return IdCard.fromArchive(res.body);
                })
                .then((card) => {
                    card.getUserName().should.equal('alice1');
                    should.equal(card.getConnectionProfile().wallet, undefined);
                });
        });

        it('should return 200 OK if authenticated and keep using first card when second card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', bobCardData, 'bob1@bond-network.card');
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.participant.should.equal('org.acme.bond.Member#MEMBER_1');
                });
        });

        it('should return 200 OK if authenticated and change default to second card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', bobCardData, 'bob1@bond-network.card');
                })
                .then((res) => {
                    return agent
                        .post('/api/wallet/bob1@bond-network/setDefault');
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.participant.should.equal('org.acme.bond.Member#MEMBER_2');
                });
        });

        it('should return 200 OK if authenticated and use header for second card added to wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', bobCardData, 'bob1@bond-network.card');
                })
                .then(() => {
                    return agent
                        .get('/api/system/ping')
                        .set('X-Composer-Card', 'bob1@bond-network');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.participant.should.equal('org.acme.bond.Member#MEMBER_2');
                });
        });

        it('should return 400 Bad Request if authenticated and default card is deleted from wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallet/import')
                        .attach('card', aliceCardData, 'alice1@bond-network.card');
                })
                .then((res) => {
                    return agent
                        .delete('/api/wallet/alice1@bond-network');
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                    err.response.body.error.message.should.match(/A business network card has not been specified/);
                });
        });

    });

});