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
const IdCard = require('composer-common').IdCard;
require('loopback-component-passport');
const server = require('../server/server');
const WebSocket = require('ws');

const chai = require('chai');
chai.should();
chai.use(require('chai-http'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Event REST API unit tests', () => {

    let httpServer;
    let businessNetworkConnection;
    let idCard;

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
                idCard = new IdCard({ userName: 'admin', enrollmentSecret: 'adminpw', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                return adminConnection.importCard('admin@bond-network', idCard);
            })
            .then(() => {
                return server({
                    card: 'admin@bond-network',
                    fs: bfs_fs,
                    namespaces: true,
                    websockets: true
                });
            })
            .then((result) => {
                httpServer = result.server;
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connectWithDetails('defaultProfile', 'bond-network', 'admin', 'Xurw3yU9zI0l');
            });
    });

    describe('WebSockets', () => {

        let ws;

        beforeEach(() => {
            return new Promise((resolve, reject) => {
                httpServer.listen(resolve);
            }).then(() => {
                return new Promise((resolve, reject) => {
                    ws = new WebSocket('ws://localhost:' + httpServer.address().port);
                    ws.once('open', resolve);
                });
            });
        });

        it('should subscribe to and receive a single event', () => {
            const promise = new Promise((resolve, reject) => {
                ws.on('message', resolve);
            });
            let txId;
            return chai.request(httpServer)
                    .post('/api/EmitBondEvent')
                    .send({})
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.transactionId.should.be.a('string');
                        txId = res.body.transactionId;
                        return promise;
                    })
                    .then((payload) => {
                        payload.should.be.a('string');
                        const event = JSON.parse(payload);
                        delete event.timestamp;
                        event.should.deep.equal({
                            $class: 'org.acme.bond.BondEvent',
                            eventId: txId + '#0',
                            prop1: 'foo',
                            prop2: 'bar'
                        });
                    });
        });

        it('should subscribe to and receive multiple events', () => {
            const buffer = [];
            const promise = new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    buffer.push(data);
                    if (buffer.length === 3) {
                        resolve(buffer);
                    }
                });
            });
            let txId;
            return chai.request(httpServer)
                    .post('/api/EmitMultipleBondEvents')
                    .send({})
                    .then((res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.transactionId.should.be.a('string');
                        txId = res.body.transactionId;
                        return promise;
                    })
                    .then((payloads) => {
                        payloads.should.have.lengthOf(3);
                        const events = payloads.map((payload) => {
                            const event = JSON.parse(payload);
                            delete event.timestamp;
                            return event;
                        });
                        events.should.deep.equal([{
                            $class: 'org.acme.bond.BondEvent',
                            eventId: txId + '#0',
                            prop1: 'foo',
                            prop2: 'bar'
                        }, {
                            $class: 'org.acme.bond.BondEvent',
                            eventId: txId + '#1',
                            prop1: 'rah',
                            prop2: 'car'
                        }, {
                            $class: 'org.acme.bond.BondEvent',
                            eventId: txId + '#2',
                            prop1: 'zoo',
                            prop2: 'moo'
                        }]);
                    });
        });

    });

});
