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


describe('EmbeddedConnection', () => {

    let sandbox;
    let mockConnectionManager;
    let mockSecurityContext;
    let identity;
    let connection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        EmbeddedConnection.reset();
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(EmbeddedSecurityContext);
        identity = {
            identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
            name: 'bob1',
            issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
            secret: 'suchsecret',
            certificate: '',
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
            connection.createTransactionId(mockSecurityContext)
            .then((result)=>{
                should.be.equal(result,null);
            }
            );
        });
    });

    describe('#login', () => {

        beforeEach(() => {
            sandbox.stub(connection, 'testIdentity').resolves();
        });

        it('should return a new security context with a null chaincode ID if the business network was not specified', () => {
            connection = new EmbeddedConnection(mockConnectionManager, 'devFabric1');
            sandbox.stub(connection, 'testIdentity').resolves(identity);
            return connection.login('doge', 'suchs3cret')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(EmbeddedSecurityContext);
                    securityContext.getIdentity().should.deep.equal(identity);
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

    describe('#install', ()  => {
        it('should perform a no-op and return a resolved promise', () => {
            return connection.install(mockSecurityContext, 'org-acme-biznet')
                .then(() => {
                });
        });
    });

    describe('#deploy', ()  => {
        it('should just call start', () => {
            sinon.stub(connection, 'start').resolves();
            return connection.deploy(mockSecurityContext, 'testnetwork', '{"start":"json"}', { start: 'options' })
                .then(() => {
                    sinon.assert.calledOnce(connection.start);
                    sinon.assert.calledWith(connection.start, mockSecurityContext, 'testnetwork', '{"start":"json"}', { start: 'options' });
                });
        });
    });

    describe('#start', () => {

        it('should call the init engine method, ping, and store the chaincode ID', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            mockContainer.getUUID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockSecurityContext.getIdentity.returns(identity);
            sandbox.stub(EmbeddedConnection, 'createContainer').returns(mockContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            sandbox.stub(EmbeddedConnection, 'createEngine').returns(mockEngine);
            mockEngine.init.resolves();
            sinon.stub(connection, 'ping').resolves();
            return connection.start(mockSecurityContext, 'testnetwork', '{"start":"json"}', { start: 'options' })
                .then(() => {
                    sinon.assert.calledOnce(mockEngine.init);
                    sinon.assert.calledWith(mockEngine.init, sinon.match((context) => {
                        context.should.be.an.instanceOf(Context);
                        context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
                        return true;
                    }), 'init', ['{"start":"json"}']);
                    EmbeddedConnection.getBusinessNetwork('testnetwork', 'devFabric1').should.equal('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
                    EmbeddedConnection.getChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f').should.deep.equal({
                        uuid: '6eeb8858-eced-4a32-b1cd-2491f1e3718f',
                        container: mockContainer,
                        engine: mockEngine
                    });
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
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.query.resolves({ test: 'data from engine' });
            return connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
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

    });

    describe('#invokeChainCode', () => {

        it('should call the engine invoke method', () => {
            let mockContainer = sinon.createStubInstance(EmbeddedContainer);
            let mockEngine = sinon.createStubInstance(Engine);
            mockEngine.getContainer.returns(mockContainer);
            EmbeddedConnection.addBusinessNetwork('org.acme.Business', 'devFabric1', '6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            EmbeddedConnection.addChaincode('6eeb8858-eced-4a32-b1cd-2491f1e3718f', mockContainer, mockEngine);
            mockSecurityContext.getIdentity.returns(identity);
            mockSecurityContext.getChaincodeID.returns('6eeb8858-eced-4a32-b1cd-2491f1e3718f');
            mockEngine.invoke.resolves({ test: 'data from engine' });
            return connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockEngine.invoke);
                    sinon.assert.calledWith(mockEngine.invoke, sinon.match((context) => {
                        context.should.be.an.instanceOf(Context);
                        context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
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

        const adminIdentity = {
            certificate: [
                '-----BEGIN CERTIFICATE-----',
                'YWRtaW4=',
                '-----END CERTIFICATE-----'
            ].join('\n').concat('\n'),
            identifier: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
            issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
            name: 'admin',
            secret: 'adminpw',
            imported: false,
            options: {
                issuer: true
            }
        };

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should store a new identity if it does not exists', () => {
            return connection._createAdminIdentity()
                .then((result) => {
                    sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.add, 'admin', adminIdentity);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.add, '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', adminIdentity);
                });
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

    describe('#createIdentity', () => {

        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sandbox.stub(connection, 'getIdentities').resolves(mockIdentitiesDataCollection);
        });

        it('should return the existing identity if it already exists', () => {
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({
                certificate: '',
                identifier: '8f00d1b8319abc0ad87ccb6c1baae0a54c406c921c01e1ed165c33b93f3e5b6a',
                issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                name: 'doge',
                secret: 'f892c30a'
            });
            return connection.createIdentity(mockSecurityContext, 'doge')
                .then((result) => {
                    sinon.assert.notCalled(mockIdentitiesDataCollection.add);
                    result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
                });
        });

        it('should store a new identity if it does not exists', () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            return connection.createIdentity(mockSecurityContext, 'doge')
               .then((result) => {
                   sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
                   sinon.assert.calledWith(mockIdentitiesDataCollection.add, 'doge', {
                       certificate: [
                           '-----BEGIN CERTIFICATE-----',
                           'ZG9nZTpmODkyYzMwYS03Nzk5LTRlYWMtODM3Ny0wNmRhNTM2MDBlNQ==',
                           '-----END CERTIFICATE-----'
                       ].join('\n').concat('\n'),
                       identifier: '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799',
                       issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                       name: 'doge',
                       secret: 'f892c30a',
                       imported: false,
                       options: { }
                   });
                   sinon.assert.calledWith(mockIdentitiesDataCollection.add, '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799', {
                       certificate: [
                           '-----BEGIN CERTIFICATE-----',
                           'ZG9nZTpmODkyYzMwYS03Nzk5LTRlYWMtODM3Ny0wNmRhNTM2MDBlNQ==',
                           '-----END CERTIFICATE-----'
                       ].join('\n').concat('\n'),
                       identifier: '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799',
                       issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                       name: 'doge',
                       secret: 'f892c30a',
                       imported: false,
                       options: { }
                   });
                   result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
               });
        });

        it('should store a new identity along with additional options if it does not exists', () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            return connection.createIdentity(mockSecurityContext, 'doge', { issuer: true })
                .then((result) => {
                    sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.add, 'doge', {
                        certificate: [
                            '-----BEGIN CERTIFICATE-----',
                            'ZG9nZTpmODkyYzMwYS03Nzk5LTRlYWMtODM3Ny0wNmRhNTM2MDBlNQ==',
                            '-----END CERTIFICATE-----'
                        ].join('\n').concat('\n'),
                        identifier: '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799',
                        issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                        name: 'doge',
                        secret: 'f892c30a',
                        imported: false,
                        options: {
                            issuer: true
                        }
                    });
                    sinon.assert.calledWith(mockIdentitiesDataCollection.add, '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799', {
                        certificate: [
                            '-----BEGIN CERTIFICATE-----',
                            'ZG9nZTpmODkyYzMwYS03Nzk5LTRlYWMtODM3Ny0wNmRhNTM2MDBlNQ==',
                            '-----END CERTIFICATE-----'
                        ].join('\n').concat('\n'),
                        identifier: '8b36964b0cd0b9aea800b3fb293b3024d5cd6346f6aff4a589eb4d408ea76799',
                        issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                        name: 'doge',
                        secret: 'f892c30a',
                        imported: false,
                        options: {
                            issuer: true
                        }
                    });
                    result.should.be.deep.equal({ userID: 'doge', userSecret: 'f892c30a' });
                });
        });

        it('should throw if the current identity is not an issuer', () => {
            identity.options.issuer = false;
            (() => {
                connection.createIdentity(mockSecurityContext, 'doge');
            }).should.throw(/does not have permission to create a new identity/);
        });

    });

});
