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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const Context = require('composer-runtime').Context;
const DataCollection = require('composer-runtime').DataCollection;
const DataService = require('composer-runtime').DataService;
const EmbeddedConnection = require('../lib/embeddedconnection');
const EmbeddedContainer = require('composer-runtime-embedded').EmbeddedContainer;
const EmbeddedSecurityContext = require('../lib/embeddedsecuritycontext');
const Engine = require('composer-runtime').Engine;
const LoggingService = require('composer-runtime').LoggingService;
const uuid = require('uuid');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EmbeddedConnection', () => {

    let sandbox;
    let mockConnectionManager;
    let mockSecurityContext;
    let connection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        EmbeddedConnection.reset();
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(EmbeddedSecurityContext);
        connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1', 'org.acme.Business');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#createContainer', () => {

        it('should create a new container', () => {
            EmbeddedConnection.createContainer().should.be.an.instanceOf(EmbeddedContainer);
        });

    });

    describe('#createEngine', () => {

        it('should create a new engine', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockLoggingService = sinon.createStubInstance(LoggingService);
            mockContainer.getLoggingService.returns(mockLoggingService);
            EmbeddedConnection.createEngine(mockContainer).should.be.an.instanceOf(Engine);
        });

    });

    describe('#constructor', () => {

        it('should construct a new connection', () => {
            connection.should.be.an.instanceOf(Connection);
            connection.dataService.autocommit.should.be.true;
        });

    });

    describe('#disconnect', () => {

        it('should disconnect', () => {
            return connection.disconnect();
        });

    });

    describe('#login', () => {

        beforeEach(() => {
            sandbox.stub(connection, 'testIdentity').resolves();
        });

        it('should return a new security context with a null user ID if the admin ID is specified', () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').resolves();
            return connection.login('admin', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
                    should.equal(securityContext.getUserID(), null);
                    should.equal(securityContext.getChaincodeID(), null);
                    sinon.assert.calledWith(connection.testIdentity, 'admin', 'suchs3cret');
                });
        });

        it('should return a new security context with a null chaincode ID if the business network was not specified', () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').resolves();
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
                    securityContext.getUserID().should.equal('doge');
                    should.equal(securityContext.getChaincodeID(), null);
                    sinon.assert.calledWith(connection.testIdentity, 'doge', 'suchs3cret');
                });
        });

        it('should throw if the business network was specified but it does not exist', () => {
            return connection.login('doge', 'suchs3cret')
                .should.be.rejectedWith(/No chaincode ID found/);
        });

        it('should return a new security context with a non-null chaincode ID if the business network does exist', () => {
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
                    securityContext.getChaincodeID().should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    sinon.assert.calledWith(connection.testIdentity, 'doge', 'suchs3cret');
                });
        });

    });

    describe('#deploy', () => {

        it('should call the init engine method, ping, and store the chaincode ID', () => {
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetwork.toArchive.resolves(Buffer.from('aGVsbG8gd29ybGQ=', 'base64'));
            mockBusinessNetwork.getName.returns('testnetwork');
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockSecurityContext.getUserID.returns('bob1');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);
            mockEngine.init.resolves();
            sinon.stub(connection, 'ping').resolves();
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, sinon.match((context) => {
                        context.should.be.an.instanceOf(Context);
                        context.getIdentityService().getCurrentUserID().should.equal('bob1');
                        return true;
                    }), 'init', ['aGVsbG8gd29ybGQ=']);
                    sinon.assert.calledOnce(connection.ping);
                    sinon.assert.calledOnce(mockSecurityContext.setChaincodeID);
                    sinon.assert.calledWith(mockSecurityContext.setChaincodeID, '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    EmbeddedConnection.getBusinessNetwork('testnetwork', 'devFabric1').should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    EmbeddedConnection.getChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f').should.deep.equal({
                        uuid: '6eeb8858-eced-4a32-b1cd-2491f1e3718f',
                        container: mockContainer,
                        engine: mockEngine
                    });
                });
        });

    });

    describe('#update', () => {

        it('should update the business network', () => {
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetwork.toArchive.resolves(Buffer.from('aGVsbG8gd29ybGQ=', 'base64'));
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sinon.stub(connection, 'invokeChainCode').resolves();
            return connection.update(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.invokeChainCode);
                    sinon.assert.calledWith(connection.invokeChainCode, sinon.match.instanceOf(EmbeddedSecurityContext), 'updateBusinessNetwork', ['aGVsbG8gd29ybGQ=']);
                });
        });

    });

    describe('#undeploy', () => {

        it('should remove the business network', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            return connection.undeploy(mockSecurityContext, 'org.acme.Business')
                .then(() => {
                    should.equal(EmbeddedConnection.getBusinessNetwork('org.acme.Business', 'devFabric1'), undefined);
                });
        });

        it('should handle a duplicate removal of a business network', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            return connection.undeploy(mockSecurityContext, 'org.acme.Business')
                .then(() => {
                    return connection.undeploy(mockSecurityContext, 'org.acme.Business');
                });
        });

    });

    describe('#ping', () => {

        it('should submit a ping query request', () => {
            sinon.stub(connection, 'queryChainCode').resolves(Buffer.from('{"hello":"world"}'));
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.should.deep.equal({
                        hello: 'world'
                    });
                });
        });

    });

    describe('#queryChainCode', () => {

        it('should call the engine query method', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getUserID.returns('bob1');
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.query.resolves({ test: 'data from engine' });
            return connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockEngine.query);
                    sinon.assert.calledWith(mockEngine.query, sinon.match((context) => {
                        context.should.be.an.instanceOf(Context);
                        context.getIdentityService().getCurrentUserID().should.equal('bob1');
                        return true;
                    }), 'testFunction', ['arg1', 'arg2']);
                    result.should.be.an.instanceOf(Buffer);
                    JSON.parse(result.toString()).should.deep.equal({ test: 'data from engine' });
                });
        });

    });

    describe('#invokeChainCode', () => {

        it('should call the engine invoke method', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getUserID.returns('bob1');
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.invoke.resolves({ test: 'data from engine' });
            return connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, sinon.match((context) => {
                        context.should.be.an.instanceOf(Context);
                        context.getIdentityService().getCurrentUserID().should.equal('bob1');
                        return true;
                    }), 'testFunction', ['arg1', 'arg2']);
                    should.equal(result, undefined);
                });
        });

    });

    describe('#getIdentities', () => {

        let mockDataService;
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            connection.dataService = mockDataService = sinon.createStubInstance(DataService);
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);

        });

        it('should create and return the identities collection if it does not exist', () => {
            mockDataService.existsCollection.withArgs('identities').resolves(false);
            mockDataService.createCollection.withArgs('identities').resolves(mockIdentitiesDataCollection);
            return connection.getIdentities()
               .then((identities) => {
                   identities.should.equal(mockIdentitiesDataCollection);
               });
        });

        it('should return the existing identities collection if it already exists', () => {
            mockDataService.existsCollection.withArgs('identities').resolves(true);
            mockDataService.getCollection.withArgs('identities').resolves(mockIdentitiesDataCollection);
            return connection.getIdentities()
               .then((identities) => {
                   identities.should.equal(mockIdentitiesDataCollection);
               });
        });

    });

    describe('#testIdentity', () => {

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should resolve if the user ID is admin', () => {
            return connection.testIdentity('admin', 'password');
        });

        it('should resolve if the user ID exists', () => {
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({ userID: 'doge', userSecret: 'password' });
            return connection.testIdentity('doge', 'password');
        });

        it('should throw an error if the user ID does not exist', () => {
            mockIdentitiesDataCollection.get.withArgs('doge').rejects(new Error('such error'));
            return connection.testIdentity('doge', 'password')
               .should.be.rejectedWith(/such error/);
        });

        it('should throw an error if the user secret does not match', () => {
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({ userID: 'doge', userSecret: 'not correct' });
            return connection.testIdentity('doge', 'password')
               .should.be.rejectedWith(/ does not match/);
        });

    });

    describe('#createIdentity', () => {

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should return the existing identity if it already exists', () => {
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({ userID: 'doge', userSecret: 'password' });
            return connection.createIdentity(mockSecurityContext, 'doge')
               .then((result) => {
                   result.should.be.deep.equal({ userID: 'doge', userSecret: 'password' });
               });
        });

        it('should store a new identity if it does not exists', () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            return connection.createIdentity(mockSecurityContext, 'doge')
               .then((result) => {
                   result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
               });
        });

    });

});
