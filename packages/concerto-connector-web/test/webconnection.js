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

const BusinessNetworkDefinition = require('@ibm/concerto-common').BusinessNetworkDefinition;
const Connection = require('@ibm/concerto-common').Connection;
const ConnectionManager = require('@ibm/concerto-common').ConnectionManager;
const ConnectionProfileManager = require('@ibm/concerto-common').ConnectionProfileManager;
const ConnectionProfileStore = require('@ibm/concerto-common').ConnectionProfileStore;
const Context = require('@ibm/concerto-runtime').Context;
const DataService = require('@ibm/concerto-runtime').DataService;
const Engine = require('@ibm/concerto-runtime').Engine;
const LoggingService = require('@ibm/concerto-runtime').LoggingService;
const WebConnection = require('../lib/webconnection');
const WebContainer = require('@ibm/concerto-runtime-web').WebContainer;
const WebSecurityContext = require('../lib/websecuritycontext');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebConnection', () => {

    let sandbox;
    let mockConnectionManager;
    let mockConnectionProfileManager;
    let mockConnectionProfileStore;
    let mockSecurityContext;
    let connection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        WebConnection.reset();
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockConnectionManager.getConnectionProfileManager.returns(mockConnectionProfileManager);
        mockConnectionProfileStore = sinon.createStubInstance(ConnectionProfileStore);
        mockConnectionProfileManager.getConnectionProfileStore.returns(mockConnectionProfileStore);
        mockConnectionProfileStore.load.resolves({
            type: 'web',
            networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
        });
        mockConnectionProfileStore.save.resolves();
        mockSecurityContext = sinon.createStubInstance(WebSecurityContext);
        connection = new WebConnection(mockConnectionManager, 'devFabric1', 'org.acme.business');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#createContainer', () => {

        it('should create a new container', () => {
            WebConnection.createContainer().should.be.an.instanceOf(WebContainer);
        });

    });

    describe('#createEngine', () => {

        it('should create a new engine', () => {
            let mockContainer = sinon.createStubInstance(WebContainer);
            let mockLoggingService = sinon.createStubInstance(LoggingService);
            mockContainer.getLoggingService.returns(mockLoggingService);
            WebConnection.createEngine(mockContainer).should.be.an.instanceOf(Engine);
        });

    });

    describe('#constructor', () => {

        it('should construct a new connection', () => {
            connection.should.be.an.instanceOf(Connection);
        });

    });

    describe('#disconnect', () => {

        it('should disconnect', () => {
            return connection.disconnect();
        });

    });

    describe('#login', () => {

        it('should return a new security context with a null chaincode ID if the business network was not specified', () => {
            connection = new WebConnection(mockConnectionManager, 'devFabric1');
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(WebSecurityContext);
                    should.equal(securityContext.getChaincodeID(), null);
                });
        });

        it('should throw if the business network was specified but it does not exist', () => {
            connection.deleteChaincodeID('org.acme.business');
            return connection.login('doge', 'suchs3cret')
                .should.be.rejectedWith(/No chaincode ID found/);
        });

        it('should create a new runtime and return a new security context with a non-null chaincode ID if the business network does exist', () => {
            should.equal(WebConnection.getBusinessNetwork('org.acme.business', 'devFabric1'), undefined);
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(WebSecurityContext);
                    securityContext.getChaincodeID().should.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getBusinessNetwork('org.acme.business', 'devFabric1').should.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getChaincode('133c00a3-8555-4aa5-9165-9de9a8f8a838').should.exist;
                });
        });

        it('should use an existing runtime and return a new security context with a non-null chaincode ID if the business network does exist', () => {
            let mockContainer = sinon.createStubInstance(WebContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            WebConnection.addBusinessNetwork('org.acme.business', 'devFabric1', '133c00a3-8555-4aa5-9165-9de9a8f8a838');
            WebConnection.addChaincode('133c00a3-8555-4aa5-9165-9de9a8f8a838', mockContainer, mockEngine);
            let originalChaincode = WebConnection.getChaincode('133c00a3-8555-4aa5-9165-9de9a8f8a838');
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(WebSecurityContext);
                    securityContext.getChaincodeID().should.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getBusinessNetwork('org.acme.business', 'devFabric1').should.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getChaincode('133c00a3-8555-4aa5-9165-9de9a8f8a838').should.equal(originalChaincode);
                });
        });

    });

    describe('#deploy', () => {

        it('should call the init engine method, ping, and store the chaincode ID', () => {
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            mockBusinessNetwork.toArchive.resolves(Buffer.from('aGVsbG8gd29ybGQ=', 'base64'));
            mockBusinessNetwork.getName.returns('testnetwork');
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            mockContainer.getUUID.returns('133c00a3-8555-4aa5-9165-9de9a8f8a838');
            sandbox.stub(WebConnection, 'createContainer').returns(mockContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(WebConnection, 'createEngine').returns(mockEngine);
            mockEngine.init.resolves();
            sinon.stub(connection, 'ping').resolves();
            return connection.deploy(mockSecurityContext, true, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, sinon.match.instanceOf(Context), 'init', ['aGVsbG8gd29ybGQ=']);
                    sinon.assert.calledOnce(connection.ping);
                    sinon.assert.calledOnce(mockSecurityContext.setChaincodeID);
                    sinon.assert.calledWith(mockSecurityContext.setChaincodeID, '133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getBusinessNetwork('testnetwork', 'devFabric1').should.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
                    WebConnection.getChaincode('133c00a3-8555-4aa5-9165-9de9a8f8a838').should.deep.equal({
                        id: '133c00a3-8555-4aa5-9165-9de9a8f8a838',
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
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            WebConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sinon.stub(connection, 'invokeChainCode').resolves();
            return connection.update(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.invokeChainCode);
                    sinon.assert.calledWith(connection.invokeChainCode, sinon.match.instanceOf(WebSecurityContext), 'updateBusinessNetwork', ['aGVsbG8gd29ybGQ=']);
                });
        });

    });

    describe('#undeploy', () => {

        it('should remove the business network', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            WebConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            return connection.undeploy(mockSecurityContext, 'org.acme.Business')
                .then(() => {
                    should.equal(WebConnection.getBusinessNetwork('org.acme.Business', 'devFabric1'), undefined);
                });
        });

        it('should handle a duplicate removal of a business network', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            WebConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            return connection.undeploy(mockSecurityContext, 'org.acme.Business')
                .then(() => {
                    return connection.undeploy(mockSecurityContext, 'org.acme.Business');
                });
        });

    });

    describe('#ping', () => {

        it('should submit a ping query request', () => {
            sinon.stub(connection, 'queryChainCode').resolves();
            return connection.ping(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                });
        });

    });

    describe('#queryChainCode', () => {

        it('should call the engine query method', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            WebConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.query.resolves({ test: 'data from engine' });
            return connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockEngine.query);
                    sinon.assert.calledWith(mockEngine.query, sinon.match.instanceOf(Context), 'testFunction', ['arg1', 'arg2']);
                    result.should.be.an.instanceOf(Buffer);
                    JSON.parse(result.toString()).should.deep.equal({ test: 'data from engine' });
                });
        });

    });

    describe('#invokeChainCode', () => {

        it('should call the engine invoke method', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockContainer = sinon.createStubInstance(WebContainer);
            mockContainer.getDataService.returns(mockDataService);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            WebConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.invoke.resolves({ test: 'data from engine' });
            return connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, sinon.match.instanceOf(Context), 'testFunction', ['arg1', 'arg2']);
                    should.equal(result, undefined);
                });
        });

    });

    describe('#list', () => {

        it('should list all existing business networks', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: {
                    'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838',
                    'org.acme.biznet2': '6eeb8858-eced-4a32-b1cd-2491f1e3718f'
                }
            });
            return connection.list()
                .should.eventually.be.deep.equal(['org.acme.biznet2', 'org.acme.business']);
        });

        it('should cope with missing business networks', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web'
            });
            return connection.list()
                .should.eventually.be.deep.equal([]);
        });

    });

    describe('#getChaincodeID', () => {

        it('should return the chaincode ID for the specified business network', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
            });
            return connection.getChaincodeID('org.acme.business')
                .should.eventually.equal('133c00a3-8555-4aa5-9165-9de9a8f8a838');
        });

        it('should undefined if the specified business network does not exist', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
            });
            return connection.getChaincodeID('org.acme.biznet2')
                .should.eventually.be.undefined;
        });

        it('should undefined if the profile contains no networks', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web'
            });
            return connection.getChaincodeID('org.acme.biznet2')
                .should.eventually.be.undefined;
        });

    });

    describe('#setChaincodeID', () => {

        it('should set the chaincode ID for the specified business network', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web'
            });
            return connection.setChaincodeID('org.acme.business', '133c00a3-8555-4aa5-9165-9de9a8f8a838')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, 'devFabric1', {
                        type: 'web',
                        networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
                    });
                });
        });

        it('should update the chaincode ID for an existing business network', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
            });
            return connection.setChaincodeID('org.acme.business', '5b8d4830-e348-4a25-9fc4-64b89690a6a3')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, 'devFabric1', {
                        type: 'web',
                        networks: { 'org.acme.business': '5b8d4830-e348-4a25-9fc4-64b89690a6a3' }
                    });
                });
        });

    });

    describe('#deleteChaincodeID', () => {

        it('should delete the chaincode ID for the specified business network', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
            });
            return connection.deleteChaincodeID('org.acme.business')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, 'devFabric1', {
                        type: 'web',
                        networks: { }
                    });
                });
        });

        it('should ignore a missing business network', () => {
            mockConnectionProfileStore.load.withArgs('devFabric1').resolves({
                type: 'web',
                networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
            });
            return connection.deleteChaincodeID('org.acme.biznet2')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionProfileStore.save);
                    sinon.assert.calledWith(mockConnectionProfileStore.save, 'devFabric1', {
                        type: 'web',
                        networks: { 'org.acme.business': '133c00a3-8555-4aa5-9165-9de9a8f8a838' }
                    });
                });
        });

    });

});
