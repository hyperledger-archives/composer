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

const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const fs = require('fs');
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const hfc = require('hfc');
const hfcChain = hfc.Chain;
const HFCConnection = require('../lib/hfcconnection');
const HFCConnectionManager = require('..');
const HFCWalletProxy = require('../lib/hfcwalletproxy');
const Wallet = require('composer-common').Wallet;

require('chai').should();
const sinon = require('sinon');

describe('HFCConnectionManager', () => {

    let sandbox;
    let mockHFC;
    let store;
    let profileManager;
    let connectionManager;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockHFC = sandbox.stub(hfc);
    });

    afterEach(function() {
        Wallet.setWallet(null);
        sandbox.restore();
    });

    describe('#createChain', () => {

        it('should create a new chain isntance', () => {
            const chain = HFCConnectionManager.createChain('testid');
            chain.should.be.an.instanceOf(hfcChain);
            chain.getName().should.equal('testid');
        });

    });

    describe('#connect', function() {

        let connectOptions;

        beforeEach(function() {
            // we recreate everything so the connection pool does not interfere
            // with the tests
            store = new FSConnectionProfileStore(fs);
            profileManager = new ConnectionProfileManager(store);
            connectionManager = new HFCConnectionManager(profileManager);
            profileManager.addConnectionManager('hfc', connectionManager);

            connectOptions = {
                type: 'hfc',
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://membersrvc',
                peerURL: 'grpc://vp0',
                eventHubURL: 'grpc://vp1'
            };
        });

        it('should throw when referencing a missing connection profile', function() {
            return profileManager.connect('missing', 'testnetwork')
                .then(() => {
                    false.should.be.true;
                    return false;
                })
                .catch((err) => {
                    err.message.should.match(/Failed to load connection profile missing/);
                    return true;
                });
        });

        it('should throw when connectOptions.keyValStore not specified', function() {
            delete connectOptions.keyValStore;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager.connect('test', 'testnetwork');
                })
                .then(() => {
                    false.should.be.true;
                    return false;
                })
                .catch((err) => {
                    err.message.should.match(/.+keyValStore not specified/);
                    return true;
                });
        });

        it('should throw when connectOptions.membershipServicesURL not specified', function() {
            delete connectOptions.membershipServicesURL;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager.connect('test', 'testnetwork');
                })
                .then(() => {
                    false.should.be.true;
                    return false;
                })
                .catch((err) => {
                    err.message.should.match(/connectOptions\.membershipServicesURL not specified/);
                    return true;
                });
        });

        it('should throw when connectOptions.peerURL not specified', function() {
            delete connectOptions.peerURL;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager.connect('test', 'testnetwork');
                })
                .then(() => {
                    false.should.be.true;
                    return false;
                })
                .catch((err) => {
                    err.message.should.match(/connectOptions\.peerURL not specified/);
                    return true;
                });
        });

        it('should throw when connectOptions.eventHubURL not specified', function() {
            delete connectOptions.eventHubURL;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager.connect('test', 'testnetwork');
                })
                .then(() => {
                    false.should.be.true;
                    return false;
                })
                .catch((err) => {
                    err.message.should.match(/connectOptions\.eventHubURL not specified/);
                    return true;
                });
        });

        it('should create and configure a new connection without a business network using the key value store', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', null)
                        .then(function(connection) {
                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(HFCConnectionManager.createChain);
                            sinon.assert.calledWith(HFCConnectionManager.createChain, 'test');
                            sinon.assert.calledOnce(mockHFC.newFileKeyValStore);
                            sinon.assert.calledOnce(mockChain.setKeyValStore);
                            sinon.assert.calledWith(mockChain.setKeyValStore, mockKeyValStore);
                            sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                            sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL);
                            sinon.assert.calledOnce(mockChain.addPeer);
                            sinon.assert.calledWith(mockChain.addPeer, connectOptions.peerURL);
                            connection.should.be.an.instanceOf(HFCConnection);
                            connection.chain.should.equal(mockChain);
                            return true;
                        });
                });
        });

        it('should create and configure a new connection to a business network using the key value store', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(function(connection) {
                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(HFCConnectionManager.createChain);
                            sinon.assert.calledWith(HFCConnectionManager.createChain, 'testnetwork@test');
                            sinon.assert.calledOnce(mockHFC.newFileKeyValStore);
                            sinon.assert.calledOnce(mockChain.setKeyValStore);
                            sinon.assert.calledWith(mockChain.setKeyValStore, mockKeyValStore);
                            sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                            sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL);
                            sinon.assert.calledOnce(mockChain.addPeer);
                            sinon.assert.calledWith(mockChain.addPeer, connectOptions.peerURL);
                            connection.should.be.an.instanceOf(HFCConnection);
                            connection.chain.should.equal(mockChain);
                            return true;
                        });
                });
        });

        it('should create and configure a new connection using the specified wallet', function() {

            // Set the wallet singleton.
            let mockWallet = sinon.createStubInstance(Wallet);

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork', { wallet: mockWallet })
                        .then(function(connection) {
                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setKeyValStore);
                            sinon.assert.calledWith(mockChain.setKeyValStore, sinon.match.instanceOf(HFCWalletProxy));
                        });
                });
        });

        it('should create and configure a new connection using the singleton wallet', function() {

            // Set the wallet singleton.
            let mockWallet = sinon.createStubInstance(Wallet);
            Wallet.setWallet(mockWallet);

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(function(connection) {
                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setKeyValStore);
                            sinon.assert.calledWith(mockChain.setKeyValStore, sinon.match.instanceOf(HFCWalletProxy));
                        });
                });
        });

        it('should optionally configure the deployWaitTime', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.deployWaitTime = 60;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(() => {
                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setDeployWaitTime);
                            sinon.assert.calledWith(mockChain.setDeployWaitTime, 60);
                            return true;
                        });
                });
        });

        it('should optionally configure the invokeWaitTime', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.invokeWaitTime = 99;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(() => {

                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setInvokeWaitTime);
                            sinon.assert.calledWith(mockChain.setInvokeWaitTime, 99);
                            return true;
                        });
                });
        });

        it('should configure and connect the EventHub', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);
            sandbox.stub(process, 'on');

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.invokeWaitTime = 99;
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(() => {

                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.eventHubConnect);
                            sinon.assert.calledWith(mockChain.eventHubConnect, 'grpc://vp1');

                            // Check that a process.on('exit') callback was added.
                            sinon.assert.calledOnce(process.on);
                            sinon.assert.calledWith(process.on, 'exit', sinon.match((fn) => {
                                sinon.assert.notCalled(mockChain.eventHubDisconnect);
                                fn();
                                sinon.assert.calledOnce(mockChain.eventHubDisconnect);
                                fn();
                                sinon.assert.calledOnce(mockChain.eventHubDisconnect);
                                return true;
                            }));
                        });
                });
        });

        it('should optionally configure the certificate', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.certificate = '=== such certificate ===';
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(() => {

                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                            sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL, { pem: '=== such certificate ===\n' });
                            sinon.assert.calledOnce(mockChain.addPeer);
                            sinon.assert.calledWith(mockChain.addPeer, connectOptions.peerURL, { pem: '=== such certificate ===\n' });
                            sinon.assert.calledOnce(mockChain.eventHubConnect);
                            sinon.assert.calledWith(mockChain.eventHubConnect, 'grpc://vp1', { pem: '=== such certificate ===\n' });
                            return true;

                        });
                });
        });

        it('should ignore a certificate that is just whitespace', function() {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = {};
            sandbox.stub(HFCConnectionManager, 'createChain').returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.certificate = '     ';
            return store.save('test', connectOptions)
                .then(() => {
                    return profileManager
                        .connect('test', 'testnetwork')
                        .then(() => {

                            // Check for the correct interactions with hfc.
                            sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                            sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL, { });
                            sinon.assert.calledOnce(mockChain.addPeer);
                            sinon.assert.calledWith(mockChain.addPeer, connectOptions.peerURL, { });
                            sinon.assert.calledOnce(mockChain.eventHubConnect);
                            sinon.assert.calledWith(mockChain.eventHubConnect, 'grpc://vp1', { });
                            return true;

                        });
                });
        });

    });

});
