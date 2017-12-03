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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
const http = require('http');
const https = require('https');
const IdCard = require('composer-common').IdCard;
const path = require('path');
const server = require('../../server/server');
const WebSocket = require('ws');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const keyFile = path.resolve(__dirname, 'key.pem');
const keyContents = fs.readFileSync(keyFile, 'utf8');
const certFile = path.resolve(__dirname, 'cert.pem');
const certContents = fs.readFileSync(certFile, 'utf8');

describe('server', () => {

    let composerConfig;
    let idCard;
    let cardStore;

    before(() => {
        cardStore = new MemoryCardStore();
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
            return adminConnection.install(businessNetworkDefinition.getName());
        })
        .then(()=>{
            return adminConnection.start(businessNetworkDefinition,{networkAdmins :[{userName:'admin',enrollmentSecret:'adminpw'}] });
        })
        .then(() => {
            idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
            return adminConnection.importCard('admin@bond-network', idCard);
        });
    });

    beforeEach(() => {
        composerConfig = {
            card: 'admin@bond-network',
            cardStore
        };
        delete process.env.COMPOSER_DATASOURCES;
        delete process.env.COMPOSER_PROVIDERS;
    });

    afterEach(() => {
        delete process.env.COMPOSER_DATASOURCES;
        delete process.env.COMPOSER_PROVIDERS;
    });

    it('should throw if composer not specified', () => {
        (() => {
            server(null);
        }).should.throw(/composer not specified/);
    });

    it('should create an application without security enabled', () => {
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
            });
    });

    it('should create an application with data sources loaded from the environment', () => {
        process.env.COMPOSER_DATASOURCES = JSON.stringify({
            db: {
                name: 'db',
                connector: 'memory',
                test: 'flag'
            }
        });
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                result.app.dataSources.db.settings.test.should.equal('flag');
            });
    });

    it('should handle errors from any of the boot scripts', () => {
        composerConfig.card = 'nocardherelulz';
        return server(composerConfig)
            .should.be.rejectedWith();
    });

    it('should create an HTTP server if TLS not enabled', () => {
        const spy = sinon.spy(http, 'createServer');
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWith(spy, result.app);
            });
    });

    it('should create an HTTPS server if TLS is enabled', () => {
        const spy = sinon.spy(https, 'createServer');
        composerConfig.tls = true;
        composerConfig.tlscert = certFile;
        composerConfig.tlskey = keyFile;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                sinon.assert.calledOnce(spy);
                const options = spy.args[0][0];
                options.cert.should.equal(certContents);
                options.key.should.equal(keyContents);
                sinon.assert.calledWith(spy, options, result.app);
            });
    });

    it('should set the port if explicitly specified', () => {
        composerConfig.port = 4321;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                result.app.get('port').should.equal(4321);
            });
    });

    it('should enable authentication if specified', () => {
        composerConfig.authentication = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const routes = result.app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                });
                const routePaths = routes.map((r) => {
                    return r.route.path;
                });
                routePaths.should.deep.equal(['/auth/local', '/auth/local/callback', '/auth/logout']);
            });
    });

    it('should logout without an access token', () => {
        composerConfig.authentication = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const routes = result.app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                });
                const req = {
                    logout: sinon.stub()
                };
                const res = {
                    redirect: sinon.stub(),
                    clearCookie: sinon.stub()
                };
                const next = sinon.stub();
                return routes[2].route.stack[0].handle(req, res, next)
                    .then(() => {
                        sinon.assert.calledOnce(req.logout);
                        sinon.assert.calledTwice(res.clearCookie);
                        sinon.assert.calledWith(res.clearCookie, 'access_token');
                        sinon.assert.calledWith(res.clearCookie, 'userId');
                        sinon.assert.calledOnce(res.redirect);
                        sinon.assert.calledWith(res.redirect, '/');
                        sinon.assert.notCalled(next);
                    });
            });
    });

    it('should logout with an access token', () => {
        composerConfig.authentication = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const routes = result.app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                });
                const req = {
                    logout: sinon.stub(),
                    accessToken: {
                        id: 'accessTokenId'
                    }
                };
                const res = {
                    redirect: sinon.stub(),
                    clearCookie: sinon.stub()
                };
                const next = sinon.stub();
                const logoutSpy = sinon.spy(result.app.models.user, 'logout');
                return result.app.models.accessToken.create({ id: 'accessTokenId' })
                    .then(() => {
                        return routes[2].route.stack[0].handle(req, res, next);
                    })
                    .then(() => {
                        sinon.assert.calledOnce(req.logout);
                        sinon.assert.calledTwice(res.clearCookie);
                        sinon.assert.calledWith(res.clearCookie, 'access_token');
                        sinon.assert.calledWith(res.clearCookie, 'userId');
                        sinon.assert.calledOnce(res.redirect);
                        sinon.assert.calledWith(res.redirect, '/');
                        sinon.assert.notCalled(next);
                        sinon.assert.calledOnce(logoutSpy);
                        sinon.assert.calledWith(logoutSpy, 'accessTokenId');
                    });
            });
    });

    it('should enable authentication if specified with providers loaded from the environment', () => {
        process.env.COMPOSER_PROVIDERS = JSON.stringify({
            ldap: {
                provider: 'ldap',
                module: 'passport-ldapauth',
                authPath: '/auth/ldap',
                callbackURL: '/auth/ldap/callback',
                successRedirect: '/',
                failureRedirect: '/',
                authScheme: 'ldap',
                server: {
                    url: 'ldap://localhost:389',
                    bindDN: 'cn=admin,dc=example,dc=org',
                    bindCredentials: 'admin',
                    searchBase: 'dc=example,dc=org',
                    searchFilter: '(uid={{username}})'
                }
            }
        });
        composerConfig.authentication = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const routes = result.app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                }).map((r) => {
                    return r.route.path;
                });
                routes.should.deep.equal(['/auth/ldap', '/auth/ldap/callback', '/auth/logout']);
            });
    });

    it('should enable WebSockets if specified', () => {
        composerConfig.websockets = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const wss = result.app.get('wss');
                wss.should.be.an.instanceOf(WebSocket.Server);
                wss.broadcast.should.be.a('function');
            });
    });

    it('should broadcast WebSocket messages to all connected clients', () => {
        composerConfig.websockets = true;
        return server(composerConfig)
            .then((result) => {
                result.app.should.exist;
                result.server.should.exist;
                const wss = result.app.get('wss');
                wss.should.be.an.instanceOf(WebSocket.Server);
                wss.broadcast.should.be.a('function');
                wss.clients = [
                    {
                        readyState: WebSocket.OPEN,
                        send: sinon.stub()
                    },
                    {
                        readyState: WebSocket.CONNECTING,
                        send: sinon.stub()
                    },
                    {
                        readyState: WebSocket.OPEN,
                        send: sinon.stub()
                    }
                ];
                wss.broadcast('{"foo":"bar"}');
                sinon.assert.calledOnce(wss.clients[0].send);
                sinon.assert.calledWith(wss.clients[0].send, '{"foo":"bar"}');
                sinon.assert.notCalled(wss.clients[1].send);
                sinon.assert.calledOnce(wss.clients[2].send);
                sinon.assert.calledWith(wss.clients[2].send, '{"foo":"bar"}');
            });
    });

});
