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
const fs = require('fs');
const path = require('path');
const server = require('../../server/server');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('server', () => {

    let composerConfig;

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
            const banana = fs.readFileSync(path.resolve(__dirname, '..', 'bond-network.bna'));
            return BusinessNetworkDefinition.fromArchive(banana);
        })
        .then((businessNetworkDefinition) => {
            return adminConnection.deploy(businessNetworkDefinition);
        });
    });

    beforeEach(() => {
        composerConfig = {
            connectionProfileName: 'defaultProfile',
            businessNetworkIdentifier: 'bond-network',
            participantId: 'admin',
            participantPwd: 'adminpw',
            fs: bfs_fs
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
            .then((app) => {
                app.should.exist;
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
            .then((app) => {
                app.should.exist;
                app.dataSources.db.settings.test.should.equal('flag');
            });
    });

    it('should handle errors from any of the boot scripts', () => {
        composerConfig.businessNetworkIdentifier = 'org.acme.doesnotexist';
        return server(composerConfig)
            .should.be.rejectedWith();
    });

    it('should set the port if explicitly specified', () => {
        composerConfig.port = 4321;
        return server(composerConfig)
            .then((app) => {
                app.should.exist;
                app.get('port').should.equal(4321);
            });
    });

    it('should enable security if specified', () => {
        composerConfig.security = true;
        return server(composerConfig)
            .then((app) => {
                app.should.exist;
                const routes = app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                });
                const routePaths = routes.map((r) => {
                    return r.route.path;
                });
                routePaths.should.deep.equal(['/auth/local', '/auth/local/callback', '/auth/logout']);
                const req = {
                    logout: sinon.stub()
                };
                const res = {
                    redirect: sinon.stub()
                };
                const next = sinon.stub();
                routes[2].route.stack[0].handle(req, res, next);
                sinon.assert.calledOnce(req.logout);
                sinon.assert.calledOnce(res.redirect);
                sinon.assert.calledWith(res.redirect, '/');
                sinon.assert.notCalled(next);
            });
    });

    it('should enable security if specified with providers loaded from the environment', () => {
        process.env.COMPOSER_PROVIDERS = JSON.stringify({
            'github-login': {
                provider: 'github',
                module: 'passport-github2',
                clientID: '69e33e2302c923ebe3c5',
                clientSecret: '2b8e4449a07b5e2dfbdc70a8e836388eb48c9e54',
                callbackURL: '/auth/github/callback',
                authPath: '/auth/github',
                callbackPath: '/auth/github/callback',
                successRedirect: '/auth/account',
                failureRedirect: '/login',
                scope: [
                    'email'
                ],
                failureFlash: true,
                display: 'GitHub'
            }
        });
        composerConfig.security = true;
        return server(composerConfig)
            .then((app) => {
                app.should.exist;
                const routes = app._router.stack.filter((r) => {
                    return r.route && r.route.path;
                }).map((r) => {
                    return r.route.path;
                });
                routes.should.deep.equal(['/auth/github', '/auth/github/callback', '/auth/logout']);
            });
    });

});
