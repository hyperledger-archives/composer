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
const HLFConnectionManager = require('..');
const HLFConnection = require('../lib/hlfconnection');
const HLFWalletProxy = require('../lib/hlfwalletproxy');
const User = require('fabric-client/lib/User');
const Wallet = require('composer-common').Wallet;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

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
        let mockCAClient, mockWallet, mockChannel;

        beforeEach(() => {
            connectOptions = {
                entry: 'exit'
            };
            mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);
            sandbox.stub(HLFConnectionManager, 'createHLFConnection').returns();
            mockClient.getCertificateAuthority.returns(mockCAClient);
            mockClient.initCredentialStores.resolves();
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

    });

    describe('#importIdentity', () => {
        let mockCAClient, profile;
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



            profile = {
                entry: 'exit'
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

        it('should throw if connectionProfile not specified', () => {
            (() => {
                connectionManager.importIdentity();
            }).should.throw(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionProfile not a string', () => {
            (() => {
                connectionManager.importIdentity([]);
            }).should.throw(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionOptions not specified', () => {
            (() => {
                connectionManager.importIdentity('connprof1');
            }).should.throw(/connectionOptions not specified or not an object/);
        });

        it('should throw if connectionOptions not an object', () => {
            (() => {
                connectionManager.importIdentity('connprof1', 'hlfabric1');
            }).should.throw(/connectionOptions not specified or not an object/);
        });

        it('should throw if id not specified', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile);
            }).should.throw(/id not specified or not a string/);
        });

        it('should throw if id not a string', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile, []);
            }).should.throw(/id not specified or not a string/);
        });

        it('should throw if publicCert not specified', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile, 'anid');
            }).should.throw(/publicCert not specified or not a string/);
        });

        it('should throw if publicCert not a string', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile, 'anid', []);
            }).should.throw(/publicCert not specified or not a string/);
        });

        it('should throw if key not specified', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile, 'anid', 'acert');
            }).should.throw(/privateKey not specified or not a string/);
        });

        it('should throw if key not a string', () => {
            (() => {
                connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 5);
            }).should.throw(/privateKey not specified or not a string/);
        });

        it('should handle an error creating a user', () => {
            mockClient.createUser.rejects('Error','wow such fail');
            return connectionManager.importIdentity('connprof1', profile, 'anid', 'acert', 'akey')
                .should.be.rejectedWith(/wow such fail/);
        });

    });

    describe('#requestIdentity', () => {
        let profile, mockCAClient;
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

            profile = {
                entry: 'exit'
            };
        });

        it('should successfully request an identity with a named ca server', () => {
            profile.ca = {'url': 'http://localhost:7054', 'name': 'aName'};
            return connectionManager.requestIdentity('connprof1', profile, 'id', 'secret')
                .then((result) => {
                    result.should.deep.equal({certificate: 'a', key: 'c', rootCertificate: 'b', caName: 'MyCA'});
                    sinon.assert.calledOnce(mockCAClient.enroll);
                    sinon.assert.calledWith(mockCAClient.enroll,{ enrollmentID: 'id', enrollmentSecret: 'secret' });
                });
        });


        it('should throw if connectionProfile not specified', () => {
            (() => {
                connectionManager.requestIdentity();
            }).should.throw(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionProfile not a string', () => {
            (() => {
                connectionManager.requestIdentity([]);
            }).should.throw(/connectionProfile not specified or not a string/);
        });

        it('should throw if connectionOptions not specified', () => {
            (() => {
                connectionManager.requestIdentity('connprof1');
            }).should.throw(/connectionOptions not specified or not an object/);
        });

        it('should throw if connectionOptions not an object', () => {
            (() => {
                connectionManager.requestIdentity('connprof1', 'hlfabric1');
            }).should.throw(/connectionOptions not specified or not an object/);
        });

        it('should throw if enrollmentid not specified', () => {
            (() => {
                connectionManager.requestIdentity('connprof1', profile);
            }).should.throw(/enrollmentID not specified/);
        });

        it('should throw if enrollmentid not specified', () => {
            (() => {
                connectionManager.requestIdentity('connprof1', profile, 'id');
            }).should.throw(/enrollmentSecret not specified/);
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

        beforeEach(() => {
            sandbox.stub(HLFConnectionManager, 'createClient').returns(mockClient);

            const mockUser = sinon.createStubInstance(User);
            const mockIdentity = {
                _certificate: certificate
            };
            const mockSigningIdentity = sinon.createStubInstance(idModule.SigningIdentity);
            const mockSigner = sinon.createStubInstance(idModule.Signer);
            const mockSignerKey = sinon.createStubInstance(api.Key);

            mockClient.getUserContext.withArgs(userId, true).resolves(mockUser);
            mockClient.initCredentialStores.resolves();
            mockUser.getIdentity.returns(mockIdentity);
            mockUser.getSigningIdentity.returns(mockSigningIdentity);
            mockSigningIdentity._signer = mockSigner;
            mockSigner._key = mockSignerKey;
            mockSignerKey.toBytes.returns(signerKey);

            profile = {
                entry: 'exit'
            };
        });

        it('should return identity credentials from Fabric Client', function() {
            return connectionManager.exportIdentity('connprof1', profile, userId)
                .then((credentials) => {
                    credentials.should.deep.equal({
                        certificate: certificate,
                        privateKey: signerKey
                    });
                });
        });
    });

    //_setupWallet

});
