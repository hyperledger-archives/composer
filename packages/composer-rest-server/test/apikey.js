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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
require('loopback-component-passport');
const server = require('../server/server');
const chai = require('chai');
chai.should();
chai.use(require('chai-http'));


describe('Access with APIKEY unit tests', () => {

    const APIKEY = 'CUSTOMAPIKEY';
    let app;
    let idCard;
    let adminConnection;

    before(() => {
        const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore({type: 'composer-wallet-inmemory'});
        adminConnection = new AdminConnection({cardStore});
        let metadata = {
            version: 1,
            userName: 'admin',
            enrollmentSecret: 'adminpw',
            roles: ['PeerAdmin', 'ChannelAdmin']
        };
        const deployCardName = 'deployer-card';

        let idCard_PeerAdmin = new IdCard(metadata, {'x-type': 'embedded', name: 'defaultProfile'});
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
                return adminConnection.install(businessNetworkDefinition);
            })
            .then(() => {
                return adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), {
                    networkAdmins: [{
                        userName: 'admin',
                        enrollmentSecret: 'adminpw'
                    }]
                });
            })
            .then(() => {
                idCard = new IdCard({
                    userName: 'admin',
                    enrollmentSecret: 'adminpw',
                    businessNetwork: 'bond-network'
                }, {name: 'defaultProfile', 'x-type': 'embedded'});
                return adminConnection.importCard('admin@bond-network', idCard);
            })
            .then(() => {
                return server({
                    card: 'admin@bond-network',
                    cardStore,
                    namespaces: 'never',

                    apikey: APIKEY,
                    port: 3001
                });
            })
            .then((result) => {
                app = result.app;
            });
    });

    after(() => {
        return adminConnection.undeploy();
    });

    describe('GET /api/system/ping', () => {

        it('should return 401 Unauthorized if APIKEY is not specified', () => {
            const agent = chai.request.agent(app);
            return agent
                .get('/api/system/ping')
                .then(res => {
                    throw new Error('should not get here');
                })
                .catch(err => {
                    err.response.should.have.status(401);
                });
        });

        it('should return 200 OK if APIKEY is specified', () => {
            const agent = chai.request.agent(app);
            return agent
                .get('/api/system/ping')
                .set({'x-api-key': APIKEY})
                .then(res => {
                    res.should.have.status(200);
                    res.should.be.json;
                });
        });
    });

    describe('GET /api/BondAsset', () => {

        it('should return 401 Unauthorized if APIKEY is not specified', () => {
            const agent = chai.request.agent(app);
            return agent
                .get('/api/BondAsset')
                .then(res => {
                    throw new Error('should not get here');
                })
                .catch(err => {
                    err.response.should.have.status(401);
                });
        });

        it('should return 200 OK if APIKEY is specified', () => {
            const agent = chai.request.agent(app);
            return agent
                .get('/api/BondAsset')
                .set({'x-api-key': APIKEY})
                .then(res => {
                    res.should.have.status(200);
                    res.should.be.json;
                });
        });
    });
});
