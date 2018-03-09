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
const idModule = require('fabric-client/lib/msp/identity');
const Channel = require('fabric-client/lib/Channel');
const Client = require('fabric-client');
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const FabricCAClientImpl = require('fabric-ca-client');
const HLFConnection = require('../lib/hlfconnection');
const HLFConnectionManager = require('..');
const HLFWalletProxy = require('../lib/hlfwalletproxy');
const KeyValueStore = api.KeyValueStore;
const CryptoSuite = api.CryptoSuite;
const path = require('path');
const User = require('fabric-client/lib/User');
const Wallet = require('composer-common').Wallet;
const fsextra = require('fs-extra');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

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

    let mockConnectionProfileManager, mockClient;
    let sandbox;
    let connectionManager;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockClient = sinon.createStubInstance(Client);
        mockClient._network_config = {
            '_network_config': {
                channels: {
                    composerchannel: {}
                }
            }
        };
        connectionManager = new HLFConnectionManager(mockConnectionProfileManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('global.hfc.logger', () => {

        it('should insert a debug logger', () => {
            let logger = sandbox.stub(LOG, 'debug');
            global.hfc.logger.debug('%s %s', 'hello', 'world');
            global.hfc.logger.debug('hello %s', 'world');
            global.hfc.logger.debug('hello world');
            sinon.assert.alwaysCalledWith(logger, 'fabric-client', 'hello world');
        });

        it('should insert a info logger', () => {
            let logger = sandbox.stub(LOG, 'info');
            global.hfc.logger.info('%s %s', 'hello', 'world');
            global.hfc.logger.info('hello %s', 'world');
            global.hfc.logger.info('hello world');
            sinon.assert.alwaysCalledWith(logger, 'fabric-client', 'hello world');
        });

        it('should insert a warn logger', () => {
            let logger = sandbox.stub(LOG, 'warn');
            global.hfc.logger.warn('%s %s', 'hello', 'world');
            global.hfc.logger.warn('hello %s', 'world');
            global.hfc.logger.warn('hello world');
            sinon.assert.alwaysCalledWith(logger, 'fabric-client', 'hello world');
        });

        it('should insert a error logger', () => {
            let logger = sandbox.stub(LOG, 'error');
            global.hfc.logger.error('%s %s', 'hello', 'world');
            global.hfc.logger.error('hello %s', 'world');
            global.hfc.logger.error('hello world');
            sinon.assert.alwaysCalledWith(logger, 'fabric-client', 'hello world');
        });

    });

    describe('#createClient', () => {

        let ccp;
        beforeEach(() => {
            ccp = {
                cardName: 'acard',
                client: {
                    organization: 'org1'
                }
            };
        });

        it('should create a new client with default cryptosuite without setting up a state store', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(Client, 'newCryptoSuite').returns('defaultSuite');
            let client = await HLFConnectionManager.createClient(ccp);
            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledWith(Client.loadFromConfig, ccp);
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, 'defaultSuite');
            client.should.be.an.instanceOf(Client);
        });

        it('should create a new client with HSM cryptosuite without setting up a state store', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(HLFConnectionManager, 'getHSMCryptoSuite').returns('HSMCryptoSuite');
            ccp.client['x-hsm'] = {
                library: '/usr/lib/hsm.so',
                pin: 98765,
                slot: 0
            };

            let client = await HLFConnectionManager.createClient(ccp);
            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledWith(Client.loadFromConfig, ccp);
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, 'HSMCryptoSuite');
            client.should.be.an.instanceOf(Client);
        });


        it('should handle an error from loadFromConfig', async () => {
            sandbox.stub(Client, 'loadFromConfig').throws(new Error('loaderror'));
            await HLFConnectionManager.createClient(ccp)
                .should.be.rejectedWith(/loaderror/);
        });

        it('should throw wallet or cardname not provided and store setup required', async () => {
            delete ccp.cardName;
            sandbox.stub(Wallet, 'getWallet').returns(null);
            await HLFConnectionManager.createClient(ccp, true)
                .should.be.rejectedWith(/No wallet or card name has been specified/);
        });

        it('should set up a wallet if wallet defined as well as cardName', async () => {
            ccp.wallet = sinon.createStubInstance(Wallet);
            sandbox.stub(Client, 'loadFromConfig').returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(HLFConnectionManager, 'setupWallet').resolves();
            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);
            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledOnce(HLFConnectionManager.setupWallet);
            sinon.assert.calledWith(HLFConnectionManager.setupWallet, mockClient, ccp.wallet);
            sinon.assert.notCalled(mockClient.initCredentialStores);
        });

        it('should set up a wallet if global wallet defined as well as cardName', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            let mockWallet = sinon.createStubInstance(Wallet);
            sandbox.stub(Wallet, 'getWallet').returns(mockWallet);
            sandbox.stub(HLFConnectionManager, 'setupWallet').resolves();
            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);
            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledWith(Client.loadFromConfig, ccp);
            sinon.assert.calledOnce(HLFConnectionManager.setupWallet);
            sinon.assert.calledWith(HLFConnectionManager.setupWallet, mockClient, mockWallet);
            sinon.assert.notCalled(mockClient.initCredentialStores);
        });

        it('should set up a file based store if only cardName defined', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(HLFConnectionManager, 'setupWallet').resolves();
            sandbox.stub(path, 'join').returns('something');
            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);
            should.not.exist(ccp.client.credentialStore);

            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledOnce(path.join);
            sinon.assert.calledWith(path.join, sinon.match.any, sinon.match.string, sinon.match.string, 'acard');
            sinon.assert.notCalled(HLFConnectionManager.setupWallet);
            sinon.assert.calledOnce(mockClient.initCredentialStores);
        });

        it('should set up an hsm cryptosuite and file system store if only hsm configured', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(HLFConnectionManager, 'setupWallet');
            sandbox.stub(HLFConnectionManager, 'setupHSM');

            ccp.client['x-hsm'] = {
                library: '/usr/lib/hsm.so',
                pin: 98765,
                slot: 0
            };
            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);

            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.notCalled(HLFConnectionManager.setupWallet);
            sinon.assert.notCalled(mockClient.initCredentialStores);
            sinon.assert.calledOnce(HLFConnectionManager.setupHSM);
            sinon.assert.calledWith(HLFConnectionManager.setupHSM, client, ccp);
        });

        it('should set up an hsm cryptosuite and wallet store from a singleton Wallet', async () => {
            sandbox.stub(Client, 'loadFromConfig').withArgs(ccp).returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns('aWallet');
            sandbox.stub(HLFConnectionManager, 'setupWallet');
            sandbox.stub(HLFConnectionManager, 'setupHSM');

            ccp.client['x-hsm'] = {
                library: '/usr/lib/hsm.so',
                pin: 98765,
                slot: 0
            };
            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);

            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.notCalled(HLFConnectionManager.setupWallet);
            sinon.assert.notCalled(mockClient.initCredentialStores);
            sinon.assert.calledOnce(HLFConnectionManager.setupHSM);
            sinon.assert.calledWith(HLFConnectionManager.setupHSM, client, ccp, 'aWallet');
        });

        it('should set up an hsm cryptosuite and wallet store from a Wallet', async () => {
            sandbox.stub(Client, 'loadFromConfig').returns(mockClient);
            sandbox.stub(Wallet, 'getWallet').returns(null);
            sandbox.stub(HLFConnectionManager, 'setupWallet');
            sandbox.stub(HLFConnectionManager, 'setupHSM');

            ccp.client['x-hsm'] = {
                library: '/usr/lib/hsm.so',
                pin: 98765,
                slot: 0
            };

            ccp.wallet = 'anotherWallet';

            let client = await HLFConnectionManager.createClient(ccp, true);
            client.should.be.an.instanceOf(Client);

            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.notCalled(HLFConnectionManager.setupWallet);
            sinon.assert.notCalled(mockClient.initCredentialStores);
            sinon.assert.calledOnce(HLFConnectionManager.setupHSM);
            sinon.assert.calledWith(HLFConnectionManager.setupHSM, client, ccp, 'anotherWallet');
        });


    });

    describe('#setupWallet', () => {
        let mockWallet = sinon.createStubInstance(Wallet);

        it('should create a new wallet proxy', async () => {
            sandbox.stub(Client, 'newCryptoKeyStore').withArgs(HLFWalletProxy, mockWallet).returns('cryptostore');
            let mockCryptoSuite = {
                setCryptoKeyStore: sinon.spy()
            };
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);

            await HLFConnectionManager.setupWallet(mockClient, mockWallet);
            sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
            sinon.assert.calledOnce(mockCryptoSuite.setCryptoKeyStore);
            sinon.assert.calledWith(mockCryptoSuite.setCryptoKeyStore, 'cryptostore');
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, mockCryptoSuite);
        });

        it('should handle an error creating the crypto key store', async () => {
            sandbox.stub(Client, 'newCryptoKeyStore').throws('wow such fail');
            await HLFConnectionManager.setupWallet(mockClient, mockWallet)
                .should.be.rejectedWith(/wow such fail/);
        });

    });

    describe('#setupHSM', () => {

        let ccp;
        beforeEach(() => {
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: 98765432,
                        slot: 0
                    }
                }
            };
        });

        it('should create a new HSM cryptosuite and filesystem state store', async () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            sandbox.stub(HLFConnectionManager, 'getStoreLocation').returns('apath');

            await HLFConnectionManager.setupHSM(mockClient, ccp);

            sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
            sinon.assert.calledWith(Client.newDefaultKeyValueStore, {path: 'apath'});
            sinon.assert.calledOnce(mockClient.setStateStore);
            sinon.assert.calledWith(mockClient.setStateStore, mockStore);
            sinon.assert.calledOnce(Client.newCryptoSuite);
            sinon.assert.calledWith(Client.newCryptoSuite, {
                software: false,
                lib: '/usr/lib/lib.so',
                slot: 0,
                pin: '98765432'
            });
            sinon.assert.calledOnce(mockCryptoSuite.setCryptoKeyStore);
            sinon.assert.calledWith(mockCryptoSuite.setCryptoKeyStore, mockCryptoStore);
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, mockCryptoSuite);
            HLFConnectionManager.clearHSMCache();

        });


        it('should create a new HSM cryptosuite and wallet state store', async () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            sandbox.stub(HLFConnectionManager, 'getStoreLocation').returns('apath');

            await HLFConnectionManager.setupHSM(mockClient, ccp, {});

            sinon.assert.notCalled(Client.newDefaultKeyValueStore);
            sinon.assert.calledOnce(mockClient.setStateStore);
            sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
            sinon.assert.calledOnce(Client.newCryptoSuite);
            sinon.assert.calledWith(Client.newCryptoSuite, {
                software: false,
                lib: '/usr/lib/lib.so',
                slot: 0,
                pin: '98765432'
            });
            sinon.assert.calledOnce(mockCryptoSuite.setCryptoKeyStore);
            sinon.assert.calledWith(mockCryptoSuite.setCryptoKeyStore, mockCryptoStore);
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, mockCryptoSuite);
            HLFConnectionManager.clearHSMCache();

        });


        it('should reuse an existing HSM cryptosuite create a new file system state store', async () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            sandbox.stub(HLFConnectionManager, 'getStoreLocation').returns('apath');

            await HLFConnectionManager.setupHSM(mockClient, ccp);
            let mockClient2 = sinon.createStubInstance(Client);
            mockClient2._network_config = {
                '_network_config': {
                    channels: {
                        composerchannel: {}
                    }
                }
            };
            await HLFConnectionManager.setupHSM(mockClient2, ccp);

            sinon.assert.calledTwice(Client.newDefaultKeyValueStore);
            sinon.assert.calledOnce(mockClient2.setStateStore);
            sinon.assert.calledWith(mockClient2.setStateStore, mockStore);
            sinon.assert.calledOnce(Client.newCryptoSuite);
            sinon.assert.calledOnce(mockCryptoSuite.setCryptoKeyStore);
            sinon.assert.calledOnce(mockClient2.setCryptoSuite);
            sinon.assert.calledWith(mockClient2.setCryptoSuite, mockCryptoSuite);
            HLFConnectionManager.clearHSMCache();

        });

        it('should allow an environment variables to define pkcs config options for HSM cryptosuite', async () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            sandbox.stub(HLFConnectionManager, 'getStoreLocation').returns('apath');

            ccp.client['x-hsm'].library = '{PKCS.LIBRARY}';
            ccp.client['x-hsm'].slot = '{PKCS.SLOT}';
            ccp.client['x-hsm'].pin = '{PKCS.PIN}';

            process.env['PKCS.LIBRARY'] = '/usr/local/lib/another.so';
            process.env['PKCS.SLOT'] = '0';
            process.env['PKCS.PIN'] = 98765432;

            await HLFConnectionManager.setupHSM(mockClient, ccp);

            sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
            sinon.assert.calledWith(Client.newDefaultKeyValueStore, {path: 'apath'});
            sinon.assert.calledOnce(mockClient.setStateStore);
            sinon.assert.calledWith(mockClient.setStateStore, mockStore);
            sinon.assert.calledOnce(Client.newCryptoSuite);
            sinon.assert.calledWith(Client.newCryptoSuite, {
                software: false,
                lib: '/usr/local/lib/another.so',
                slot: 0,
                pin: '98765432'
            });
            sinon.assert.calledOnce(mockCryptoSuite.setCryptoKeyStore);
            sinon.assert.calledWith(mockCryptoSuite.setCryptoKeyStore, mockCryptoStore);
            sinon.assert.calledOnce(mockClient.setCryptoSuite);
            sinon.assert.calledWith(mockClient.setCryptoSuite, mockCryptoSuite);
            HLFConnectionManager.clearHSMCache();
            delete process.env['PKCS.LIBRARY'];
            delete process.env['PKCS.SLOT'];
            delete process.env['PKCS.PIN'];

        });

        it('should handle errors creating a new Cyptosuite', () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').throws(new Error('bad request'));

            HLFConnectionManager.setupHSM(mockClient, ccp).should.be.rejectedWith(/bad request/);

        });

        it('should handle errors creating a new crypto keystore', () => {
            let mockStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockStore);
            sandbox.stub(Client, 'newCryptoKeyStore').throws(new Error('further bad request'));
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);

            HLFConnectionManager.setupHSM(mockClient, ccp).should.be.rejectedWith(/further bad request/);

        });

        it('should handle errors creating a new default keyvalstore', () => {
            let mockCryptoStore = sinon.createStubInstance(KeyValueStore);
            let mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.spy();
            sandbox.stub(Client, 'newDefaultKeyValueStore').rejects(new Error('more bad request'));
            sandbox.stub(Client, 'newCryptoKeyStore').returns(mockCryptoStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);

            HLFConnectionManager.setupHSM(mockClient, ccp).should.be.rejectedWith(/more bad request/);

        });





    });

    describe('#useHSM', () => {
        it('return true if all HSM parameters are configured', () => {
            const ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: 98765432,
                        slot: 0
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.true;
            ccp.client['x-hsm'].pin = '98765432';
            HLFConnectionManager.useHSM(ccp).should.equal.true;
            ccp.client['x-hsm'].slot = '0';
            HLFConnectionManager.useHSM(ccp).should.equal.true;
        });
        it('return false if no HSM parameters are configured', () => {
            let ccp = {};
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: 98765432
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        slot: 0
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        pin: 98765432,
                        slot: 0
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        library: '',
                        pin: 98765432,
                        slot: 0
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: '',
                        slot: 0
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: 98765432,
                        slot: ''
                    }
                }
            };
            HLFConnectionManager.useHSM(ccp).should.equal.false;
        });
    });

    describe('#getStoreLocation', () => {
        it('return return an appropriate location if card name provided', () => {
            const ccp = {
                cardName: 'fredCard'
            };
            HLFConnectionManager.getStoreLocation(ccp).should.contain('fredCard');
        });
        it('return return an appropriate location if no card name provided', () => {
            const ccp = {
            };
            HLFConnectionManager.getStoreLocation(ccp).should.contain('transient');
        });

    });

    describe('#getHSMCryptoSuite', () => {
        let ccp;
        beforeEach(() => {
            ccp = {
                client: {
                    'x-hsm': {
                        library: '/usr/lib/lib.so',
                        pin: 98765432,
                        slot: 0
                    }
                }
            };
        });

        it('should throw an error if the environment variables are not defined', () => {
            ccp.client['x-hsm'].library = '{PKCS_LIBRARY}';
            ccp.client['x-hsm'].slot = '{PKCS_SLOT}';
            ccp.client['x-hsm'].pin = '{PKCS_PIN}';

            process.env.PKCS_LIBRARY = '/usr/local/lib/another.so';
            process.env.PKCS_SLOT = '0';
            process.env.PKCS_PIN = 98765432;

            delete process.env.PKCS_PIN;
            (() => {
                HLFConnectionManager.getHSMCryptoSuite(ccp, 'apath');
            }).should.throw(/HSM pin property/);

            delete process.env.PKCS_SLOT;
            (() => {
                HLFConnectionManager.getHSMCryptoSuite(ccp, 'apath');
            }).should.throw(/HSM slot property/);

            delete process.env.PKCS_LIBRARY;
            (() => {
                HLFConnectionManager.getHSMCryptoSuite(ccp, 'apath');
            }).should.throw(/HSM library property/);
        });

    });

    describe('#createHLFConnection', () => {
        it('should create a new HLFConnection', () => {
            let mockChannel = sinon.createStubInstance(Channel);
            let mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            let connection = HLFConnectionManager.createHLFConnection(connectionManager, 'profile', 'bn', {}, mockClient, mockChannel, mockCAClient);
            connection.should.be.an.instanceOf(HLFConnection);
        });

    });

    describe('#connect', () => {

        let connectOptions;
        let mockCAClient, mockChannel;

        beforeEach(() => {
            connectOptions = {
                cardName: 'admin@hlfv1'
            };
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            sandbox.stub(HLFConnectionManager, 'createHLFConnection').returns();
            mockClient.getCertificateAuthority.returns(mockCAClient);
            mockClient.getMspid.returns('MSP1Org');
            mockChannel = sinon.createStubInstance(Channel);
            mockClient.getChannel.withArgs().returns(mockChannel);
        });

        it('should throw if connectionProfile not specified', () => {
            return connectionManager.connect(null, 'org-acme-biznet', connectOptions)
                .should.be.rejectedWith(/connectionProfile not specified/);
        });

        it('should throw if connectOptions not specified', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', null)
                .should.be.rejectedWith(/connectOptions not specified/);
        });

        it('should create a new connection with a business network identifier', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createHLFConnection);
                    sinon.assert.calledWith(HLFConnectionManager.createHLFConnection, connectionManager, 'hlfabric1', 'org-acme-biznet', connectOptions, mockClient, mockChannel, mockCAClient);
                });
        });

        it('should create a new connection without a business network identifier', () => {
            return connectionManager.connect('hlfabric1', null, connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(HLFConnectionManager.createHLFConnection);
                    sinon.assert.calledWith(HLFConnectionManager.createHLFConnection, connectionManager, 'hlfabric1', null, connectOptions, mockClient, mockChannel, mockCAClient);
                });
        });

    });

    describe('#importIdentity', () => {
        let mockCAClient, mockKeyValueStore, profile, mockCryptoSuite;
        beforeEach(() => {
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            mockCAClient.getCaName.returns('MyCA');
            mockCAClient.enroll.resolves({
                certificate: 'a',
                key: {toBytes: function() {return 'c';}},
                rootCertificate: 'b'
            });

            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            mockClient.getCertificateAuthority.returns(mockCAClient);
            mockClient.initCredentialStores.resolves();
            mockClient.getMspid.returns('MSP1Org');
            mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            mockCryptoSuite.setCryptoKeyStore = sinon.stub();
            sandbox.stub(Client, 'newDefaultKeyValueStore').resolves(mockKeyValueStore);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            mockClient.getCryptoSuite.returns(mockCryptoSuite);

            profile = {
                cardName: 'admin@hlfv1'
            };
        });

        it('should successfully import an identity', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .then(() => {
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

        it('should successfully import an HSM managed identity', () => {
            sandbox.stub(HLFConnectionManager, 'setupHSM').resolves();
            sandbox.stub(HLFConnectionManager, 'useHSM').returns(true);
            mockCryptoSuite.getKey.returns('apkcs11key');

            return connectionManager.importIdentity('connprof1', profile, 'anid', embeddedCert)
                .then(() => {
                    sinon.assert.calledOnce(mockClient.createUser);
                    sinon.assert.calledWith(mockClient.createUser, {
                        username: 'anid',
                        mspid: 'MSP1Org',
                        cryptoContent: {
                            privateKeyObj: 'apkcs11key',
                            signedCertPEM: embeddedCert
                        }
                    });
                });
        });


        it('should throw if connectionProfile not specified', () => {
            return connectionManager.importIdentity()
                .should.be.rejectedWith(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionProfile not a string', () => {
            return connectionManager.importIdentity([])
                .should.be.rejectedWith(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionOptions not specified', () => {
            return connectionManager.importIdentity('connprof1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if connectionOptions not an object', () => {
            return connectionManager.importIdentity('connprof1', 'hlfabric1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if id not specified', () => {
            return connectionManager.importIdentity('connprof1', profile)
                .should.be.rejectedWith(/id not specified or not a string/);
        });

        it('should throw if id not a string', () => {
            return connectionManager.importIdentity('connprof1', profile, [])
                .should.be.rejectedWith(/id not specified or not a string/);
        });

        it('should throw if publicCert not specified', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid')
                .should.be.rejectedWith(/publicCert not specified or not a string/);
        });

        it('should throw if publicCert not a string', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid', [])
                .should.be.rejectedWith(/publicCert not specified or not a string/);
        });

        it('should throw if key not specified', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert')
                .should.be.rejectedWith(/privateKey not specified or not a string/);
        });

        it('should throw if key not a string', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 5)
                .should.be.rejectedWith(/privateKey not specified or not a string/);
        });


        it('should handle an error creating a user', () => {
            mockClient.createUser.rejects('Error','wow such fail');
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/wow such fail/);
        });

    });

    describe('#requestIdentity', () => {
        let profile, mockCAClient, mockCryptoSuite;
        beforeEach(() => {
            mockCryptoSuite = sinon.createStubInstance(CryptoSuite);
            sandbox.stub(Client, 'newCryptoSuite').returns(mockCryptoSuite);
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            mockCAClient.enroll.resolves({
                certificate: 'a',
                key: {toBytes: function() {return 'c';}},
                rootCertificate: 'b'
            });

            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            mockClient.getCertificateAuthority.returns(mockCAClient);

            profile = {
                entry: 'exit'
            };
        });

        it('should successfully request an identity with a named ca server', () => {
            mockCAClient.getCaName.returns('MyCA');
            return connectionManager.requestIdentity('connprof1', profile, 'id', 'secret')
                .then((result) => {
                    result.should.deep.equal({certificate: 'a', key: 'c', rootCertificate: 'b', caName: 'MyCA'});
                    sinon.assert.calledOnce(mockCAClient.enroll);
                    sinon.assert.calledWith(mockCAClient.enroll,{ enrollmentID: 'id', enrollmentSecret: 'secret' });
                });
        });

        it('should successfully request an identity with an unnamed ca server', () => {
            return connectionManager.requestIdentity('connprof1', profile, 'id', 'secret')
                .then((result) => {
                    result.should.deep.equal({certificate: 'a', key: 'c', rootCertificate: 'b', caName: 'default'});
                    sinon.assert.calledOnce(mockCAClient.enroll);
                    sinon.assert.calledWith(mockCAClient.enroll,{ enrollmentID: 'id', enrollmentSecret: 'secret' });
                });
        });

        it('should successfully request an identity managed by HSM', () => {
            sandbox.stub(HLFConnectionManager, 'useHSM').returns(true);
            return connectionManager.requestIdentity('connprof1', profile, 'id', 'secret')
                .then((result) => {
                    result.should.deep.equal({certificate: 'a', rootCertificate: 'b', caName: 'default'});
                    sinon.assert.calledOnce(mockCAClient.enroll);
                    sinon.assert.calledWith(mockCAClient.enroll,{ enrollmentID: 'id', enrollmentSecret: 'secret' });
                });
        });


        it('should throw if connectionProfile not specified', () => {
            return connectionManager.requestIdentity()
                .should.be.rejectedWith(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionProfile not a string', () => {
            return connectionManager.requestIdentity([])
                .should.be.rejectedWith(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionOptions not specified', () => {
            return connectionManager.requestIdentity('connprof1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if connectionOptions not an object', () => {
            return connectionManager.requestIdentity('connprof1', 'hlfabric1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if enrollmentid not specified', () => {
            return connectionManager.requestIdentity('connprof1', profile)
                .should.be.rejectedWith(/enrollmentID not specified/);
        });

        it('should throw if enrollmentid not specified', () => {
            return connectionManager.requestIdentity('connprof1', profile, 'id')
                .should.be.rejectedWith(/enrollmentSecret not specified/);
        });

        it('should handle an error on enroll', () => {
            mockCAClient.enroll.rejects('Error','wow such fail');
            return connectionManager.requestIdentity('connprof1', profile, 'id', 'secret')
                .should.be.rejectedWith(/wow such fail/);
        });
    });

    describe('#exportIdentity', function() {
        const userId = 'Eric';
        const certificate = 'CERTIFICATE';
        const signerKey = 'SIGNER_KEY';
        let profile;
        let mockUser;

        beforeEach(() => {
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            sandbox.stub(HLFConnectionManager, '_setupClientStore').resolves();

            mockUser = sinon.createStubInstance(User);
            const mockIdentity = {
                _certificate: certificate
            };
            const mockSigningIdentity = sinon.createStubInstance(idModule.SigningIdentity);
            const mockSigner = sinon.createStubInstance(idModule.Signer);
            const mockSignerKey = sinon.createStubInstance(api.Key);

            mockUser.getIdentity.returns(mockIdentity);
            mockUser.getSigningIdentity.returns(mockSigningIdentity);
            mockSigningIdentity._signer = mockSigner;
            mockSigner._key = mockSignerKey;
            mockSignerKey.toBytes.returns(signerKey);

            profile = {
                entry: 'exit'
            };
        });

        afterEach(() => {
            sandbox.reset();
        });

        it('should return credentials from Fabric Client for valid user', function() {
            mockClient.getUserContext.withArgs(userId, true).resolves(mockUser);
            return connectionManager.exportIdentity('connprof1', profile, userId)
                .should.eventually.deep.equal({
                    certificate: certificate,
                    privateKey: signerKey
                });
        });

        it('should return credentials from Fabric Client for valid HSM managed user', function() {
            sandbox.stub(HLFConnectionManager, 'useHSM').returns(true);
            mockClient.getUserContext.withArgs(userId, true).resolves(mockUser);
            return connectionManager.exportIdentity('connprof1', profile, userId)
                .should.eventually.deep.equal({
                    certificate: certificate
                });
        });


        it('should return null for invalid user', function() {
            mockClient.getUserContext.withArgs(userId, true).resolves(null);
            return connectionManager.exportIdentity('connprof1', profile, userId)
                .should.eventually.be.null;
        });
    });

    describe('#removeIdentity', () => {
        beforeEach(() => {

        });

        it('should successfully remove an identity from a wallet', () => {
            let walletStub = sinon.createStubInstance(Wallet);
            walletStub.contains.withArgs('anid').resolves(true);
            return connectionManager.removeIdentity('connprof1', {wallet: walletStub}, 'anid')
                .then((deleted) => {
                    sinon.assert.calledOnce(walletStub.remove);
                    sinon.assert.calledWith(walletStub.remove, 'anid');
                    deleted.should.be.true;
                });
        });

        it('should do nothing if identity isn\'t in wallet', () => {
            let walletStub = sinon.createStubInstance(Wallet);
            walletStub.contains.withArgs('anid').resolves(false);
            return connectionManager.removeIdentity('connprof1', {wallet: walletStub}, 'anid')
                .then((deleted) => {
                    sinon.assert.notCalled(walletStub.remove);
                    deleted.should.be.false;
                });
        });

        it('should successfully remove an identity from file system', () => {
            sandbox.stub(fs, 'stat').yields(null, {});
            sandbox.stub(fsextra, 'remove').callsArgWith(1, null);
            sandbox.stub(path, 'join').returns('/mypath/to/stuff');
            return connectionManager.removeIdentity('connprof1', {cardName: 'theuser'}, 'anid')
                .then((deleted) => {
                    //console.log(x);
                    sinon.assert.calledOnce(fs.stat);
                    sinon.assert.calledOnce(fsextra.remove);
                    sinon.assert.calledWith(fsextra.remove, '/mypath/to/stuff');
                    deleted.should.be.true;
                });
        });

        it('should do nothing if identity isn\'t on file system', () => {
            sandbox.stub(fs, 'stat').yields(new Error('does not exist'), null);
            sandbox.stub(fsextra, 'remove');
            return connectionManager.removeIdentity('connprof1', {cardName: 'theUser'}, 'anid')
                .then((deleted) => {
                    deleted.should.be.false;
                    sinon.assert.calledOnce(fs.stat);
                    sinon.assert.notCalled(fsextra.remove);
                });
        });

        it('should throw if no card name or wallet provided', () => {
            return connectionManager.removeIdentity('connprof1', {cardWallet: 'theUser'}, 'anid')
                .should.be.rejectedWith(/Unable to remove identity/);
        });

        it('should throw if connectionProfile not specified', () => {
            return connectionManager.removeIdentity()
                .should.be.rejectedWith(/connectionProfileName not specified or not a string/);
        });

        it('should throw if connectionProfile not a string', () => {
            return connectionManager.removeIdentity([])
                .should.be.rejectedWith(/connectionProfileName not specified or not a string/);
        });

        it('should throw if connectionOptions not specified', () => {
            return connectionManager.removeIdentity('connprof1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if connectionOptions not an object', () => {
            return connectionManager.removeIdentity('connprof1', 'hlfabric1')
                .should.be.rejectedWith(/connectionOptions not specified or not an object/);
        });

        it('should throw if id not specified', () => {
            return connectionManager.removeIdentity('connprof1', {})
                .should.be.rejectedWith(/id not specified or not a string/);
        });

        it('should throw if id not a string', () => {
            return connectionManager.removeIdentity('connprof1', {}, [])
                .should.be.rejectedWith(/id not specified or not a string/);
        });

    });

});
