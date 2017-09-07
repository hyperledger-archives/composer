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
const ldapserver = require('./ldapserver');
const server = require('../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

const bfs_fs = BrowserFS.BFSRequire('fs');

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
    let aliceIdentity;
    let bobIdentity;

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
                connectionProfileName: 'defaultProfile',
                businessNetworkIdentifier: 'bond-network',
                participantId: 'admin',
                participantPwd: 'adminpw',
                fs: bfs_fs,
                namespaces: 'never',
                authentication: true,
                multiuser: true
            });
        })
        .then((result) => {
            app = result.app;
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
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_1', 'alice1', { issuer: true });
        })
        .then((aliceIdentity_) => {
            aliceIdentity = aliceIdentity_;
            return businessNetworkConnection.issueIdentity('org.acme.bond.Member#MEMBER_2', 'bob1', { issuer: true });
        })
        .then((bobIdentity_) => {
            bobIdentity = bobIdentity_;
        });
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

        it('should return 400 Bad Request if authenticated but no identities in wallet', () => {
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
                });
        });

        it('should return 400 Bad Request if authenticated but identity in wallet but no default', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallets/1/identities')
                        .send({ enrollmentID: aliceIdentity.userID, enrollmentSecret: aliceIdentity.userSecret });
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(500);
                });
        });

        it('should return 200 OK if authenticated and default identity in wallet', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallets/1/identities')
                        .send({ enrollmentID: aliceIdentity.userID, enrollmentSecret: aliceIdentity.userSecret });
                })
                .then((res) => {
                    return agent
                        .post(`/api/wallets/1/identities/${res.body.id}/setDefault`)
                        .send();
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

        it('should return 200 OK if authenticated and default identity is subsequently changed', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent
                        .post('/api/wallets/1/identities')
                        .send({ enrollmentID: aliceIdentity.userID, enrollmentSecret: aliceIdentity.userSecret });
                })
                .then((res) => {
                    return agent
                        .post(`/api/wallets/1/identities/${res.body.id}/setDefault`)
                        .send();
                })
                .then(() => {
                    return agent.get('/api/system/ping');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.participant.should.equal('org.acme.bond.Member#MEMBER_1');
                })
                .then((res) => {
                    return agent
                        .post('/api/wallets/1/identities')
                        .send({ enrollmentID: bobIdentity.userID, enrollmentSecret: bobIdentity.userSecret });
                })
                .then((res) => {
                    return agent
                        .post(`/api/wallets/1/identities/${res.body.id}/setDefault`)
                        .send();
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

    });

});