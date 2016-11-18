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

const hfc = require('hfc');
const hfcChain = hfc.Chain;
const HFCConnection = require('../lib/hfcconnection');
const HFCConnectionManager = require('..');
const sinon = require('sinon');

require('chai').should();

describe('HFCConnectionManager', () => {

    let sandbox;
    let connectionManager;
    let mockHFC;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        connectionManager = new HFCConnectionManager();
        mockHFC = sandbox.stub(hfc);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#connect', function () {

        let connectOptions;

        beforeEach(function () {
            connectOptions = {
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://membersrvc',
                peerURL: 'grpc://vp0',
                eventHubURL: 'grpc://vp1'
            };
        });

        it('should throw when connectOptions not specified', function () {
            (function () {
                connectionManager.connect();
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw when connectOptions.keyValStore not specified', function () {
            (function () {
                delete connectOptions.keyValStore;
                connectionManager.connect(connectOptions);
            }).should.throw(/connectOptions\.keyValStore not specified/);
        });

        it('should throw when connectOptions.membershipServicesURL not specified', function () {
            (function () {
                delete connectOptions.membershipServicesURL;
                connectionManager.connect(connectOptions);
            }).should.throw(/connectOptions\.membershipServicesURL not specified/);
        });

        it('should throw when connectOptions.peerURL not specified', function () {
            (function () {
                delete connectOptions.peerURL;
                connectionManager.connect(connectOptions);
            }).should.throw(/connectOptions\.peerURL not specified/);
        });

        it('should throw when connectOptions.eventHubURL not specified', function () {
            (function () {
                delete connectOptions.eventHubURL;
                connectionManager.connect(connectOptions);
            }).should.throw(/connectOptions\.eventHubURL not specified/);
        });

        it('should create and configure a new connection', function () {

            // Set up the hfc mock.
            let mockChain = sinon.createStubInstance(hfcChain);
            let mockKeyValStore = { };
            mockHFC.getChain.returns(mockChain);
            mockHFC.newFileKeyValStore.returns(mockKeyValStore);

            // Connect to the Hyperledger Fabric using the mock hfc.
            return connectionManager
                .connect(connectOptions)
                .then(function (connection) {

                    // Check for the correct interactions with hfc.
                    sinon.assert.calledOnce(mockHFC.getChain);
                    sinon.assert.calledOnce(mockHFC.newFileKeyValStore);
                    sinon.assert.calledOnce(mockChain.setKeyValStore);
                    sinon.assert.calledWith(mockChain.setKeyValStore, mockKeyValStore);
                    sinon.assert.calledOnce(mockChain.setMemberServicesUrl);
                    sinon.assert.calledWith(mockChain.setMemberServicesUrl, connectOptions.membershipServicesURL);
                    sinon.assert.calledOnce(mockChain.addPeer);
                    connection.should.be.an.instanceOf(HFCConnection);
                    connection.chain.should.equal(mockChain);

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
            return connectionManager
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
            return connectionManager
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
            return connectionManager
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

});
