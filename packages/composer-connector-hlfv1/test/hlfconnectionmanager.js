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
const fs = require('fs');

describe('HLFConnectionManager', () => {


    const embeddedCert = '-----BEGIN CERTIFICATE-----\n' +
'MIICKTCCAdCgAwIBAgIRALz4qIofOY8ff94YDATVyGIwCgYIKoZIzj0EAwIwZjEL\n' +
'MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\n' +
'cmFuY2lzY28xFDASBgNVBAoTC29yZGVyZXJPcmcxMRQwEgYDVQQDEwtvcmRlcmVy\n' +
'T3JnMTAeFw0xNzAzMDExNzM2NDFaFw0yNzAyMjcxNzM2NDFaMGYxCzAJBgNVBAYT\n' +
'AlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1TYW4gRnJhbmNpc2Nv\n' +
'MRQwEgYDVQQKEwtvcmRlcmVyT3JnMTEUMBIGA1UEAxMLb3JkZXJlck9yZzEwWTAT\n' +
'BgcqhkjOPQIBBggqhkjOPQMBBwNCAARNSaTugowp/Y4XcY7Hrs+m3oE/j8B/jIp3\n' +
'H8thNhYUdkHX69wNsRB6v/vElHn6CPjUHpNAivbXw9dIz7X3aI/Xo18wXTAOBgNV\n' +
'HQ8BAf8EBAMCAaYwDwYDVR0lBAgwBgYEVR0lADAPBgNVHRMBAf8EBTADAQH/MCkG\n' +
'A1UdDgQiBCBNSnciFRaLZZTIfoJlDkOPHzfDA+FLX55vPuBswruCOjAKBggqhkjO\n' +
'PQQDAgNHADBEAiBa6k7Cax+McCHy61Jma1vLuFZswBbnsC6DqbveiKdUoAIgeyAf\n' +
'HzWxMoVrLfPFwF75PqCjae7xnYq+RWlsHZlMGFU=\n' +
'-----END CERTIFICATE-----';

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

        it('should create a new orderer with tlsopts', () => {
            let orderer = HLFConnectionManager.createOrderer('grpc://localhost:7050', {
                pem: embeddedCert,
                'ssl-target-name-override': 'fredhost'
            });
            orderer.should.be.an.instanceOf(Orderer);
            orderer.getUrl().should.equal('grpc://localhost:7050');
            orderer._options['grpc.ssl_target_name_override'].should.equal('fredhost');
        });
    });

    describe('#createPeer', () => {

        it('should create a new peer', () => {
            let peer = HLFConnectionManager.createPeer('grpc://localhost:7051');
            peer.should.be.an.instanceOf(Peer);
            peer.getUrl().should.equal('grpc://localhost:7051');
        });

        it('should create a new peer using tls options', () => {
            let peer = HLFConnectionManager.createPeer('grpc://localhost:7051', {
                pem: embeddedCert,
                'ssl-target-name-override': 'fredhost'
            });
            peer.should.be.an.instanceOf(Peer);
            peer.getUrl().should.equal('grpc://localhost:7051');
            peer._options['grpc.ssl_target_name_override'].should.equal('fredhost');
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
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', null, '.my-key-store');
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
            caClient.getCrypto()._storeConfig.opts.path.should.equal('.my-key-store');
        });

        it('should create a new CA client with tls options', () => {
            const tlsOpts = {trustedRoots: ['cert1'], verify: false};
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', tlsOpts, '.my-key-store');
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
            caClient._fabricCAClient._tlsOptions.should.deep.equal(tlsOpts);
        });
    });

    describe('#parseCA', () => {

        let mockCAClient;
        beforeEach(() => {
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createCAClient').withArgs(sinon.match.string).returns(mockCAClient);
        });

        it('should create a new CA client from string', () => {
            HLFConnectionManager.parseCA('http://localhost:7054', '.my-key-store');
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, '.my-key-store');
        });

        it('should create a new CA client from object', () => {
            const ca = {
                url: 'http://localhost:7054',
            };
            HLFConnectionManager.parseCA(ca, '.my-key-store');
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, '.my-key-store');
        });

        it('should create a new CA client with tls options', () => {
            const ca = {
                url: 'http://localhost:7054',
                trustedRoots: ['cert1'],
                verify: false
            };
            HLFConnectionManager.parseCA(ca,  '.my-key-store');
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054',
                {
                    trustedRoots: ['cert1'],
                    verify:false
                }, '.my-key-store');
        });
    });

    describe('#parsePeer', () => {
        let peerDef, mockPeer, mockEventHub;
        beforeEach(() => {
            peerDef = {
                requestURL: 'grpc://localhost:7051',
                eventURL: 'grpc://localhost:7053',
            };
            mockPeer = sinon.createStubInstance(Peer);
            sandbox.stub(HLFConnectionManager, 'createPeer').withArgs(peerDef.requestURL).returns(mockPeer);
            mockEventHub = sinon.createStubInstance(EventHub);
            sandbox.stub(HLFConnectionManager, 'createEventHub').returns(mockEventHub);
        });

        it('should throw if peer definition is incorrect', () => {
            let peer = {
                requestURL: 'grpc://localhost:7051'
            };
            (() => {
                HLFConnectionManager.parsePeer(peer);
            }).should.throw('The peer at requestURL grpc://localhost:7051 has no eventURL defined');

            peer = {
                eventURL: 'grpc://localhost:7053'
            };
            (() => {
                HLFConnectionManager.parsePeer(peer);
            }).should.throw('The peer at eventURL grpc://localhost:7053 has no requestURL defined');
            peer = {
                rurl: 'grpc://localhost:7051',
                eURL: 'grpc://localhost:7051'
            };
            (() => {
                HLFConnectionManager.parsePeer(peer);
            }).should.throw('peer incorrectly defined');
        });

        it('should create a new peer and eventHub with no tls', () => {
            let eventHubs = [];
            HLFConnectionManager.parsePeer(peerDef, eventHubs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL);
            sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
            eventHubs.length.should.equal(1);
            eventHubs[0].should.be.an.instanceof(EventHub);
            sinon.assert.calledOnce(mockEventHub.setPeerAddr);
            sinon.assert.calledWith(mockEventHub.setPeerAddr, peerDef.eventURL);
            sinon.assert.calledOnce(mockEventHub.connect);
        });

        it('should create a new peer and eventHub with tls and embedded certificate', () => {
            peerDef.cert = embeddedCert;
            peerDef.hostnameOverride =  'localhost';

            let eventHubs = [];
            HLFConnectionManager.parsePeer(peerDef, eventHubs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                pem: peerDef.cert,
                'ssl-target-name-override': peerDef.hostnameOverride
            });

            sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
            eventHubs.length.should.equal(1);
            eventHubs[0].should.be.an.instanceof(EventHub);
            sinon.assert.calledOnce(mockEventHub.setPeerAddr);
            sinon.assert.calledWith(mockEventHub.setPeerAddr, peerDef.eventURL, {
                pem: peerDef.cert,
                'ssl-target-name-override': peerDef.hostnameOverride
            });
            sinon.assert.calledOnce(mockEventHub.connect);
        });

        it('should create a new peer and eventHub with tls and file system certificate', () => {
            sandbox.stub(fs,'readFileSync').returns(new Buffer('acert'));

            peerDef.cert = '/some/path/to/some/file';

            let eventHubs = [];
            HLFConnectionManager.parsePeer(peerDef, eventHubs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(fs.readFileSync, peerDef.cert);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                pem: 'acert'
            });

            sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
            eventHubs.length.should.equal(1);
            eventHubs[0].should.be.an.instanceof(EventHub);
            sinon.assert.calledOnce(mockEventHub.setPeerAddr);
            sinon.assert.calledWith(mockEventHub.setPeerAddr, peerDef.eventURL, {
                pem: 'acert'
            });
            sinon.assert.calledOnce(mockEventHub.connect);
        });


    });

    describe('#parseOrderer', () => {
        let mockOrderer;
        beforeEach(() => {
            mockOrderer = sinon.createStubInstance(Orderer);
            sandbox.stub(HLFConnectionManager, 'createOrderer').withArgs(sinon.match.string).returns(mockOrderer);
        });

        it('should create a new orderer without tls', () => {
            HLFConnectionManager.parseOrderer('http://localhost:7054');
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'http://localhost:7054');
        });

        it('should create a new orderer with tls and embedded cert', () => {
            let ordererDef = {
                url: 'https://localhost:7054',
                cert: embeddedCert,
                hostnameOverride: 'fred'
            };

            HLFConnectionManager.parseOrderer(ordererDef);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                pem: embeddedCert,
                'ssl-target-name-override': 'fred'
            });
        });

        it('should create a new orderer with tls and file system cert', () => {
            sandbox.stub(fs,'readFileSync').returns(new Buffer('acert'));

            let ordererDef = {
                url: 'https://localhost:7054',
                cert: '/some/path/to/some/file',
            };

            HLFConnectionManager.parseOrderer(ordererDef);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(fs.readFileSync, ordererDef.cert);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                pem: 'acert'
            });
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
                    {
                        requestURL: 'grpc://localhost:7051',
                        eventURL: 'grpc://localhost:7053'
                    }
                ],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'MSP1Org'
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
            sandbox.stub(HLFConnectionManager, 'createCAClient').withArgs(sinon.match.string).returns(mockCAClient);
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

        it('should throw if msp id is not specified', () => {
            delete connectOptions.mspID;
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw(/No msp id defined/);
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

        it('should throw if peer configuration not correct', () => {
            connectOptions.peers = [{
                requestURL: 'grpc://localhost:7051'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw('The peer at requestURL grpc://localhost:7051 has no eventURL defined');

            connectOptions.peers = [{
                eventURL: 'grpc://localhost:7053'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw('The peer at eventURL grpc://localhost:7053 has no requestURL defined');
            connectOptions.peers = [{
                rurl: 'grpc://localhost:7051',
                eURL: 'grpc://localhost:7051'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions);
            }).should.throw('peer incorrectly defined');
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
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, connectOptions.keyValStore);
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
                    sinon.assert.calledWith(mockEventHub.setPeerAddr, 'grpc://localhost:7053');
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

        it('should add multiple peers to the chain', () => {
            connectOptions.peers = [
                {requestURL: 'grpc://localhost:7051', eventURL: 'grpc://localhost:7054'},
                {requestURL: 'grpc://localhost:8051', eventURL: 'grpc://localhost:8054'},
                {requestURL: 'grpc://localhost:9051', eventURL: 'grpc://localhost:9054'}
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
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, connectOptions.keyValStore);
                });
        });

        it('should connect using tls options for ca, orderer & peer', () => {
            connectOptions.orderers[0] = {
                url: 'grpcs://localhost:7051',
                cert: embeddedCert
            };
            connectOptions.peers[0].cert = embeddedCert;
            connectOptions.peers[0].hostnameOverride = 'peerOverride';
            connectOptions.ca = {
                'url': 'https://localhost:7054',
                'trustedRoots' : ['trusted'],
                'verify': false
            };
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
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'https://localhost:7054', {
                        'trustedRoots' : ['trusted'],
                        'verify': false
                    }, connectOptions.keyValStore);
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051', {
                        pem: embeddedCert,
                        'ssl-target-name-override': 'peerOverride'
                    });
                    sinon.assert.calledOnce(HLFConnectionManager.createEventHub);
                    sinon.assert.calledWith(mockEventHub.setPeerAddr, 'grpc://localhost:7053', {
                        pem: embeddedCert,
                        'ssl-target-name-override': 'peerOverride'
                    });

                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpcs://localhost:7051', {
                        pem: embeddedCert
                    });

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

        it('should configure a wallet proxy using the specified wallet if provided', () => {
            connectOptions = Object.assign(connectOptions, { wallet: mockWallet });
            return connectionManager.connect('hlfabric1', 'org.acme.biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
                });
        });


        it('should configure a wallet proxy if a singleton wallet is provided', () => {
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
