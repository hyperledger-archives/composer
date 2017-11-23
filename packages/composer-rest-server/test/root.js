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
const MemoryCardStore = require('composer-common').MemoryCardStore;
const chai = require('chai');
chai.should();
chai.use(require('chai-http'));


describe('Root REST API unit tests', () => {

    let app;
    let idCard;

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
        });
    });

    describe('GET /', () => {

        it('should redirect to the REST API explorer', () => {
            return chai.request(app)
                .get('/')
                .then((res) => {
                    res.redirects.should.have.lengthOf(1);
                    res.redirects[0].should.match(/\/explorer\/$/);
                });
        });

    });

    describe('GET /status', () => {

        it('should provide status', () => {
            return chai.request(app)
                .get('/status')
                .then((res) => {
                    res.should.be.json;
                });
        });

    });

});
