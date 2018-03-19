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
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const Context = require('composer-runtime').Context;
const DataCollection = require('composer-runtime').DataCollection;
const DataService = require('composer-runtime').DataService;
const Engine = require('composer-runtime').Engine;
const LoggingService = require('composer-runtime').LoggingService;
const uuid = require('uuid');
const WebConnection = require('../lib/webconnection');
const WebContainer = require('composer-runtime-web').WebContainer;
const WebSecurityContext = require('../lib/websecuritycontext');

const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();
const sinon = require('sinon');

describe('WebConnection', () => {
    const sandbox = sinon.sandbox.create();

    let mockConnectionManager;
    let mockConnectionProfileManager;
    let mockSecurityContext;
    let identity;
    let connection;

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        mockConnectionManager.getConnectionProfileManager.returns(mockConnectionProfileManager);
        mockSecurityContext = sinon.createStubInstance(WebSecurityContext);
        identity = {
            identifier : 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
            name : 'bob1',
            issuer : 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
            secret : 'suchsecret',
            certificate : '',
            options : {
                issuer : true
            }
        };
        mockSecurityContext.getIdentity.returns(identity);
        connection = new WebConnection(mockConnectionManager, 'devFabric1', 'org.acme.business');
    });

    afterEach(async () => {
        sandbox.restore();
        if (await connection.dataService.existsCollection('chaincodes')) {
            await connection.dataService.deleteCollection('chaincodes');
        }
    });

    describe('#createContainer', () => {

        it('should create a new container', () => {
            WebConnection.createContainer().should.be.an.instanceOf(WebContainer);
        });

    });

    describe('#createTransactionId', () => {
        it('should just return null ', () => {
            connection.createTransactionId(mockSecurityContext)
                .then((result) => {
                    should.be.equal(result, null);
                });
        });
    });

    describe('#createEngine', () => {

        it('should create a new engine', () => {
            let mockContainer = sinon.createStubInstance(WebContainer);
            let mockLoggingService = sinon.createStubInstance(LoggingService);
            mockContainer.getLoggingService.returns(mockLoggingService);
            mockLoggingService.getLoggerCfg.returns({});
            WebConnection.createEngine(mockContainer).should.be.an.instanceOf(Engine);
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

        it('should return security context without network name if no business network specified', async () => {
            const user = 'doge';
            const secret = 'suchs3cret';
            connection = new WebConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').withArgs(user, secret).resolves(identity);
            const securityContext = await connection.login('doge', 'suchs3cret');
            should.not.exist(securityContext.getNetworkName());
        });

        it('should return security context with correct identity', async () => {
            const user = 'doge';
            const secret = 'suchs3cret';
            connection = new WebConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').withArgs(user, secret).resolves(identity);
            const securityContext = await connection.login('doge', 'suchs3cret');
            securityContext.getIdentity().should.deep.equal(identity);
        });
    });

    describe('#install', () => {
        it('should install a business network', async () => {
            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition)
                .should.not.be.rejected;
        });

        it('should error installing a business network twice', async () => {
            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition);
            await connection.install(mockSecurityContext, networkDefinition)
                .should.be.rejected;
        });
    });

    describe('#start', () => {
        let mockEngine;

        beforeEach(() => {
            const mockContainer = sinon.createStubInstance(WebContainer);
            sandbox.stub(WebConnection, 'createContainer').returns(mockContainer);
            mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(WebConnection, 'createEngine').returns(mockEngine);
        });

        it('should error starting a business network that is not installed', () => {
            return connection.start(mockSecurityContext, 'name', '1.0.0-fake')
                .should.be.rejected;
        });

        it('should start a previously installed business network', async () => {
            mockEngine.init.resolves();

            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition);
            await connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion());

            sinon.assert.calledWith(mockEngine.init, sinon.match.instanceOf(Context), 'start', sinon.match.array);
        });

        it('should error starting a previously started business network', async () => {
            mockEngine.init.resolves();

            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition);
            await connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion());

            return connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion())
                .should.be.rejected;
        });

        it('should re-throw errors from engine.init', async () => {
            const errorMessage = 'ALL YOUR ERROR ARE BELONG TO US';
            mockEngine.init.rejects(new Error(errorMessage));

            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition);

            return connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion())
                .should.be.rejectedWith(errorMessage);
        });
    });


    describe('#undeploy', () => {
        it('should remove prevoiusly installed business network', async () => {
            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            await connection.install(mockSecurityContext, networkDefinition);
            await connection.undeploy(mockSecurityContext, networkDefinition.getName());
            await connection.install(mockSecurityContext, networkDefinition)
                .should.not.be.rejected;
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
                        hello : 'world'
                    });
                });
        });

    });

    describe('#queryChainCode', () => {

        it('should call the engine query method', async () => {
            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            const functionName = 'testFunction';
            const functionArgs = ['a', 'b', 'c'];
            const expected = { whoami: 'function result' };

            const mockContainer = sinon.createStubInstance(WebContainer);
            sandbox.stub(WebConnection, 'createContainer').returns(mockContainer);
            const mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(WebConnection, 'createEngine').returns(mockEngine);
            mockEngine.init.resolves();
            mockEngine.query.withArgs(sinon.match.instanceOf(Context), functionName, functionArgs).resolves(expected);
            mockSecurityContext.getNetworkName.returns(networkDefinition.getName());

            await connection.install(mockSecurityContext, networkDefinition);
            await connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion());
            const actual = await connection.queryChainCode(mockSecurityContext, functionName, functionArgs);

            JSON.parse(actual.toString()).should.deep.equal(expected);
        });

    });

    describe('#invokeChainCode', () => {

        it('should call the engine invoke method', async () => {
            const networkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
            const functionName = 'testFunction';
            const functionArgs = ['a', 'b', 'c'];
            const expected = { whoami: 'function result' };

            const mockContainer = sinon.createStubInstance(WebContainer);
            sandbox.stub(WebConnection, 'createContainer').returns(mockContainer);
            const mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(WebConnection, 'createEngine').returns(mockEngine);
            mockEngine.init.resolves();
            mockEngine.invoke.resolves(expected);
            mockSecurityContext.getNetworkName.returns(networkDefinition.getName());

            await connection.install(mockSecurityContext, networkDefinition);
            await connection.start(mockSecurityContext, networkDefinition.getName(), networkDefinition.getVersion());
            await connection.invokeChainCode(mockSecurityContext, functionName, functionArgs);

            sinon.assert.calledWith(mockEngine.invoke, sinon.match.instanceOf(Context), functionName, functionArgs);
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
            identifier : '',
            name : 'admin',
            issuer : '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
            secret : 'adminpw',
            certificate : [
                '-----BEGIN CERTIFICATE-----',
                'YWRtaW4=',
                '-----END CERTIFICATE-----'
            ].join('\n').concat('\n'),
            imported : false,
            options : {
                issuer : true
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
            sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('admin');
            const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
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
            const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            adminIdentity1.should.deep.equal(adminIdentity2);
        });

    });

    describe('#testIdentity', () => {

        it('should not check the secret if the name is admin', () => {
            const identity = {
                identifier : '',
                name : 'admin',
                issuer : '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                secret : 'adminpw',
                imported : false
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
                identifier : '',
                name : 'admin',
                issuer : '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                secret : 'adminpw',
                imported : true
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
            sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('doge');
            const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
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
            const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            adminIdentity1.should.deep.equal(adminIdentity2);
            result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
        });

        it('should store a new identity along with additional options if it does not exists', async () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            const result = await connection.createIdentity(mockSecurityContext, 'doge', { issuer: true });
            sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
            mockIdentitiesDataCollection.add.getCall(0).args[0].should.equal('doge');
            const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
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
            const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            adminIdentity1.should.deep.equal(adminIdentity2);
            result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
        });

        it('should throw if the current identity is not an issuer', async () => {
            identity.options.issuer = false;
            await connection.createIdentity(mockSecurityContext, 'doge').should.be.rejectedWith(/does not have permission to create a new identity/);
        });

    });

});
