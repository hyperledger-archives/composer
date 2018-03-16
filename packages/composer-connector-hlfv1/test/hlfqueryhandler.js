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

const HLFQueryHandler = require('../lib/hlfqueryhandler');
const HLFConnection = require('../lib/hlfconnection');
const Peer = require('fabric-client/lib/Peer');
const TransactionID = require('fabric-client/lib/TransactionID');
const Channel = require('fabric-client/lib/Channel');
const FABRIC_CONSTANTS = require('fabric-client/lib/Constants');

const sinon = require('sinon');
const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));

describe('HLFQueryHandler', () => {

    let sandbox;
    let mockPeer1, mockPeer2, mockPeer3;
    let mockConnection, mockTransactionID, mockChannel;
    let queryHandler;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockPeer1 = sinon.createStubInstance(Peer);
        mockPeer1.getName.returns('Peer1');
        mockPeer1.index = 1;
        mockPeer2 = sinon.createStubInstance(Peer);
        mockPeer2.getName.returns('Peer2');
        mockPeer2.index = 2;
        mockPeer3 = sinon.createStubInstance(Peer);
        mockPeer3.getName.returns('Peer3');
        mockPeer3.index = 3;
        mockConnection = sinon.createStubInstance(HLFConnection);
        mockTransactionID = sinon.createStubInstance(TransactionID);
        mockChannel = sinon.createStubInstance(Channel);
        mockConnection.channel = mockChannel;
        mockConnection.getChannelPeersInOrg.withArgs([FABRIC_CONSTANTS.NetworkConfig.CHAINCODE_QUERY_ROLE]).returns([mockPeer2, mockPeer1, mockPeer3]);
        mockChannel.getPeers.returns([mockPeer1, mockPeer2, mockPeer3]);
        queryHandler = new HLFQueryHandler(mockConnection);

    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should create a list of all queryable peers', () => {
            let queryHandler = new HLFQueryHandler(mockConnection);
            queryHandler.allQueryPeers.length.should.equal(3);
            queryHandler.allQueryPeers.should.deep.equal([mockPeer2, mockPeer1, mockPeer3]);
        });
    });

    describe('#queryChaincode', () => {
        beforeEach(() => {
            queryHandler = new HLFQueryHandler(mockConnection);
        });

        it('should not switch to another peer if peer returns a payload which is an error', async () => {
            const response = new Error('my chaincode error');
            mockChannel.queryByChaincode.resolves([response]);
            let qspSpy = sinon.spy(queryHandler, 'querySinglePeer');
            try {
                await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
                should.fail('expected error to be thrown');
            } catch(error) {
                error.message.should.equal('my chaincode error');
                sinon.assert.calledOnce(qspSpy);
                sinon.assert.calledWith(qspSpy, mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
                queryHandler.queryPeerIndex.should.equal(0);
            }

        });


        it('should choose a valid peer', async () => {
            const response = Buffer.from('hello world');
            sandbox.stub(queryHandler, 'querySinglePeer').resolves(response);

            let result = await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledOnce(queryHandler.querySinglePeer);
            sinon.assert.calledWith(queryHandler.querySinglePeer, mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            queryHandler.queryPeerIndex.should.equal(0);
            result.equals(response).should.be.true;
        });

        it('should cache a valid peer and reuse', async () => {
            const response = Buffer.from('hello world');
            sandbox.stub(queryHandler, 'querySinglePeer').resolves(response);

            await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            let result = await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledTwice(queryHandler.querySinglePeer);
            sinon.assert.alwaysCalledWith(queryHandler.querySinglePeer, mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            queryHandler.queryPeerIndex.should.equal(0);
            result.equals(response).should.be.true;
        });

        it('should choose a valid peer if any respond with an error', async () => {
            const response = Buffer.from('hello world');
            const qsp = sandbox.stub(queryHandler, 'querySinglePeer');

            /* this didn't work as the mockPeers look the same
            qsp.withArgs(mockPeer2, 'aTxID', 'myfunc', ['arg1', 'arg2']).rejects(new Error('I failed'));
            qsp.withArgs(mockPeer1, 'aTxID', 'myfunc', ['arg1', 'arg2']).rejects(new Error('I failed'));
            qsp.withArgs(mockPeer3, 'aTxID', 'myfunc', ['arg1', 'arg2']).resolves(response);
            */
            qsp.onFirstCall().rejects(new Error('I failed'));
            qsp.onSecondCall().rejects(new Error('I failed'));
            qsp.onThirdCall().resolves(response);

            let result = await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledThrice(qsp);
            sinon.assert.calledWith(qsp.thirdCall, mockPeer3, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            queryHandler.queryPeerIndex.should.equal(2);
            result.equals(response).should.be.true;
        });

        it('should handle when the last successful peer fails', async () => {
            const response = Buffer.from('hello world');
            const qsp = sandbox.stub(queryHandler, 'querySinglePeer');
            qsp.onFirstCall().resolves(response);
            qsp.onSecondCall().rejects(new Error('I failed'));
            qsp.onThirdCall().resolves(response);

            let result = await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            result.equals(response).should.be.true;
            result = await queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            result.equals(response).should.be.true;
            sinon.assert.calledThrice(queryHandler.querySinglePeer);
            sinon.assert.calledWith(queryHandler.querySinglePeer.firstCall, mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledWith(queryHandler.querySinglePeer.secondCall, mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledWith(queryHandler.querySinglePeer.thirdCall, mockPeer1, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            queryHandler.queryPeerIndex.should.equal(1);
            result.equals(response).should.be.true;

        });

        it('should throw if all peers respond with errors', () => {
            const qsp = sandbox.stub(queryHandler, 'querySinglePeer');
            qsp.onFirstCall().rejects(new Error('I failed 1'));
            qsp.onSecondCall().rejects(new Error('I failed 2'));
            qsp.onThirdCall().rejects(new Error('I failed 3'));

            return queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No peers available.+failed 3/);
        });

        it('should throw if no peers are suitable to query', () => {
            mockConnection.getChannelPeersInOrg.withArgs([FABRIC_CONSTANTS.NetworkConfig.CHAINCODE_QUERY_ROLE]).returns([]);
            queryHandler = new HLFQueryHandler(mockConnection);


            return queryHandler.queryChaincode(mockTransactionID, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No peers have been provided/);
        });
    });

    describe('#querySinglePeer', () => {

        it('should query a single peer', async () => {
            const response = Buffer.from('hello world');
            mockChannel.queryByChaincode.resolves([response]);
            mockConnection.businessNetworkIdentifier = 'org-acme-biznet';
            let result = await queryHandler.querySinglePeer(mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledOnce(mockChannel.queryByChaincode);
            sinon.assert.calledWith(mockChannel.queryByChaincode, {
                chaincodeId: 'org-acme-biznet',
                txId: mockTransactionID,
                fcn: 'myfunc',
                args: ['arg1', 'arg2'],
                targets: [mockPeer2]
            });
            result.equals(response).should.be.true;

        });

        it('should throw if no responses are returned', () => {
            mockChannel.queryByChaincode.resolves([]);
            return queryHandler.querySinglePeer(mockPeer2, 'txid', 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No payloads were returned from the query request/);
        });

        it('should return any responses that are errors', async () => {
            const response = [ new Error('such error') ];
            mockChannel.queryByChaincode.resolves([response]);
            mockConnection.businessNetworkIdentifier = 'org-acme-biznet';
            let result = await queryHandler.querySinglePeer(mockPeer2, mockTransactionID, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledOnce(mockChannel.queryByChaincode);
            sinon.assert.calledWith(mockChannel.queryByChaincode, {
                chaincodeId: 'org-acme-biznet',
                txId: mockTransactionID,
                fcn: 'myfunc',
                args: ['arg1', 'arg2'],
                targets: [mockPeer2]
            });
            result[0].should.be.instanceOf(Error);
            result[0].message.should.equal('such error');
        });

        it('should throw if query request fails', () => {
            mockChannel.queryByChaincode.rejects(new Error('Connect Failed'));
            return queryHandler.querySinglePeer(mockPeer2, 'txid', 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/Connect Failed/);

        });


    });

});
