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

const api = require('fabric-client/lib/api');
const Chain = require('fabric-client/lib/Chain');
const Client = require('fabric-client');
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const EventHub = require('fabric-client/lib/EventHub');
const FabricCAClientImpl = require('fabric-ca-client');
const HLFConnection = require('../lib/hlfconnection');
const HLFConnectionManager = require('..');
const HLFWalletProxy = require('../lib/hlfwalletproxy');
const Logger = require('composer-common').Logger;
const KeyValueStore = api.KeyValueStore;
const Orderer = require('fabric-client/lib/Orderer');
const Peer = require('fabric-client/lib/Peer');
const Wallet = require('composer-common').Wallet;

const LOG = Logger.getLog('HLFConnectionManager');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('HLFConnectionManager', () => {

    let mockConnectionProfileManager;
    let sandbox;
    let connectionManager;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        connectionManager = new HLFConnectionManager(mockConnectionProfileManager);
    });

    afterEach(() => {
        Wallet.setWallet(null);
        sandbox.restore();
    });

    describe('global.hfc.logger', () => {

        it('should insert a debug logger', () => {
            sandbox.stub(LOG, 'debug');
            global.hfc.logger.debug('hello %s', 'world');
            sinon.assert.calledOnce(LOG.debug);
        });

        it('should insert a info logger', () => {
            sandbox.stub(LOG, 'debug');
            global.hfc.logger.info('hello %s', 'world');
            sinon.assert.calledOnce(LOG.debug);
        });

        it('should insert a warn logger', () => {
            sandbox.stub(LOG, 'debug');
            global.hfc.logger.warn('hello %s', 'world');
            sinon.assert.calledOnce(LOG.debug);
        });

        it('should insert a error logger', () => {
            sandbox.stub(LOG, 'debug');
            global.hfc.logger.error('hello %s', 'world');
            sinon.assert.calledOnce(LOG.debug);
        });

    });

    describe('#createClient', () => {

        it('should create a new client', () => {
            let client = HLFConnectionManager.createClient();
            client.should.be.an.instanceOf(Client);
        });

    });

    describe('#createOrderer', () => {

        it('should create a new orderer', () => {
            let orderer = HLFConnectionManager.createOrderer('grpc://localhost:7050');
            orderer.should.be.an.instanceOf(Orderer);
            orderer.getUrl().should.equal('grpc://localhost:7050');
        });

    });

    describe('#createPeer', () => {

        it('should create a new peer', () => {
            let peer = HLFConnectionManager.createPeer('grpc://localhost:7051');
            peer.should.be.an.instanceOf(Peer);
            peer.getUrl().should.equal('grpc://localhost:7051');
        });

    });

    describe('#createEventHub', () => {

        it('should create a new event hub', () => {
            let eventHub = HLFConnectionManager.createEventHub();
            eventHub.should.be.an.instanceOf(EventHub);
        });

    });

    describe('#createCAClient', () => {

        it('should create a new CA client', () => {
            let mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', mockKeyValueStore);
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
        });

    });

    describe('#connect', () => {

        let connectOptions;
        let mockClient, mockChain, mockOrderer, mockPeer, mockEventHub, mockCAClient, mockKeyValueStore, mockWallet;

        beforeEach(() => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [
                    'grpc://localhost:7051'
                ],
                events: [
                    'grpc://localhost:7053'
                ],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid'
            };
            mockClient = sinon.createStubInstance(Client);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            mockChain = sinon.createStubInstance(Chain);
            mockClient.newChain.returns(mockChain);
            mockOrderer = sinon.createStubInstance(Orderer);
            sandbox.stub(HLFConnectionManager, 'createOrderer').withArgs(connectOptions.orderers[0]).returns(mockOrderer);
            mockPeer = sinon.createStubInstance(Peer);
            sandbox.stub(HLFConnectionManager, 'createPeer').withArgs(connectOptions.peers[0]).returns(mockPeer);
            mockEventHub = sinon.createStubInstance(EventHub);
            sandbox.stub(HLFConnectionManager, 'createEventHub').returns(mockEventHub);
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createCAClient').withArgs(connectOptions.ca).returns(mockCAClient);
            mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockKeyValueStore);
            mockWallet = sinon.createStubInstance(Wallet);
            sandbox.stub(process, 'on').withArgs('exit').yields();
        });

        it('should throw if connectionProfile not specified', () => {
            (() => {
                connectionManager.connect(null, 'org.acme.biznet', connectOptions);
            }).should.throw(/connectionProfile not specified/);
        });

        it('should throw if connectOptions not specified', () => {
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', null);
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw if orderers are not specified', () => {
            delete connectOptions.orderers;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/orderers array has not been specified/);
        });

        it('should throw if orderers is an empty array', () => {
            connectOptions.orderers = [];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No orderer URLs have been specified/);
        });

        it('should throw if peers are not specified', () => {
            delete connectOptions.peers;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/peers array has not been specified/);
        });

        it('should throw if peers is an empty array', () => {
            connectOptions.peers = [];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No peer URLs have been specified/);
        });

        it('should throw if events are not specified', () => {
            delete connectOptions.events;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/events array has not been specified/);
        });

        it('should throw if events is an empty array', () => {
            connectOptions.events = [];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No event hub URLs have been specified/);
        });

        it('should throw if ca is not specified', () => {
            delete connectOptions.ca;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/The certificate authority URL has not been specified/);
        });

        it('should throw if keyValStore is not specified', () => {
            delete connectOptions.keyValStore;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No key value store directory has been specified/);
        });

        it('should throw if channel is not specified', () => {
            delete connectOptions.channel;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No channel has been specified/);
        });

        it('should create a new connection with a business network identifier', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionManager().should.equal(connectionManager);
                    connection.getIdentifier().should.equal('org.acme.biznet@hlfabric1');
                    connection.should.be.an.instanceOf(HLFConnection);
                    connection.getConnectionOptions().should.deep.equal(connectOptions);
                    connection.client.should.deep.equal(mockClient);
                    connection.chain.should.deep.equal(mockChain);
                    connection.eventHubs.should.deep.equal([mockEventHub]);
                    connection.caClient.should.deep.equal(mockCAClient);
                    sinon.assert.calledWith(mockClient.newChain, connectOptions.channel);
                });
        });

        it('should create a new connection without a business network identifier', () => {
            return connectionManager.connect('hlfabric1', null, connectOptions)
                .then((connection) => {
                    connection.getConnectionManager().should.equal(connectionManager);
                    connection.getIdentifier().should.equal('hlfabric1');
                    connection.should.be.an.instanceOf(HLFConnection);
                    connection.getConnectionOptions().should.deep.equal(connectOptions);
                    connection.client.should.deep.equal(mockClient);
                    connection.chain.should.deep.equal(mockChain);
                    connection.eventHubs.should.deep.equal([mockEventHub]);
                    connection.caClient.should.deep.equal(mockCAClient);
                    sinon.assert.calledWith(mockClient.newChain, connectOptions.channel);
                });
        });

        it('should add a single orderer to the chain', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    sinon.assert.calledOnce(mockChain.addOrderer);
                });
        });

        it('should add multiple orderers to the chain', () => {
            connectOptions.orderers = [
                'grpc://localhost:7050',
                'grpc://localhost:8050',
                'grpc://localhost:9050'
            ];
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledThrice(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:8050');
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:9050');
                    sinon.assert.calledThrice(mockChain.addOrderer);
                });
        });

        it('should add a single peer to the chain', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledOnce(mockChain.addPeer);
                });
        });

        it('should fail if eventhub count doesn\'t match peer count', () => {
            connectOptions.peers = [
                'grpc://localhost:7051',
                'grpc://localhost:8051',
                'grpc://localhost:9051'
            ];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/there should be an identical number of event hub urls to peers/);
        });

        it('should add multiple peers to the chain', () => {
            connectOptions.peers = [
                'grpc://localhost:7051',
                'grpc://localhost:8051',
                'grpc://localhost:9051'
            ];
            connectOptions.events = [
                'grpc://localhost:7054',
                'grpc://localhost:8054',
                'grpc://localhost:9054'
            ];
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledThrice(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:8051');
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:9051');
                    sinon.assert.calledThrice(mockChain.addPeer);
                });
        });

        it('should connect a single event hub', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
                    sinon.assert.calledWith(mockEventHub.setPeerAddr, 'grpc://localhost:7053');
                    sinon.assert.calledOnce(mockEventHub.connect);
                });
        });

        it('should ignore a disconnected event hub on process exit', () => {
            mockEventHub.isconnected.returns(false);
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(process.on);
                    sinon.assert.calledWith(process.on, 'exit');
                    sinon.assert.notCalled(mockEventHub.disconnect);
                });
        });

        it('should disconnect a connected event hub on process exit', () => {
            mockEventHub.isconnected.returns(true);
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(process.on);
                    sinon.assert.calledWith(process.on, 'exit');
                    sinon.assert.calledOnce(mockEventHub.disconnect);
                });
        });

        it('should connect a single certificate authority', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', {'path' : connectOptions.keyValStore});
                });
        });

        it('should configure a default key value store', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
                    sinon.assert.calledWith(Client.newDefaultKeyValueStore, { path: '/tmp/hlfabric1' });
                    sinon.assert.calledWith(mockClient.setStateStore, mockKeyValueStore);
                });
        });

        it('should handle an error creating a default key value store', () => {
            Client.newDefaultKeyValueStore.rejects('wow such fail');
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .should.be.rejectedWith(/wow such fail/);
        });

        it('should configure a wallet proxy if a wallet is provided', () => {
            Wallet.setWallet(mockWallet);
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
                });
        });

        it('should set a default deploy wait time', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().deployWaitTime.should.equal(60);
                });
        });

        it('should use a supplied deploy wait time', () => {
            connectOptions.deployWaitTime = 30;
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().deployWaitTime.should.equal(30);
                });
        });

        it('should set a default invoke wait time', () => {
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().invokeWaitTime.should.equal(60);
                });
        });

        it('should use a supplied invoke wait time', () => {
            connectOptions.invokeWaitTime = 30;
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().invokeWaitTime.should.equal(30);
                });
        });

    });

});
