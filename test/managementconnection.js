/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

//const hfc = require('hfc');
//const hfcChain = hfc.Chain;
//const hfcEventHub = hfc.EventHub;
//const hfcMember = hfc.Member;
//const Util = require('../lib/util');

require('chai').should();
const sinon = require('sinon');

const ManagementConnection = require('..').ManagementConnection;
const BusinessNetworkRegistry = require('../lib/businessnetworkregistry');

describe('ManagementConnection', function () {

    let sandbox;
    //let mockHFC;
    let managementConnection;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        //mockHFC = sandbox.stub(hfc);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should create a new instance', function () {
            managementConnection = new ManagementConnection();
        });
    });

    describe('#connect', function () {

        let connectOptions;
        let enrollmentID = 'WebAppAdmin';
        let enrollmentSecret = 'DJY27pEnl16d';

        beforeEach(function () {
            connectOptions = {
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://localhost:7054',
                peerURL: 'grpc://localhost:7051',
                eventHubURL: 'grpc://localhost:7053'
            };
        });

        it('should not throw when connectOptions specified', function () {
            return managementConnection.connect(connectOptions, enrollmentID, enrollmentSecret)
            .then((businessNetworkRegistry) => {
                (businessNetworkRegistry instanceof BusinessNetworkRegistry).should.be.true;
            });
        });

        it('should throw when connectOptions not specified', function () {
            (function () {
                return managementConnection.connect(null, enrollmentID, enrollmentSecret);
            }).should.throw(/connectOptions not specified/);
        });
    });

/*
        it('should throw when connectOptions.keyValStore not specified', function () {
            (function () {
                delete connectOptions.keyValStore;
                managementConnection.connect(connectOptions);
            }).should.throw(/connectOptions\.keyValStore not specified/);
        });

        it('should throw when connectOptions.membershipServicesURL not specified', function () {
            (function () {
                delete connectOptions.membershipServicesURL;
                managementConnection.connect(connectOptions);
            }).should.throw(/connectOptions\.membershipServicesURL not specified/);
        });

        it('should throw when connectOptions.peerURL not specified', function () {
            (function () {
                delete connectOptions.peerURL;
                managementConnection.connect(connectOptions);
            }).should.throw(/connectOptions\.peerURL not specified/);
        });

        it('should throw when connectOptions.eventHubURL not specified', function () {
            (function () {
                delete connectOptions.eventHubURL;
                managementConnection.connect(connectOptions);
            }).should.throw(/connectOptions\.eventHubURL not specified/);
        });

        it('should create and configure a new hfc.Chain object', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = { };
            mockHFC.getChain.returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return managementConnection
                .connect(connectOptions)
                .then(function () {

                    // Check for the correct interactions with hfc.
                    sinon.assert.calledOnce(mockHFC.getChain);
                    sinon.assert.calledOnce(mockHFC.newFileKeyValStore);
                    sinon.assert.calledOnce(mockChain.setKeyValStore);
                    sinon.assert.calledWith(mockChain.setKeyValStore, mockKeyValStore);
                    sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                    sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL);
                    sinon.assert.calledOnce(mockChain.addPeer);
                    managementConnection.chain.should.equal(mockChain);

                });

        });

        it('should optionally configure the deployWaitTime', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = { };
            mockHFC.getChain.returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.deployWaitTime = 60;
            return managementConnection
                .connect(connectOptions)
                .then(function () {

                    // Check for the correct interactions with hfc.
                    sinon.assert.calledOnce(mockChain.setDeployWaitTime);
                    sinon.assert.calledWith(mockChain.setDeployWaitTime, 60);

                });

        });

        it('should optionally configure the invokeWaitTime', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = { };
            mockHFC.getChain.returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.invokeWaitTime = 99;
            return managementConnection
                .connect(connectOptions)
                .then(function () {

                    // Check for the correct interactions with hfc.
                    sinon.assert.calledOnce(mockChain.setInvokeWaitTime);
                    sinon.assert.calledWith(mockChain.setInvokeWaitTime, 99);

                });

        });

        it('should configure and connect the EventHub', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = { };
            mockHFC.getChain.returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);
            sandbox.stub(process, 'on');

            // Connect to the Hyperledger Fabric using the mock hfc.
            connectOptions.invokeWaitTime = 99;
            return managementConnection
                .connect(connectOptions)
                .then(function () {

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

    describe('#disconnect', function () {

        it('should do nothing if not connected', () => {
            return managementConnection.disconnect();
        });

        it('should disconnect the event hub if connected', () => {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            managementConnection.chain = mockChain;
            return managementConnection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockChain.eventHubDisconnect);
                    return managementConnection.disconnect();
                })
                .then(() => {
                    sinon.assert.calledOnce(mockChain.eventHubDisconnect);
                });

        });

    });
    */
