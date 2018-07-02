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

const { BusinessNetworkDefinition, Certificate, Connection, ConnectionManager } = require('composer-common');
const { Context, DataCollection, DataService, Engine, LoggingService, InstalledBusinessNetwork } = require('composer-runtime');
const EmbeddedContainer = require('composer-runtime-embedded').EmbeddedContainer;
const EmbeddedConnection = require('../lib/embeddedconnection');
const EmbeddedSecurityContext = require('../lib/embeddedsecuritycontext');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('EmbeddedConnection', () => {
    const sandbox = sinon.sandbox.create();
    let mockConnectionManager;
    let mockSecurityContext;
    let identity;
    let connection;
    let businessNetworkDefinition;

    beforeEach(async () => {

        EmbeddedConnection.reset();

        // Use a real business network rather than mocking the world
        let content = fs.readFileSync(path.resolve('./test/data/digitalPropertyNetwork.bna'));
        businessNetworkDefinition = await BusinessNetworkDefinition.fromArchive(content);

        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(EmbeddedSecurityContext);
        identity = {
            identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
            name: 'bob1',
            issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
            secret: 'suchsecret',
            certificate: '',
            imported: false,
            options: {
                issuer: true
            }
        };
        mockSecurityContext.getIdentity.returns(identity);
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

    describe('#createTransactionId', () => {
        it('should just return null ', ()=>{
            connection.createTransactionId(mockSecurityContext).should.eventually.be.null;
        });
    });

    describe('#login', () => {

        beforeEach(() => {
        });

        it('should return a new security context with a null chaincode ID if the business network was not specified', async () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').resolves(identity);
            let securityContext = await connection.login('doge', 'suchs3cret');
            securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
            securityContext.getIdentity().should.deep.equal(identity);
            should.equal(securityContext.getChaincodeID(), null);
            sinon.assert.calledWith(connection.testIdentity, 'doge', 'suchs3cret');
        });

        it('should throw if the business network was specified but it does not exist', () => {
            sandbox.stub(connection, 'testIdentity').resolves();
            return connection.login('doge', 'suchs3cret')
                .should.be.rejectedWith(/No chaincode ID found/);
        });

        it('should return a new security context with a non-null chaincode ID if the business network does exist', async () => {
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            identity.imported = true;
            sandbox.stub(connection, 'testIdentity').resolves(identity);
            let securityContext = await connection.login('doge', 'suchs3cret');
            securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
            securityContext.getChaincodeID().should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sinon.assert.calledWith(connection.testIdentity, 'doge', 'suchs3cret');
        });

        it('should simulate enrolment and import of credentials if no credentials imported and has a business network', async () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1', 'org.acme.Business');
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            let updatedIdentity = {};
            Object.assign(updatedIdentity, identity);
            updatedIdentity.imported = true;
            let mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'testIdentity').resolves(identity);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves(identity);
            await connection.login('doge', 'suchs3cret');
            sinon.assert.calledOnce(mockIdentitiesDataCollection.update);
            sinon.assert.calledWith(mockIdentitiesDataCollection.update.firstCall, 'doge', updatedIdentity);
            //sinon.assert.calledWith(mockIdentitiesDataCollection.update.secondCall, updatedIdentity.identifier, updatedIdentity);
        });

        it('should not simulate enrolment if credentials already imported', async () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            let updatedIdentity = {};
            Object.assign(updatedIdentity, identity);
            updatedIdentity.imported = true;
            let mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'testIdentity').resolves(updatedIdentity);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves(updatedIdentity);
            await connection.login('doge', 'suchs3cret');
            sinon.assert.notCalled(mockIdentitiesDataCollection.update);
        });


    });

    describe('#install', ()  => {
        it('should set the business network definition for the connection and return a resolved promise', async () => {
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            EmbeddedConnection.getInstalledChaincode(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion()).should.equal(businessNetworkDefinition);
        });
    });

    describe('#start', () => {
        it('should throw an error if chaincode has not been installed', () => {
            connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' }).should.be.rejectedWith(/has not been installed/);
        });

        it('should call the init engine method, ping, and store the chaincode ID', async () => {
            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            // Mock a securty context
            mockSecurityContext.getIdentity.returns(identity);

            // Mock the result of calling ping
            sinon.stub(connection, 'ping').resolves();

            // Do the necessary install
            await connection.install(mockSecurityContext, businessNetworkDefinition);

            // Test the function
            await connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' });

            // Validate the behaviour
            sinon.assert.calledOnce(mockEngine.init);
            sinon.assert.calledWith(mockEngine.init, sinon.match.instanceOf(Context), 'start', ['{"start":"json"}']);
            EmbeddedConnection.getBusinessNetwork(businessNetworkDefinition.getName(), 'devFabric1').should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            const chaincode = EmbeddedConnection.getChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // can't use deep equal here due to a cyclic object which causes a hang.
            chaincode.uuid.should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            chaincode.container.should.equal(mockContainer);
            chaincode.engine.should.equal(mockEngine);
            chaincode.installedBusinessNetwork.should.be.instanceOf(InstalledBusinessNetwork);

        });
    });

    describe('#upgrade', () => {
        it('should throw an error if chaincode has not been installed', () => {
            connection.upgrade(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion()).should.be.rejectedWith(/has not been installed/);
        });

        it('should throw an error if chaincode has not been started', () => {
            EmbeddedConnection.addInstalledChaincode(businessNetworkDefinition);
            connection.upgrade(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion()).should.be.rejectedWith(/has not been started/);
        });

        it('should upgrade the chaincode', async () => {
            EmbeddedConnection.addInstalledChaincode(businessNetworkDefinition);
            EmbeddedConnection.addBusinessNetwork('digitalproperty-network', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            const mockInstalledBusinessNetwork = sinon.createStubInstance(InstalledBusinessNetwork);
            sandbox.stub(InstalledBusinessNetwork, 'newInstance').resolves(mockInstalledBusinessNetwork);

            // put something weird for installedBusinessNetwork so we can detect it has changed.
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine, 'orgInstalledBusinessNetwork');

            // Mock a securty context
            mockSecurityContext.getIdentity.returns(identity);

            await connection.upgrade(mockSecurityContext, businessNetworkDefinition.getName(),
            businessNetworkDefinition.getVersion());

            sinon.assert.calledOnce(mockEngine.init);
            sinon.assert.calledWith(mockEngine.init, sinon.match.instanceOf(Context), 'upgrade');
            const chaincode = EmbeddedConnection.getChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // can't use deep equal here due to a cyclic object which causes a hang.
            chaincode.uuid.should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            chaincode.container.should.equal(mockContainer);
            chaincode.engine.should.equal(mockEngine);
            chaincode.installedBusinessNetwork.should.equal(mockInstalledBusinessNetwork);
        });


    });

    describe('#ping', () => {

        it('should submit a ping query request', async () => {
            sinon.stub(connection, 'queryChainCode').resolves(Buffer.from('{"hello":"world"}'));
            let result = await connection.ping(mockSecurityContext);
            sinon.assert.calledOnce(connection.queryChainCode);
            sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
            result.should.deep.equal({ hello: 'world' });
        });

    });

    describe('#queryChainCode', () => {
        it('should throw an error if no business network defined', () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No business network/);
        });

        it('should call the engine query method that does not return data', async () => {
            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            mockEngine.query.resolves();
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            // Mock a security context
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // do required install/start
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            await connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' });

            // run test
            let result = await connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2']);

            // validate behaviour
            sinon.assert.calledOnce(mockEngine.query);
            sinon.assert.calledWith(mockEngine.query, sinon.match((context) => {
                context.should.be.an.instanceOf(Context);
                context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
                return true;
            }), 'testFunction', ['arg1', 'arg2']);
            should.equal(result, null);
        });

        it('should call the engine query method that returns data', async () => {
            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            mockEngine.query.resolves({ test: 'data from engine' });
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            // Mock a security context
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // do required install/start
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            await connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' });

            // run test
            let result = await connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2']);

            // validate behaviour
            sinon.assert.calledOnce(mockEngine.query);
            sinon.assert.calledWith(mockEngine.query, sinon.match((context) => {
                context.should.be.an.instanceOf(Context);
                context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
                return true;
            }), 'testFunction', ['arg1', 'arg2']);
            result.should.be.an.instanceOf(Buffer);
            JSON.parse(result.toString()).should.deep.equal({ test: 'data from engine' });
        });
    });

    describe('#invokeChainCode', () => {

        it('should throw an error if no business network defined', () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No business network/);
        });

        it('should call the engine invoke method that does not return data', async () => {

            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            mockEngine.invoke.resolves();
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            // Mock a security context
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // do required install/start
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            await connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' });

            // test the function
            let result = await connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2']);

            // validate the behaviour
            sinon.assert.calledOnce(mockEngine.invoke);
            sinon.assert.calledWith(mockEngine.invoke, sinon.match((context) => {
                context.should.be.an.instanceOf(Context);
                context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
                return true;
            }), 'testFunction', ['arg1', 'arg2']);
            should.equal(result, null);
        });

        it('should call the engine invoke method that does return data', async () => {

            // Mock a container
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);

            // Mock an engine
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            mockEngine.init.resolves();
            mockEngine.invoke.resolves({ test: 'data from engine' });
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);

            // Mock a security context
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');

            // do required install/start
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            await connection.start(mockSecurityContext,
                businessNetworkDefinition.getName(),
                businessNetworkDefinition.getVersion(),
                '{"start":"json"}',
                { start: 'options' });

            // test the function
            let result = await connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2']);

            // validate the behaviour
            sinon.assert.calledOnce(mockEngine.invoke);
            sinon.assert.calledWith(mockEngine.invoke, sinon.match((context) => {
                context.should.be.an.instanceOf(Context);
                context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
                return true;
            }), 'testFunction', ['arg1', 'arg2']);
            JSON.parse(result.toString()).should.deep.equal({ test: 'data from engine' });
        });
    });

    describe('#getIdentities', () => {

        let mockDataService;
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            connection.dataService = mockDataService = sinon.createStubInstance(DataService);
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
        });

        it('should ensure and return the identities collection', () => {
            mockDataService.ensureCollection.withArgs('identities').resolves(mockIdentitiesDataCollection);
            return connection.getIdentities()
               .then((identities) => {
                   identities.should.equal(mockIdentitiesDataCollection);
               });
        });

    });

    describe('#getIdentity', () => {

        const adminIdentity = {
            identifier: '',
            name: 'admin',
            issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
            secret: 'adminpw',
            certificate: [
                '-----BEGIN CERTIFICATE-----',
                'YWRtaW4=',
                '-----END CERTIFICATE-----'
            ].join('\n').concat('\n'),
            imported: false,
            options: {
                issuer: true
            }
        };

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should create the hardcoded admin identity if it does not exist', () => {
            mockIdentitiesDataCollection.get.withArgs('admin').rejects(new Error('such error'));
            sinon.stub(connection, '_createAdminIdentity').resolves(adminIdentity);
            return connection.getIdentity('admin')
                .should.eventually.be.deep.equal(adminIdentity);
        });

        it('should return the hardcoded admin identity if it already exists', () => {
            mockIdentitiesDataCollection.get.withArgs('admin').resolves(adminIdentity);
            sinon.stub(connection, '_createAdminIdentity').rejects(new Error('such error'));
            return connection.getIdentity('admin')
                .should.eventually.be.deep.equal(adminIdentity);
        });

        it('should return the specified identity', () => {
            mockIdentitiesDataCollection.get.withArgs('bob1').resolves(identity);
            return connection.getIdentity('bob1')
               .should.eventually.be.equal(identity);
        });

        it('should rethrow an identity error if not for admin', () => {
            mockIdentitiesDataCollection.get.withArgs('bob1').rejects(new Error('such error'));
            return connection.getIdentity('bob1')
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#_createAdminIdentity', () => {

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should store a new identity if it does not exists', async () => {
            await connection._createAdminIdentity();
            sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('admin');
            //const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
            const adminIdentityIdentifier = adminIdentity1.identifier;
            const certificateObj = new Certificate(adminIdentity1.certificate);
            certificateObj.getIdentifier().should.equal(adminIdentityIdentifier);
            certificateObj.getIssuer().should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            certificateObj.getName().should.equal('admin');
            certificateObj.getPublicKey().should.be.a('string');
            adminIdentity1.identifier.should.equal(adminIdentityIdentifier);
            adminIdentity1.issuer.should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            adminIdentity1.name.should.equal('admin');
            adminIdentity1.secret.should.equal('adminpw');
            adminIdentity1.imported.should.be.false;
            adminIdentity1.options.issuer.should.be.true;
            //const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            //adminIdentity1.should.deep.equal(adminIdentity2);
        });

    });

    describe('#testIdentity', () => {

        it('should not check the secret if the name is admin', () => {
            const identity = {
                identifier: '',
                name: 'admin',
                issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                secret: 'adminpw',
                imported: false
            };
            sinon.stub(connection, 'getIdentity').resolves(identity);
            return connection.testIdentity('admin', 'blahblah')
                .should.eventually.be.equal(identity);
        });

        it('should throw if the secret does not match', () => {
            sinon.stub(connection, 'getIdentity').resolves(identity);
            return connection.testIdentity('bob1', 'blahblah')
                .should.be.rejectedWith(/The secret blahblah specified for the identity bob1 does not match the stored secret suchsecret/);
        });

        it('should not throw if the secret does match', () => {
            sinon.stub(connection, 'getIdentity').resolves(identity);
            return connection.testIdentity('bob1', 'suchsecret')
                .should.eventually.be.equal(identity);
        });

        it('should not throw if the secret does match and the identity was imported', () => {
            const identity = {
                identifier: '',
                name: 'admin',
                issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                secret: 'adminpw',
                imported: true
            };
            sinon.stub(connection, 'getIdentity').resolves(identity);
            return connection.testIdentity('bob1', 'suchsecret')
                .should.eventually.be.equal(identity);
        });

    });

    describe('#registryCheckRequired', () => {
        it('should return true', () => {
            connection.registryCheckRequired().should.deep.equal(true);
        });
    });

    describe('#createIdentity', () => {

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should return the existing identity if it already exists', async () => {
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({
                certificate: '',
                identifier: '8f00d1b8319abc0ad87ccb6c1baae0a54c406c921c01e1ed165c33b93f3e5b6a',
                issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                name: 'doge',
                secret: 'f892c30a'
            });
            const result = await connection.createIdentity(mockSecurityContext, 'doge');
            sinon.assert.notCalled(mockIdentitiesDataCollection.add);
            result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
        });

        it('should store a new identity if it does not exists', async () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            const result = await connection.createIdentity(mockSecurityContext, 'doge');
            sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('doge');
            //const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
            const adminIdentityIdentifier = adminIdentity1.identifier;
            const certificateObj = new Certificate(adminIdentity1.certificate);
            certificateObj.getIdentifier().should.equal(adminIdentityIdentifier);
            certificateObj.getIssuer().should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            certificateObj.getName().should.equal('doge');
            certificateObj.getPublicKey().should.be.a('string');
            adminIdentity1.identifier.should.equal(adminIdentityIdentifier);
            adminIdentity1.issuer.should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            adminIdentity1.name.should.equal('doge');
            adminIdentity1.secret.should.equal('f892c30a');
            adminIdentity1.imported.should.be.false;
            //const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            //adminIdentity1.should.deep.equal(adminIdentity2);
            result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
        });

        it('should store a new identity along with additional options if it does not exists', async () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            const result = await connection.createIdentity(mockSecurityContext, 'doge', { issuer: true });
            sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('doge');
            //const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
            const adminIdentityIdentifier = adminIdentity1.identifier;
            const certificateObj = new Certificate(adminIdentity1.certificate);
            certificateObj.getIdentifier().should.equal(adminIdentityIdentifier);
            certificateObj.getIssuer().should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            certificateObj.getName().should.equal('doge');
            certificateObj.getPublicKey().should.be.a('string');
            adminIdentity1.identifier.should.equal(adminIdentityIdentifier);
            adminIdentity1.issuer.should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            adminIdentity1.name.should.equal('doge');
            adminIdentity1.secret.should.equal('f892c30a');
            adminIdentity1.imported.should.be.false;
            //const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            //adminIdentity1.should.deep.equal(adminIdentity2);
            result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
        });

        it('should throw if the current identity is not an issuer', async () => {
            identity.options.issuer = false;
            await connection.createIdentity(mockSecurityContext, 'doge').should.be.rejectedWith(/does not have permission to create a new identity/);
        });

    });

    describe('#undeploy', () => {
        it('should remove prevoiusly installed business network', async () => {
            await connection.install(mockSecurityContext, businessNetworkDefinition);
            await connection.undeploy(mockSecurityContext, businessNetworkDefinition.getName());
            await connection.install(mockSecurityContext, businessNetworkDefinition)
                .should.not.be.rejected;
        });
    });

    describe('#getNativeAPI', () => {

        it('should throw as not supported', () => {
            (() => {
                connection.getNativeAPI();
            }).should.throw(/native API not available when using the embedded connector/);
        });

    });

});
