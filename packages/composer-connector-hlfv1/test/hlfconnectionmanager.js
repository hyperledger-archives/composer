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
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const fs = require('fs');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('HLFConnectionManager');

describe('HLFConnectionManager', () => {

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
        Wallet.setWallet(null);
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

        it('should create a new client', () => {
            sandbox.stub(Client, 'loadFromConfig').returns(mockClient);
            const dummyProfile = {
                'x-type': 'dummy'
            };
            let client = HLFConnectionManager.createClient(dummyProfile);
            sinon.assert.calledOnce(Client.loadFromConfig);
            sinon.assert.calledWith(Client.loadFromConfig, dummyProfile);
            client.should.be.an.instanceOf(Client);
        });

        it('should handle an error from loadFromConfig', () => {
            sandbox.stub(Client, 'loadFromConfig').throws(new Error('loaderror'));
            const dummyProfile = {
                'x-type': 'dummy'
            };
            (() => {
                HLFConnectionManager.createClient(dummyProfile);
            }).should.throw(/loaderror/);
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
        let mockCAClient, mockWallet, mockChannel, mockKeyValueStore;

        beforeEach(() => {
            connectOptions = {
                cardName: 'admin@hlfv1'
            };
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            sandbox.stub(HLFConnectionManager, 'createHLFConnection').returns();
            mockClient.getCertificateAuthority.returns(mockCAClient);
            //mockClient.initCredentialStores.resolves();
            mockClient.getMspid.returns('MSP1Org');
            mockClient._network_config = {
                '_network_config': {
                    channels: {
                        composerchannel: {}
                    }
                }
            };
            mockChannel = sinon.createStubInstance(Channel);
            mockClient.getChannel.withArgs('composerchannel').returns(mockChannel);
            //sandbox.stub(HLFConnectionManager, '_setupClientStore').resolves();

            mockKeyValueStore = sinon.createStubInstance(KeyValueStore);
            sandbox.stub(Client, 'newDefaultKeyValueStore').withArgs(sinon.match.has('path', sinon.match.string)).resolves(mockKeyValueStore);
            mockWallet = sinon.createStubInstance(Wallet);
        });

        it('should throw if connectionProfile not specified', () => {
            return connectionManager.connect(null, 'org-acme-biznet', connectOptions)
                .should.be.rejectedWith(/connectionProfile not specified/);
        });

        it('should throw if connectOptions not specified', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', null)
                .should.be.rejectedWith(/connectOptions not specified/);
        });

        it('should throw if none of wallet or cardName are specified', () => {
            delete connectOptions.wallet;
            delete connectOptions.cardName;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .should.be.rejectedWith(/No wallet or card name has been specified/);
        });

        it('should not throw if wallet specified but cardName is not', () => {
            connectOptions.wallet = mockWallet;
            delete connectOptions.cardName;
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
        });

        it('should not throw if cardName specified but wallet is not', () => {
            delete connectOptions.wallet;
            connectOptions.cardName = 'CONGA_CARD';
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions);
        });

        //TODO: should throw if wallet not of the right type.

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

        it('should configure a default key value store', () => {
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
                    sinon.assert.calledWith(Client.newDefaultKeyValueStore, sinon.match.has('path', sinon.match(/composer\/client-data\/admin@hlfv1/)));
                    sinon.assert.calledWith(mockClient.setStateStore, mockKeyValueStore);
                });
        });

        it('should handle an error creating a store using keyValStore', () => {
            Client.newDefaultKeyValueStore.reset();
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

        it('should use specified wallet in preference to cardName and keyValStore', () => {
            connectOptions.cardName = 'CONGA_CARD';
            connectOptions.keyValStore = 'KEY_VAL_STORE';
            connectOptions.wallet = mockWallet;
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

        it('should use singleton wallet in preference to cardName and keyValStore', () => {
            Wallet.setWallet(mockWallet);
            connectOptions.cardName = 'CONGA_CARD';
            connectOptions.keyValStore = 'KEY_VAL_STORE';
            return connectionManager.connect('hlfabric1', 'org-acme-biznet', connectOptions)
                .then((connection) => {
                    sinon.assert.calledWith(mockClient.setStateStore, sinon.match.instanceOf(HLFWalletProxy));
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

            profile = {
                cardName: 'admin@hlfv1'
            };
        });

        it('should successfully import an identity', () => {
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .then(() => {
                    sinon.assert.calledOnce(Client.newDefaultKeyValueStore);
                    sinon.assert.calledWith(Client.newDefaultKeyValueStore, sinon.match.has('path', sinon.match(/composer\/client-data\/admin@hlfv1/)));
                    sinon.assert.calledOnce(mockClient.setStateStore);
                    sinon.assert.calledWith(mockClient.setStateStore, mockKeyValueStore);
                    sinon.assert.calledOnce(Client.newCryptoSuite);
                    sinon.assert.calledOnce(mockClient.setCryptoSuite);
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

        it('should throw if wallet or cardName not specified', () => {
            delete profile.wallet;
            delete profile.cardName;
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/No wallet or card name has been specified/);
        });

        it('should handle an error creating a default key value store', () => {
            Client.newDefaultKeyValueStore.rejects('Error','wow such fail');
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/wow such fail/);
        });

        it('should handle an error creating a new cryptosuite', () => {
            mockClient.setCryptoSuite.throws(new Error('another fail'));
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/another fail/);
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

            //mockClient.getUserContext.withArgs(userId, true).resolves(mockUser);
            //mockClient.initCredentialStores.resolves();
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
