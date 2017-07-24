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
const boot = require('loopback-boot');
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const composerDiscovery = require('../../../server/boot/composer-discovery');
const loopback = require('loopback');
require('loopback-component-passport');
const LoopBackWallet = require('../../../lib/loopbackwallet');
const path = require('path');

require('chai').should();
const sinon = require('sinon');


const bfs_fs = BrowserFS.BFSRequire('fs');

describe('composer-discovery boot script', () => {

    let composerConfig;
    let app;
    let sandbox;

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
            return adminConnection.deploy(businessNetworkDefinition);
        });
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        composerConfig = {
            connectionProfileName: 'defaultProfile',
            businessNetworkIdentifier: 'bond-network',
            participantId: 'admin',
            participantPwd: 'adminpw',
            fs: bfs_fs
        };
        app = loopback();
        return new Promise((resolve, reject) => {
            boot(app, path.resolve(__dirname, '..', '..', '..', 'server'), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })
        .then(() => {
            app.get = (name) => {
                if (name !== 'composer') {
                    return null;
                }
                return composerConfig;
            };
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should discover the business network with the default namespaces option', () => {
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                app.models.org_acme_bond_Member.should.exist;
                app.models.org_acme_bond_Issuer.should.exist;
                app.models.org_acme_bond_PaymentFrequency.should.exist;
                app.models.org_acme_bond_Bond.should.exist;
                app.models.org_acme_bond_BondAsset.should.exist;
                app.models.org_acme_bond_PublishBond.should.exist;
            });
    });

    it('should discover the business network with a non-default namespaces option', () => {
        composerConfig.namespaces = 'never';
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                app.models.Member.should.exist;
                app.models.Issuer.should.exist;
                app.models.PaymentFrequency.should.exist;
                app.models.Bond.should.exist;
                app.models.BondAsset.should.exist;
                app.models.PublishBond.should.exist;
            });
    });

    it('should handle an error from discovering the model definitions', () => {
        const originalCreateDataSource = app.loopback.createDataSource;
        sandbox.stub(app.loopback, 'createDataSource', (name, settings) => {
            let result = originalCreateDataSource.call(app.loopback, name, settings);
            sandbox.stub(result, 'discoverModelDefinitions').yields(new Error('such error'));
            return result;
        });
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                cb.args[0][0].should.match(/such error/);
            });
    });

    it('should handle an error from discovering the queries', () => {
        const originalCreateDataSource = app.loopback.createDataSource;
        sandbox.stub(app.loopback, 'createDataSource', (name, settings) => {
            let result = originalCreateDataSource.call(app.loopback, name, settings);
            sandbox.stub(result.connector, 'discoverQueries').yields(new Error('such error'));
            return result;
        });
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should handle an error from discovering the schemas', () => {
        const originalCreateDataSource = app.loopback.createDataSource;
        sandbox.stub(app.loopback, 'createDataSource', (name, settings) => {
            let result = originalCreateDataSource.call(app.loopback, name, settings);
            sandbox.stub(result, 'discoverSchemas').yields(new Error('such error'));
            return result;
        });
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                cb.args[0][0].should.match(/such error/);
            });
    });

    it('should discover the business network using a wallet to persist certificates', () => {
        sinon.spy(app.loopback, 'createDataSource');
        app.datasources.db.name = 'MongoDB';
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                return app.models.Wallet.findOne({ where: { createdAsSystem: true } });
            })
            .then((wallet) => {
                wallet.should.exist;
                return app.models.WalletIdentity.findOne({ where: { walletId: wallet.id, enrollmentID: 'admin', enrollmentSecret: 'adminpw' }});
            })
            .then((identity) => {
                identity.should.exist;
                app.loopback.createDataSource.args[0][1].wallet.should.be.an.instanceOf(LoopBackWallet);
            });
    });

});
