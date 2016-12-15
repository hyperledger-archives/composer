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

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Connection = require('@ibm/ibm-concerto-common').Connection;
const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const Context = require('@ibm/ibm-concerto-runtime').Context;
const DataService = require('@ibm/ibm-concerto-runtime').DataService;
const Engine = require('@ibm/ibm-concerto-runtime').Engine;
const LoggingService = require('@ibm/ibm-concerto-runtime').LoggingService;
const WebConnection = require('../lib/webconnection');
const WebContainer = require('@ibm/ibm-concerto-runtime-web').WebContainer;
const WebSecurityContext = require('../lib/websecuritycontext');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebConnection', () => {

    let sandbox;
    let mockConnectionManager;
    let mockSecurityContext;
    let connection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        WebConnection.reset();
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(WebSecurityContext);
        connection = new WebConnection(mockConnectionManager, 'devFabric1', 'org.acme.Business');
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

        it('should return a new security context with a null chaincode ID if the business network does not exist', () => {
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(WebSecurityContext);
                    should.equal(securityContext.getChaincodeID(), null);
                });
        });

        it('should return a new security context with a non-null chaincode ID if the business network does exist', () => {
            WebConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(WebSecurityContext);
                    securityContext.getChaincodeID().should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
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
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
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
                    sinon.assert.calledWith(mockSecurityContext.setChaincodeID, '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    WebConnection.getBusinessNetwork('testnetwork', 'devFabric1').should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    WebConnection.getChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f').should.deep.equal({
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

});