/*
    describe('#login', function () {

        it('should throw when enrollmentID not specified', function () {
            (function () {
                managementConnection.login(null, 'suchsecret');
            }).should.throw(/enrollmentID not specified/);
        });

        it('should throw when enrollmentSecret not specified', function () {
            (function () {
                managementConnection.login('doge', null);
            }).should.throw(/enrollmentSecret not specified/);
        });

        it('should enroll against the Hyperledger Fabric', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockMember = sinon.createStubInstance(hfcMember);
            let mockEventHub = sinon.createStubInstance(hfcEventHub);
            mockChain.enroll.callsArgWith(2, null, mockMember);
            mockChain.getEventHub.returns(mockEventHub);

            // Inject the mock chain into the Concerto instance.
            managementConnection.chain = mockChain;

            // Login to the Hyperledger Fabric using the mock hfc.
            let enrollmentID = 'doge';
            let enrollmentSecret = 'suchsecret';
            return managementConnection
                .login('doge', 'suchsecret')
                .then(function (securityContext) {
                    sinon.assert.calledOnce(mockChain.enroll);
                    sinon.assert.calledWith(mockChain.enroll, enrollmentID, enrollmentSecret);
                    securityContext.should.be.a.instanceOf(SecurityContext);
                    securityContext.getEnrolledMember().should.equal(mockMember);
                    securityContext.getEventHub().should.equal(mockEventHub);
                });

        });

        it('should handle an error from enrolling against the Hyperledger Fabric', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            mockChain.enroll.callsArgWith(2, new Error('failed to login'), null);

            // Inject the mock chain into the Concerto instance.
            managementConnection.chain = mockChain;

            // Login to the Hyperledger Fabric using the mock hfc.
            let enrollmentID = 'doge';
            let enrollmentSecret = 'suchsecret';
            return managementConnection
                .login(enrollmentID, enrollmentSecret)
                .then(function (securityContext) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to login/);
                });

        });

    });

    describe('#deploy', function () {

        it('should throw when securityContext not specified', function () {
            (function () {
                managementConnection.deploy();
            }).should.throw(/securityContext not specified/);
        });

        it('should deploy the Concerto chain-code to the Hyperledger Fabric', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'deployChainCode', function () {
                return Promise.resolve({
                    chaincodeID: 'muchchaincodeID'
                });
            });
            sandbox.stub(managementConnection, 'ping').returns(Promise.resolve());
            let mockModelRegistry = sinon.createStubInstance(ModelRegistry);
            sandbox.stub(ModelRegistry, 'getAllModelRegistries', function () {
                return [mockModelRegistry];
            });
            sandbox.stub(ModelRegistry, 'addModelRegistry').throws();
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries', function () {
                return [mockTransactionRegistry];
            });
            sandbox.stub(TransactionRegistry, 'addTransactionRegistry').throws();

            // Invoke the getAllAssetRegistries function.
            return concerto
                .deploy(securityContext)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.deployChainCode);
                    sinon.assert.calledWith(Util.deployChainCode, securityContext, 'concerto', 'init', ['false']);
                    sinon.assert.calledOnce(concerto.ping);
                    sinon.assert.calledWith(concerto.ping, securityContext);

                    // Check that the security context was updated correctly.
                    securityContext.getChaincodeID().should.equal('muchchaincodeID');

                    // Check that the model registry was found but not created.
                    sinon.assert.calledOnce(ModelRegistry.getAllModelRegistries);
                    sinon.assert.notCalled(ModelRegistry.addModelRegistry);
                    sinon.assert.calledOnce(TransactionRegistry.getAllTransactionRegistries);
                    sinon.assert.notCalled(TransactionRegistry.addTransactionRegistry);

                });

        });

        it('should deploy the Concerto chain-code to the Hyperledger Fabric and set development mode', function () {

            // Set up the responses from the chain-code.
            managementConnection = new managementConnection({
                developmentMode: true
            });
            sandbox.stub(Util, 'deployChainCode', function () {
                return Promise.resolve({
                    chaincodeID: 'muchchaincodeID'
                });
            });
            sandbox.stub(managementConnection, 'ping').returns(Promise.resolve());
            let mockModelRegistry = sinon.createStubInstance(ModelRegistry);
            sandbox.stub(ModelRegistry, 'getAllModelRegistries', function () {
                return [mockModelRegistry];
            });
            sandbox.stub(ModelRegistry, 'addModelRegistry').throws();
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries', function () {
                return [mockTransactionRegistry];
            });
            sandbox.stub(TransactionRegistry, 'addTransactionRegistry').throws();

            // Invoke the getAllAssetRegistries function.
            return concerto
                .deploy(securityContext)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.deployChainCode);
                    sinon.assert.calledWith(Util.deployChainCode, securityContext, 'concerto', 'init', ['true']);

                    // Check that the security context was updated correctly.
                    securityContext.getChaincodeID().should.equal('muchchaincodeID');

                    // Check that the model registry was found but not created.
                    sinon.assert.calledOnce(ModelRegistry.getAllModelRegistries);
                    sinon.assert.notCalled(ModelRegistry.addModelRegistry);
                    sinon.assert.calledOnce(TransactionRegistry.getAllTransactionRegistries);
                    sinon.assert.notCalled(TransactionRegistry.addTransactionRegistry);

                });

        });

    });
    */
});
