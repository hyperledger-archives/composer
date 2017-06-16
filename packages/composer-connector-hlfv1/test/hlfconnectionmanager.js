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
const Channel = require('fabric-client/lib/Channel');
const Client = require('fabric-client');
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const FabricCAClientImpl = require('fabric-ca-client');
const HLFConnection = require('../lib/hlfconnection');
const HLFConnectionManager = require('..');
const HLFWalletProxy = require('../lib/hlfwalletproxy');
const KeyValueStore = api.KeyValueStore;
const CryptoSuite = api.CryptoSuite;
const Orderer = require('fabric-client/lib/Orderer');
const Peer = require('fabric-client/lib/Peer');
const Wallet = require('composer-common').Wallet;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');
const fs = require('fs');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('HLFConnectionManager');

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
    const overrideCert = '-----BEGIN CERTIFICATE-----\n' +
'Override override override' +
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

    describe('#createCAClient', () => {

        it('should create a new CA client', () => {
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', null, null);
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
        });

        it('should create a new CA client with tls options', () => {
            const tlsOpts = {trustedRoots: ['cert1'], verify: false};
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', tlsOpts, null);
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
        });

        it('should create a new CA client with tls options and name', () => {
            const tlsOpts = {trustedRoots: ['cert1'], verify: false};
            let caClient = HLFConnectionManager.createCAClient('http://localhost:7054', tlsOpts, 'aname');
            caClient.should.be.an.instanceOf(FabricCAClientImpl);
        });
    });

    describe('#parseCA', () => {

        let mockCAClient;
        beforeEach(() => {
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createCAClient').withArgs(sinon.match.string).returns(mockCAClient);
        });

        it('should create a new CA client from string', () => {
            HLFConnectionManager.parseCA('http://localhost:7054');
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, null);
        });

        it('should create a new CA client from simple object', () => {
            const ca = {
                url: 'http://localhost:7054'
            };
            HLFConnectionManager.parseCA(ca);
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, null);
        });

        it('should create a new CA client from simple object with name', () => {
            const ca = {
                url: 'http://localhost:7054',
                name: 'aname'
            };
            HLFConnectionManager.parseCA(ca);
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, 'aname');
        });


        it('should create a new CA client with tls options and no name', () => {
            const ca = {
                url: 'http://localhost:7054',
                trustedRoots: ['cert1'],
                verify: false
            };
            HLFConnectionManager.parseCA(ca);
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054',
                {
                    trustedRoots: ['cert1'],
                    verify:false
                }, null);
        });

        it('should create a new CA client with tls options and name', () => {
            const ca = {
                url: 'http://localhost:7054',
                trustedRoots: ['cert1'],
                name: 'aname2',
                verify: false
            };
            HLFConnectionManager.parseCA(ca);
            sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
            sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054',
                {
                    trustedRoots: ['cert1'],
                    verify:false
                }, 'aname2');
        });
    });

    describe('#parsePeer', () => {
        let peerDef, mockPeer;
        beforeEach(() => {
            peerDef = {
                requestURL: 'grpc://localhost:7051',
                eventURL: 'grpc://localhost:7053',
            };
            mockPeer = sinon.createStubInstance(Peer);
            sandbox.stub(HLFConnectionManager, 'createPeer').withArgs(peerDef.requestURL).returns(mockPeer);
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
            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 10, undefined, eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL);
            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 10000
                }
            });
        });

        it('should create a new peer with tls and embedded certificate', () => {
            peerDef.cert = embeddedCert;
            peerDef.hostnameOverride =  'localhost';

            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 9, undefined, eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                'request-timeout': 9000,
                pem: embeddedCert,
                'ssl-target-name-override': peerDef.hostnameOverride
            });
            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 9000,
                    pem: embeddedCert,
                    'ssl-target-name-override': peerDef.hostnameOverride
                }
            });
        });

        it('should create a new peer with tls and file system certificate', () => {
            sandbox.stub(fs,'readFileSync').returns(new Buffer('acert'));

            peerDef.cert = '/some/path/to/some/file';

            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 7, undefined, eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(fs.readFileSync, peerDef.cert);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                'request-timeout': 7000,
                pem: 'acert'
            });

            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 7000,
                    'pem': 'acert'
                }
            });
        });

        it('should create a new peer with tls and embedded certificate from global cert', () => {
            peerDef.hostnameOverride =  'localhost';

            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 9, embeddedCert, eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                'request-timeout': 9000,
                pem: embeddedCert,
                'ssl-target-name-override': peerDef.hostnameOverride
            });
            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 9000,
                    pem: embeddedCert,
                    'ssl-target-name-override': peerDef.hostnameOverride
                }
            });
        });

        it('should create a new peer with tls and global file system certificate', () => {
            sandbox.stub(fs,'readFileSync').returns(new Buffer('acert'));
            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 7, '/some/path/to/some/file', eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(fs.readFileSync, '/some/path/to/some/file');
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                'request-timeout': 7000,
                pem: 'acert'
            });

            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 7000,
                    'pem': 'acert'
                }
            });
        });

        it('should create a new peer with tls using cert field over global cert', () => {
            peerDef.hostnameOverride =  'localhost';
            peerDef.cert = overrideCert;

            let eventHubDefs = [];
            HLFConnectionManager.parsePeer(peerDef, 9, embeddedCert, eventHubDefs);
            sinon.assert.calledOnce(HLFConnectionManager.createPeer);
            sinon.assert.calledWith(HLFConnectionManager.createPeer, peerDef.requestURL, {
                'request-timeout': 9000,
                pem: overrideCert,
                'ssl-target-name-override': peerDef.hostnameOverride
            });
            eventHubDefs.length.should.equal(1);
            eventHubDefs.should.be.an.instanceof(Object);
            eventHubDefs[0].should.deep.equal({
                'eventURL': 'grpc://localhost:7053',
                'opts': {
                    'request-timeout': 9000,
                    pem: overrideCert,
                    'ssl-target-name-override': peerDef.hostnameOverride
                }
            });
        });

    });

    describe('#parseOrderer', () => {
        let mockOrderer;
        beforeEach(() => {
            mockOrderer = sinon.createStubInstance(Orderer);
            sandbox.stub(HLFConnectionManager, 'createOrderer').withArgs(sinon.match.string).returns(mockOrderer);
        });

        it('should create a new orderer without tls', () => {
            HLFConnectionManager.parseOrderer('http://localhost:7054', 4);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'http://localhost:7054', {
                'request-timeout': 4000
            });
        });

        it('should create a new orderer with tls and embedded cert', () => {
            let ordererDef = {
                url: 'https://localhost:7054',
                cert: embeddedCert,
                hostnameOverride: 'fred'
            };

            HLFConnectionManager.parseOrderer(ordererDef, 8);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                'request-timeout': 8000,
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

            HLFConnectionManager.parseOrderer(ordererDef, 15);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(fs.readFileSync, ordererDef.cert);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                'request-timeout': 15000,
                pem: 'acert'
            });
        });


        it('should create a new orderer with tls and global cert', () => {
            let ordererDef = {
                url: 'https://localhost:7054',
                hostnameOverride: 'fred'
            };

            HLFConnectionManager.parseOrderer(ordererDef, 8, embeddedCert);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                'request-timeout': 8000,
                pem: embeddedCert,
                'ssl-target-name-override': 'fred'
            });
        });

        it('should create a new orderer with tls and file system cert', () => {
            sandbox.stub(fs,'readFileSync').returns(new Buffer('acert'));

            let ordererDef = {
                url: 'https://localhost:7054',
            };

            HLFConnectionManager.parseOrderer(ordererDef, 15, '/some/path/to/some/file');
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(fs.readFileSync, '/some/path/to/some/file');
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                'request-timeout': 15000,
                pem: 'acert'
            });
        });

        it('should create a new orderer with tls and use the main cert over global cert', () => {
            let ordererDef = {
                url: 'https://localhost:7054',
                hostnameOverride: 'fred',
                cert: overrideCert
            };

            HLFConnectionManager.parseOrderer(ordererDef, 8, embeddedCert);
            sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
            sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'https://localhost:7054', {
                'request-timeout': 8000,
                pem: overrideCert,
                'ssl-target-name-override': 'fred'
            });
        });

    });

    describe('#connect', () => {

        let connectOptions;
        let mockClient, mockChannel, mockOrderer, mockPeer, mockCAClient, mockKeyValueStore, mockWallet;
        let configSettingStub;

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
                timeout: 123,
                mspID: 'MSP1Org'
            };
            mockClient = sinon.createStubInstance(Client);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            mockChannel = sinon.createStubInstance(Channel);
            mockClient.newChannel.returns(mockChannel);
            mockOrderer = sinon.createStubInstance(Orderer);
            sandbox.stub(HLFConnectionManager, 'createOrderer').withArgs(connectOptions.orderers[0]).returns(mockOrderer);
            mockPeer = sinon.createStubInstance(Peer);
            sandbox.stub(HLFConnectionManager, 'createPeer').withArgs(connectOptions.peers[0]).returns(mockPeer);
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createCAClient').withArgs(sinon.match.string).returns(mockCAClient);
            mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockKeyValueStore);
            configSettingStub = sandbox.stub(Client, 'setConfigSetting');
            mockWallet = sinon.createStubInstance(Wallet);
        });

        it('should throw if connectionProfile not specified', () => {
            (() => {
                connectionManager.connect(null, 'org-acme-biznet', connectOptions);
            }).should.throw(/connectionProfile not specified/);
        });

        it('should throw if connectOptions not specified', () => {
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', null);
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw if msp id is not specified', () => {
            delete connectOptions.mspID;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/No msp id defined/);
        });

        it('should throw if orderers are not specified', () => {
            delete connectOptions.orderers;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/orderers array has not been specified/);
        });

        it('should throw if orderers is an empty array', () => {
            connectOptions.orderers = [];
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/No orderer URLs have been specified/);
        });

        it('should throw if peers are not specified', () => {
            delete connectOptions.peers;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/peers array has not been specified/);
        });

        it('should throw if peers is an empty array', () => {
            connectOptions.peers = [];
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/No peer URLs have been specified/);
        });

        it('should throw if peer configuration not correct', () => {
            connectOptions.peers = [{
                requestURL: 'grpc://localhost:7051'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw('The peer at requestURL grpc://localhost:7051 has no eventURL defined');

            connectOptions.peers = [{
                eventURL: 'grpc://localhost:7053'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw('The peer at eventURL grpc://localhost:7053 has no requestURL defined');
            connectOptions.peers = [{
                rurl: 'grpc://localhost:7051',
                eURL: 'grpc://localhost:7051'
            }];
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw('peer incorrectly defined');
        });

        it('should throw if ca is not specified', () => {
            delete connectOptions.ca;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/The certificate authority URL has not been specified/);
        });

        it('should throw if keyValStore and wallet are not specified', () => {
            delete connectOptions.keyValStore;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/No key value store directory or wallet has been specified/);
        });

        //TODO: should throw if wallet not of the right type.

        it('should throw if channel is not specified', () => {
            delete connectOptions.channel;
            (() => {
                connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
            }).should.throw(/No channel has been specified/);
        });

        it('should create a new connection with a business network identifier', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionManager().should.equal(connectionManager);
                    connection.getIdentifier().should.equal('org-acme-biznet@hlfabric1');
                    connection.should.be.an.instanceOf(HLFConnection);
                    connection.getConnectionOptions().should.deep.equal(connectOptions);
                    connection.client.should.deep.equal(mockClient);
                    connection.channel.should.deep.equal(mockChannel);
                    connection.caClient.should.deep.equal(mockCAClient);
                    sinon.assert.calledWith(mockClient.newChannel, connectOptions.channel);
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, null);
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    connection.eventHubDefs[0].should.deep.equal({
                        'eventURL': 'grpc://localhost:7053',
                        'opts': {
                            'request-timeout': 123000
                        }
                    });
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
                    connection.channel.should.deep.equal(mockChannel);
                    connection.caClient.should.deep.equal(mockCAClient);
                    sinon.assert.calledWith(mockClient.newChannel, connectOptions.channel);
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, null);
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    connection.eventHubDefs[0].should.deep.equal({
                        'eventURL': 'grpc://localhost:7053',
                        'opts': {
                            'request-timeout': 123000
                        }
                    });
                });
        });

        it('should set message sizes to value specified', () => {
            connectOptions.maxSendSize = 7;
            connectOptions.maxRecvSize = 3;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledTwice(configSettingStub);
                    sinon.assert.calledWith(configSettingStub, 'grpc-max-send-message-length', 7 * 1024 * 1024);
                    sinon.assert.calledWith(configSettingStub, 'grpc-max-receive-message-length', 3 * 1024 * 1024);
                });
        });

        it('should set message sizes to -1 if -1 specified', () => {
            connectOptions.maxSendSize = -1;
            connectOptions.maxRecvSize = -1;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledTwice(configSettingStub);
                    sinon.assert.calledWith(configSettingStub, 'grpc-max-send-message-length', -1);
                    sinon.assert.calledWith(configSettingStub, 'grpc-max-receive-message-length', -1);
                });
        });

        it('should ignore a value of 0 for message size limits to leave as default', () => {
            connectOptions.maxSendSize = 0;
            connectOptions.maxRecvSize = 0;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    configSettingStub.called.should.be.false;
                });
        });

        it('should ignore string values for message size limits', () => {
            connectOptions.maxSendSize = '1';
            connectOptions.maxRecvSize = '2';
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    configSettingStub.called.should.be.false;
                });
        });

        it('should add a single orderer to the chain', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    sinon.assert.calledOnce(mockChannel.addOrderer);
                });
        });

        it('should add multiple orderers to the chain', () => {
            connectOptions.orderers = [
                'grpc://localhost:7050',
                'grpc://localhost:8050',
                'grpc://localhost:9050'
            ];
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledThrice(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:7050');
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:8050');
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpc://localhost:9050');
                    sinon.assert.calledThrice(mockChannel.addOrderer);
                });
        });

        it('should add a single peer to the chain', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledOnce(mockChannel.addPeer);
                });
        });

        it('should add multiple peers to the chain', () => {
            connectOptions.peers = [
                {requestURL: 'grpc://localhost:7051', eventURL: 'grpc://localhost:7054'},
                {requestURL: 'grpc://localhost:8051', eventURL: 'grpc://localhost:8054'},
                {requestURL: 'grpc://localhost:9051', eventURL: 'grpc://localhost:9054'}
            ];
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledThrice(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051');
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:8051');
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:9051');
                    sinon.assert.calledThrice(mockChannel.addPeer);
                });
        });

        it('should connect a single certificate authority', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'http://localhost:7054', null, null);
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
                'name': 'arealname',
                'trustedRoots' : ['trusted'],
                'verify': false
            };
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionManager().should.equal(connectionManager);
                    connection.getIdentifier().should.equal('org-acme-biznet@hlfabric1');
                    connection.should.be.an.instanceOf(HLFConnection);
                    connection.getConnectionOptions().should.deep.equal(connectOptions);
                    connection.client.should.deep.equal(mockClient);
                    connection.channel.should.deep.equal(mockChannel);
                    connection.caClient.should.deep.equal(mockCAClient);
                    sinon.assert.calledWith(mockClient.newChannel, connectOptions.channel);
                    sinon.assert.calledOnce(HLFConnectionManager.createCAClient);
                    sinon.assert.calledWith(HLFConnectionManager.createCAClient, 'https://localhost:7054', {
                        'trustedRoots' : ['trusted'],
                        'verify': false
                    }, 'arealname');
                    sinon.assert.calledOnce(HLFConnectionManager.createPeer);
                    sinon.assert.calledWith(HLFConnectionManager.createPeer, 'grpc://localhost:7051', {
                        'request-timeout': 123000,
                        pem: embeddedCert,
                        'ssl-target-name-override': 'peerOverride'
                    });
                    connection.eventHubDefs[0].should.deep.equal({
                        'eventURL': 'grpc://localhost:7053',
                        'opts': {
                            'request-timeout': 123000,
                            pem: embeddedCert,
                            'ssl-target-name-override': 'peerOverride'
                        }
                    });

                    sinon.assert.calledOnce(HLFConnectionManager.createOrderer);
                    sinon.assert.calledWith(HLFConnectionManager.createOrderer, 'grpcs://localhost:7051', {
                        'request-timeout': 123000,
                        pem: embeddedCert
                    });

                });
        });

        it('should configure a default key value store', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
                    sinon.assert.calledWith(Client.newDefaultKeyValueStore, { path: '/tmp/hlfabric1' });
                    sinon.assert.calledWith(mockClient.setStateStore, mockKeyValueStore);
                });
        });

        it('should handle an error creating a store using keyValStore', () => {
            Client.newDefaultKeyValueStore.rejects('wow such fail');
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .should.be.rejectedWith(/wow such fail/);
        });

        it('should handle an error creating a store using a wallet', () => {
            delete connectOptions.keyValStore;
            connectOptions.wallet = {};
            sandbox.stub(Client, 'newCryptoKeyStore').throws('wow such fail');

            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .should.be.rejectedWith(/wow such fail/);
        });

        it('should configure a wallet proxy using the specified wallet if provided', () => {
            connectOptions = Object.assign(connectOptions, { wallet: mockWallet });
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
                });
        });

        it('should configure a wallet proxy if a singleton wallet is provided', () => {
            Wallet.setWallet(mockWallet);
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
                });
        });

        it('should set a default timeout', () => {
            delete connectOptions.timeout;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().timeout.should.equal(180);
                });
        });

        it('should use a supplied timeout', () => {
            connectOptions.timeout = 30;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    connection.getConnectionOptions().timeout.should.equal(30);
                });
        });
    });

    describe('#importIdentity', () => {
        let mockClient, mockKeyValueStore, profile, mockCryptoSuite;
        beforeEach(() => {
            mockClient = sinon.createStubInstance(Client);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.stub();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockKeyValueStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);

            profile = {
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
                timeout: 123,
                mspID: 'MSP1Org'
            };
        });

        it('should successfully import an identity', () => {
            return connectionManager.importIdentity(profile, 'anid', 'acert', 'akey')
                .then(() => {
                    sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
                    sinon.assert.calledWith(Client.newDefaultKeyValueStore, { path: '/tmp/hlfabric1' });
                    sinon.assert.calledOnce(mockClient.setStateStore);
                    sinon.assert.calledWith(mockClient.setStateStore, mockKeyValueStore);
                    sinon.assert.calledOnce(Client.newCryptoSuite);
                    sinon.assert.calledOnce(mockClient.setCryptoSuite);
//                    sinon.assert.calledWith(mockClient.newCryptoSuite, null, null, { path: '/tmp/hlfabric1' });
                    sinon.assert.calledOnce(mockClient.createUser);
                    sinon.assert.calledWith(mockClient.createUser, {
                        username: 'anid',
                        mspid: 'MSP1Org',
                        cryptoContent: {
                            privateKeyPEM: 'akey',
                            signedCertPEM: 'acert'
                        }
                    });
                });
        });

        it('should throw if profileDefinition not specified', () => {
            (() => {
                connectionManager.importIdentity();
            }).should.throw(/profileDefinition not specified or not an object/);
        });

        it('should throw if profileDefinition not an object', () => {
            (() => {
                connectionManager.importIdentity('hlfabric1');
            }).should.throw(/profileDefinition not specified or not an object/);
        });

        it('should throw if id not specified', () => {
            (() => {
                connectionManager.importIdentity(profile);
            }).should.throw(/id not specified or not a string/);
        });

        it('should throw if id not a string', () => {
            (() => {
                connectionManager.importIdentity(profile, []);
            }).should.throw(/id not specified or not a string/);
        });

        it('should throw if publicKey not specified', () => {
            (() => {
                connectionManager.importIdentity(profile, 'anid');
            }).should.throw(/publicKey not specified or not a string/);
        });

        it('should throw if publicKey not a string', () => {
            (() => {
                connectionManager.importIdentity(profile, 'anid', []);
            }).should.throw(/publicKey not specified or not a string/);
        });
        it('should throw if key not specified', () => {
            (() => {
                connectionManager.importIdentity(profile, 'anid', 'acert');
            }).should.throw(/privateKey not specified or not a string/);
        });

        it('should throw if key not a string', () => {
            (() => {
                connectionManager.importIdentity(profile, 'anid', 'acert', 5);
            }).should.throw(/privateKey not specified or not a string/);
        });


        it('should throw if msp id is not specified', () => {
            delete profile.mspID;
            (() => {
                connectionManager.importIdentity(profile, 'anid', 'acert', 'akey');
            }).should.throw(/No msp id defined/);
        });

        it('should throw if no keyValStore or wallet is not specified', () => {
            delete profile.keyValStore;
            (() => {
                connectionManager.importIdentity(profile, 'anid', 'acert', 'akey');
            }).should.throw(/No key value store directory or wallet has been specified/);
        });

        it('should handle an error creating a default key value store', () => {
            Client.newDefaultKeyValueStore.rejects('wow such fail');
            return connectionManager.importIdentity(profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/wow such fail/);
        });

        it('should handle an error creating a new cryptosuite', () => {
            mockClient.setCryptoSuite.throws(new Error('another fail'));
            return connectionManager.importIdentity(profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/another fail/);
        });

        it('should handle an error creating a user', () => {
            mockClient.createUser.rejects('wow such fail');
            return connectionManager.importIdentity(profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/wow such fail/);
        });

    });

});
