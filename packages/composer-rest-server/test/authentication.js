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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
require('loopback-component-passport');
const ldapserver = require('./ldapserver');
const server = require('../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Authentication REST API unit tests', () => {

    let app;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type : 'embedded'
        })
        .then(() => {
            return adminConnection.connectWithDetails('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(() => {
            return BusinessNetworkDefinition.fromDirectory('./test/data/bond-network');
        })
        .then((businessNetworkDefinition) => {
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
                authentication: true
            });
        })
        .then((result) => {
            app = result.app;
        });
    });

    after(() => {
        ldapserver.close();
        delete process.env.COMPOSER_PROVIDERS;
    });

    describe('POST /auth/ldap', () => {

        it('should authenticate to the endpoint with invalid credentials and not get an access token', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'invalid' })
                .then((res) => {
                    res.redirects.should.have.lengthOf(2);
                    res.redirects[0].should.match(/\/?failure=true$/);
                    res.req.should.not.have.cookie('access_token');
                });
        });

        it('should authenticate to the endpoint with valid credentials and get an access token', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    res.redirects.should.have.lengthOf(2);
                    res.redirects[0].should.match(/\/?success=true$/);
                    res.req.should.have.cookie('access_token');
                });
        });

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

        it('should return 200 OK if authenticated', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent.get('/api/system/ping');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                });
        });

    });

    describe('GET /api/BondAsset', () => {

        it('should return 401 Unauthorized if not authenticated', () => {
            return chai.request(app)
                .get('/api/BondAsset')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(401);
                });
        });

        it('should return 200 OK if authenticated', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent.get('/api/BondAsset');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                });
        });

    });

    describe('GET /api/Member', () => {

        it('should return 401 Unauthorized if not authenticated', () => {
            return chai.request(app)
                .get('/api/Member')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    err.response.should.have.status(401);
                });
        });

        it('should return 200 OK if authenticated', () => {
            const agent = chai.request.agent(app);
            return agent
                .post('/auth/ldap')
                .send({ username: 'alice', password: 'secret' })
                .then((res) => {
                    return agent.get('/api/Member');
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                });
        });

    });

});
