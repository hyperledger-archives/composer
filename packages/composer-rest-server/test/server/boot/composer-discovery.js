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
const MemoryCardStore = require('composer-common').MemoryCardStore;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const composerDiscovery = require('../../../server/boot/composer-discovery');
const IdCard = require('composer-common').IdCard;
const loopback = require('loopback');
require('loopback-component-passport');
const path = require('path');

require('chai').should();
const sinon = require('sinon');




describe('composer-discovery boot script', () => {

    let composerConfig;
    let app;
    let sandbox;
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
        sandbox = sinon.sandbox.create();
        composerConfig = {
            card: 'admin@bond-network',
            cardStore
        };
        app = loopback();
        app.set('composer', composerConfig);
        return new Promise((resolve, reject) => {
            boot(app, path.resolve(__dirname, '..', '..', '..', 'server'), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
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
                app.models.org_acme_bond_BaseAsset.should.exist;
                app.models.org_acme_bond_BaseConcept.should.exist;
                app.models.org_acme_bond_BaseParticipant.should.exist;
                app.models.org_acme_bond_BaseTransaction.should.exist;
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
                app.models.BaseAsset.should.exist;
                app.models.BaseConcept.should.exist;
                app.models.BaseParticipant.should.exist;
                app.models.BaseTransaction.should.exist;
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

    it('should subscribe to events and ignore them if WebSocket server not specified', () => {
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                app.models.System.dataSource.connector.eventemitter.emit('event', { foo: 'bar' });
            });
    });

    it('should subscribe to events and publish them if WebSocket server is specified', () => {
        const wss = {
            broadcast: sinon.stub()
        };
        app.set('wss', wss);
        const cb = sinon.stub();
        return composerDiscovery(app, cb)
            .then(() => {
                app.models.System.dataSource.connector.eventemitter.emit('event', { foo: 'bar' });
                sinon.assert.calledOnce(wss.broadcast);
                sinon.assert.calledWith(wss.broadcast, '{"foo":"bar"}');
            });
    });

});
