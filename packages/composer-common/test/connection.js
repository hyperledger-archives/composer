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

const BusinessNetworkDefinition = require('../lib/businessnetworkdefinition');
const Connection = require('../lib/connection');
const ConnectionManager = require('../lib/connectionmanager');
const Factory = require('../lib/factory');
const Resource = require('../lib/model/resource');
const SecurityContext = require('../lib/securitycontext');
const Serializer = require('../lib/serializer');
const Util = require('../lib/util');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('Connection', () => {

    let mockConnectionManager;
    let mockSecurityContext;
    let mockBusinessNetworkDefinition;
    let connection;
    let sandbox;
    const startTxId = {idStr:'c89291eb-969f-4b04-b653-82deb5ee0ba1'};
    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        connection = new Connection(mockConnectionManager, 'devFabric1', 'org.acme.Business');
        sandbox.stub(Util, 'createTransactionId').resolves(startTxId);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw if connection manager not specified', () => {
            (() => {
                new Connection(null, 'debFabric1', 'org.acme.Business');
            }).should.throw(/connectionManager not specified/);
        });

        it('should throw if connection profile not specified', () => {
            (() => {
                new Connection(mockConnectionManager, null, 'org.acme.Business');
            }).should.throw(/connectionProfile not specified/);
        });

        it('should set the connection manager', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            c.connectionManager.should.equal(mockConnectionManager);
        });

    });

    describe('#getConnectionManager', () => {

        it('should return the connection manager', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            c.getConnectionManager().should.equal(mockConnectionManager);
        });

    });

    describe('#getIdentifier', () => {

        it('should work with both profile and network', () => {
            let c = new Connection(mockConnectionManager, 'profile', 'network');
            c.getIdentifier().should.equal('network@profile');
        });

        it('should work with just profile', () => {
            let c = new Connection(mockConnectionManager, 'profile', null );
            c.getIdentifier().should.equal('profile');
        });

    });

    describe('#getNativeAPI', () => {

        it('should throw as abstract', () => {
            (() => {
                connection.getNativeAPI();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#disconnect', () => {

        it('should throw as abstract', async () => {
            await connection.disconnect()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#login', () => {

        it('should throw as abstract', async () => {
            await connection.login('id', 'secret')
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#install', () => {

        it('should throw as abstract', async () => {
            await connection.install(mockSecurityContext, mockBusinessNetworkDefinition, { install: 'options' })
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#start', () => {

        it('should throw as abstract', async () => {
            await connection.start(mockSecurityContext, 'org-acme-biznet', '1.0.0', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' })
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#reset', () => {

        it('should throw an error when no name given', async ()=>{
            await connection.reset(mockSecurityContext)
                .should.be.rejectedWith(/not specified/);
        });

        it('should handle wrong network name data', async () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            await connection.reset(mockSecurityContext,'wrong-network')
                .should.be.rejectedWith(/Incorrect Business Network Identifier/);

        });

        it('should handle valid data - 1', async () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            await connection.reset(mockSecurityContext,'acme-network');
            sinon.assert.called(Util.invokeChainCode);
            sinon.assert.called(Util.queryChainCode);
        });

    });

    describe('#upgrade', () => {

        it('should throw as abstract', async () => {
            await connection.upgrade(mockSecurityContext, 'digitalproperty-network', '1.0.1', {dummy: 'dummy'})
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('undeploy', () => {

        it('should throw as abstract', async () => {
            await connection.undeploy(mockSecurityContext, 'name')
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#ping', () => {

        it('should throw as abstract', async () => {
            await connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#queryChainCode', () => {

        it('should throw as abstract', async () => {
            await connection.queryChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#invokeChainCode', () => {

        it('should throw as abstract', async () => {
            await connection.invokeChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#registryCheckRequired', () => {

        it('should return false', () => {
            connection.registryCheckRequired().should.deep.equal(false);
        });

    });

    describe('#createIdentity', () => {

        it('should throw as abstract', async () => {
            await connection.createIdentity(mockSecurityContext, 'user id', { createIdentity: 'options' })
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#list', () => {

        it('should throw as abstract', async () => {
            await connection.list(mockSecurityContext)
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#createTransactionId', () => {

        it('should throw as abstract', async () => {
            await connection.createTransactionId(mockSecurityContext)
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#setLogLevel', () => {

        it('should throw an error when no loglevel given', async () => {
            await connection.setLogLevel(mockSecurityContext)
                .should.be.rejectedWith(/not specified/);
        });

        it('should handle setting to a new level', async () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            await connection.setLogLevel(mockSecurityContext,'debug');
        });

        it('should handle setting to a new level - alternate paths', async () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns(null);
            mockTransaction.timestamp = new Date();

            await connection.setLogLevel(mockSecurityContext,'debug');
        });

    });

});
