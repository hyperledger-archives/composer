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

const AdminConnection = require('..').AdminConnection;
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const Factory = require('composer-common').Factory;
const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const IdCard = require('composer-common').IdCard;
const MemoryCardStore = require('composer-common').MemoryCardStore;
const ModelManager = require('composer-common').ModelManager;
const SecurityContext = require('composer-common').SecurityContext;
const Util = require('composer-common').Util;
const uuid = require('uuid');

const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('AdminConnection', () => {
    const testProfileName = 'TEST_PROFILE';
    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let adminConnection;
    let sandbox;
    let clock;
    let cardStore;
    let mockAdminIdCard;

    const config =
        {
            type : 'hlf',
            keyValStore : '/tmp/keyValStore',
            membershipServicesURL : 'grpc://localhost:7054',
            peerURL : 'grpc://localhost:7051',
            eventHubURL : 'grpc://localhost:7053'
        };

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockConnection = sinon.createStubInstance(Connection);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockSecurityContext.getConnection.returns(mockConnection);

        mockConnection.getConnectionManager.returns(mockConnectionManager);
        mockConnection.getIdentifier.returns('BNI@CP');
        mockConnection.disconnect.resolves();
        mockConnection.login.resolves(mockSecurityContext);
        mockConnection.deploy.resolves();
        mockConnection.install.resolves();
        mockConnection.start.resolves();
        mockConnection.ping.resolves();
        mockConnection.queryChainCode.resolves();
        mockConnection.invokeChainCode.resolves();
        mockConnection.undeploy.resolves();
        mockConnection.update.resolves();
        mockConnection.upgrade.resolves();
        mockConnection.reset.resolves();
        mockConnection.list.resolves(['biznet1', 'biznet2']);

        mockConnectionManager.connect.resolves(mockConnection);
        cardStore = new MemoryCardStore();
        const adminConnectionOptions = {
            cardStore : cardStore
        };
        adminConnection = new AdminConnection(adminConnectionOptions);
        adminConnection.securityContext = mockSecurityContext;
        mockAdminIdCard = sinon.createStubInstance(IdCard);
        mockAdminIdCard.getConnectionProfile.returns({name : 'profile', type : 'test'});
        mockSecurityContext.card = mockAdminIdCard;
        sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManager').resolves(mockConnectionManager);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManagerByType').resolves(mockConnectionManager);
        delete process.env.COMPOSER_CONFIG;
        sandbox = sinon.sandbox.create();
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        delete process.env.COMPOSER_CONFIG;
        sandbox.restore();
        clock.restore();
    });

    describe('#constructor', () => {
        it('should not fail if no connectionManager is provided', () => {
            let adminConnection = new AdminConnection();
            adminConnection.connectionProfileManager.should.not.be.null;
        });

        it('should allow valid card store implementation to be specified', function () {
            const cardStore = new BusinessNetworkCardStore();
            const adminConnection = new AdminConnection({cardStore : cardStore});
            adminConnection.cardStore.should.equal(cardStore);
        });

        it('should use FileSystemCardStore as default card store', function () {
            const adminConnection = new AdminConnection();
            adminConnection.cardStore.should.be.an.instanceOf(FileSystemCardStore);
        });
    });

    describe('#connectWithDetails', () => {

        it('should connect, login and ping if business network specified', () => {
            return adminConnection.connectWithDetails(testProfileName, 'WebAppAdmin', 'DJY27pEnl16d', 'testnetwork')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.login);
                    sinon.assert.calledWith(mockConnection.login, 'WebAppAdmin', 'DJY27pEnl16d');
                    sinon.assert.calledOnce(mockConnection.ping);
                    sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
                });
        });

        it('should connect and login if business network not specified', () => {
            return adminConnection.connectWithDetails(testProfileName, 'WebAppAdmin', 'DJY27pEnl16d')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.login);
                    sinon.assert.calledWith(mockConnection.login, 'WebAppAdmin', 'DJY27pEnl16d');
                    sinon.assert.notCalled(mockConnection.ping);
                });
        });
    });

    describe('#connect', () => {
        let cardStub;

        beforeEach(() => {
            sinon.spy(cardStore, 'get');
            cardStub = sinon.createStubInstance(IdCard);
            cardStub.getConnectionProfile.returns({});
            cardStub.getUserName.returns('fred');
            cardStub.getBusinessNetworkName.returns('network');
            cardStub.getCredentials.returns({});
            cardStub.getEnrollmentCredentials.returns({secret : 'password'});
            cardStore.put('testCardname', cardStub);

            sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
        });

        it('should connect and login when card has secret', () => {
            return adminConnection.connect('testCardname').then(() => {
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData, {}, 'network');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'fred', 'password');
            });
        });

        it('should connect and login when card has certificates', () => {
            cardStub.getCredentials.returns({certificate : 'cert', privateKey : 'key'});
            cardStub.getEnrollmentCredentials.returns(null);

            return adminConnection.connect('testCardname').then(() => {
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData, {}, 'network');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'fred', 'na');
            });
        });

        it('should ping if card contains business network name', () => {
            return adminConnection.connect('testCardname').then(() => {
                sinon.assert.calledOnce(mockConnection.ping);
                sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
            });
        });

        it('should not ping if card does not contain business network name', () => {
            cardStub.getBusinessNetworkName.returns('');

            return adminConnection.connect('testCardname').then(() => {
                sinon.assert.notCalled(mockConnection.ping);
            });
        });
    });

    describe('#disconnect', () => {
        it('should set connection and security context to null if connection is set', () => {
            return adminConnection.connectWithDetails(testProfileName, 'WebAppAdmin', 'DJY27pEnl16d', 'testnetwork')
                .then(() => {
                    adminConnection.connection.should.not.be.null;
                    adminConnection.securityContext.should.not.be.null;
                    return adminConnection.disconnect();
                })
                .then(() => {
                    should.equal(adminConnection.connection, null);
                    should.equal(adminConnection.securityContext, null);
                });
        });

        it('should not fail when no connection is set', () => {
            let adminConnection = new AdminConnection();
            return adminConnection.disconnect().should.not.be.rejected;
        });
    });

    describe('#install', () => {

        it('should be able to install a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.install('org-acme-biznet')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.install);
                    sinon.assert.calledWith(mockConnection.install, mockSecurityContext, 'org-acme-biznet');
                });
        });

        it('should be able to install a business network definition with install options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.install('org-acme-biznet', {opt : 1})
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.install);
                    sinon.assert.calledWith(mockConnection.install, mockSecurityContext, 'org-acme-biznet', {opt : 1});
                });
        });

    });

    describe('#start', () => {
        it('should be able to start a business network definition with no network admins', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.start(businessNetworkDefinition, {

            })
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {

                    });
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {

                    });
                });
        });

        it('should be able to start a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.start(businessNetworkDefinition, {
                networkAdmins : [{
                    userName : 'admin',
                    enrollmentSecret  : 'adminpw'
                }]
            })
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {
                        networkAdmins : [{
                            userName : 'admin',
                            enrollmentSecret  : 'adminpw'
                        }]
                    });
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {
                        networkAdmins : [{
                            userName : 'admin',
                            enrollmentSecret  : 'adminpw'
                        }]
                    });
                });
        });

        it('should be able to start a business network definition with several networkAdmins required', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.start(businessNetworkDefinition, {
                networkAdmins : [{
                    userName : 'admin',
                    enrollmentSecret  : 'adminpw'
                }, {userName : 'admin', certificate : 'cert'}]
            })
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {
                        networkAdmins : [{
                            userName : 'admin',
                            enrollmentSecret  : 'adminpw'
                        }, {userName : 'admin', certificate : 'cert'}]
                    });
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {
                        networkAdmins : [{
                            userName : 'admin',
                            enrollmentSecret  : 'adminpw'
                        }, {userName : 'admin', certificate : 'cert'}]
                    });
                });
        });

        it('should be able to start a business network definition with start options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.start(businessNetworkDefinition, {
                opt : 1,
                networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
            })
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {
                        opt : 1,
                        networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
                    });
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {
                        opt : 1,
                        networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
                    });
                });
        });

    });

    describe('#upgrade', () => {

        it('should be able to upgrade a composer runtime', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.upgrade()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.upgrade);
                    sinon.assert.calledWith(mockConnection.upgrade, mockSecurityContext);
                });
        });
    });

    describe('#reset', () => {

        it('should be able to reset a composer runtime', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.reset('name')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.reset);
                    sinon.assert.calledWith(mockConnection.reset, mockSecurityContext);
                });
        });
    });

    describe('#deploy', () => {

        it('should be able to deploy a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.deploy(businessNetworkDefinition, {card : mockAdminIdCard})
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {card : mockAdminIdCard});
                    sinon.assert.calledOnce(mockConnection.deploy);
                    sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, 'name', '{"start":"json"}', {card : mockAdminIdCard});
                });
        });

        it('should be able to deploy a business network definition with deploy options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({start : 'json'});
            return adminConnection.deploy(businessNetworkDefinition, {opt : 1, card : mockAdminIdCard})
                .then(() => {
                    sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                    sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {
                        opt : 1,
                        card : mockAdminIdCard
                    });
                    sinon.assert.calledOnce(mockConnection.deploy);
                    sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, 'name', '{"start":"json"}', {
                        opt : 1,
                        card : mockAdminIdCard
                    });
                });
        });

    });

    describe('#undeploy', () => {

        it('should be able to undeploy a business network', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.undeploy('testnetwork')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.undeploy);
                    sinon.assert.calledWith(mockConnection.undeploy, mockSecurityContext, 'testnetwork');
                });
        });
    });

    describe('#update', () => {

        it('should be able to update a business network', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            return adminConnection.update(businessNetworkDefinition)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.update);
                    sinon.assert.calledWith(mockConnection.update, mockSecurityContext, businessNetworkDefinition);
                });
        });
    });

    describe('#ping', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

        it('should throw any errors that do not match ACTIVATION_REQUIRED', () => {
            mockConnection.ping.onFirstCall().rejects(new Error('something something ACTIVATION NOT REQUIRED'));
            mockConnection.ping.onSecondCall().resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity"}']).resolves();
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .should.be.rejectedWith(/ACTIVATION NOT REQUIRED/);
        });

        it('should activate the identity if the ping returns ACTIVATION_REQUIRED', () => {
            mockConnection.ping.onFirstCall().rejects(new Error('something something ACTIVATION_REQUIRED'));
            mockConnection.ping.onSecondCall().resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');
            mockConnection.invokeChainCode.resolves();
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .then(() => {
                    sinon.assert.calledTwice(mockConnection.ping);
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1","timestamp":"1970-01-01T00:00:00.000Z"}']);
                });
        });

    });

    describe('#pingInner', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.pingInner()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version : version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.pingInner()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

    describe('#activate', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');
            mockConnection.invokeChainCode.resolves();
            adminConnection.connection = mockConnection;
            return adminConnection.activate()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should submit a request to the chaincode for activation', () => {
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');
            mockConnection.invokeChainCode.resolves();
            adminConnection.connection = mockConnection;
            return adminConnection.activate()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1","timestamp":"1970-01-01T00:00:00.000Z"}']);
                });
        });

    });

    describe('#getLogLevel', () => {
        it('should not fail', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            mockConnection.queryChainCode.resolves('"WARNING"');
            return adminConnection.getLogLevel()
                .then((result) => {
                    sinon.assert.calledOnce(mockConnection.queryChainCode);
                    sinon.assert.calledWith(mockConnection.queryChainCode, mockSecurityContext, 'getLogLevel', []);
                    result.should.equal('WARNING');
                });
        });
    });

    describe('#setLogLevel', () => {
        it('should invoke ', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.setLogLevel('ERROR')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.setLogLevel);
                    sinon.assert.calledWith(mockConnection.setLogLevel, mockSecurityContext, 'ERROR');
                });
        });
    });

    describe('#list', () => {

        it('should list all deployed business networks', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.list()
                .should.eventually.be.deep.equal(['biznet1', 'biznet2']);
        });

    });

    describe('#requestIdentity', () => {
        beforeEach(() => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let cardStub = sinon.createStubInstance(IdCard);
            let cp = config;
            cp.name = testProfileName;
            cardStub.getConnectionProfile.returns(cp);
            cardStub.getUserName.returns('fred');
            cardStub.getBusinessNetworkName.returns('network');
            cardStub.getCredentials.returns({});
            cardStub.getEnrollmentCredentials.returns({secret : 'password'});
            cardStore.put('testCardname', cardStub);
        });

        it('should be able to request an identity', () => {
            mockConnectionManager.requestIdentity.resolves({
                certificate : 'a',
                key : 'b',
                rootCertificate : 'c',
                caName : 'caName',
                enrollId : 'fred'
            });


            return adminConnection.requestIdentity('testCardname', 'id', 'secret')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.requestIdentity);
                    sinon.assert.calledWith(mockConnectionManager.requestIdentity, testProfileName, config, 'id', 'secret');
                });
        });

        it('should be able to request an identity with id and secret from the card', () => {
            mockConnectionManager.requestIdentity.resolves({
                certificate : 'a',
                key : 'b',
                rootCertificate : 'c',
                caName : 'caName',
                enrollId : 'fred'
            });

            return adminConnection.requestIdentity('testCardname')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.requestIdentity);
                    sinon.assert.calledWith(mockConnectionManager.requestIdentity, testProfileName, config, 'fred', 'password');
                });
        });

        it('should throw an error if import fails', () => {
            mockConnectionManager.requestIdentity = sinon.stub();
            mockConnectionManager.requestIdentity.rejects(new Error('some error'));

            return adminConnection.requestIdentity(testProfileName, 'anid', 'acerttosign', 'akey')
                .should.be.rejectedWith(/failed to request identity/);
        });


    });


    describe('#_generateBootstrapTransactions', () => {

        const modelManager = new ModelManager();
        const factory = new Factory(modelManager);
        const identityName = 'admin';
        const identityCertificate = 'such cert';

        it('should generate the bootstrap transactions', () => {
            const txs = adminConnection._generateBootstrapTransactions(factory, identityName, identityCertificate);
            txs.should.have.lengthOf(2);
            const tx0 = txs[0];
            tx0.getFullyQualifiedType().should.equal('org.hyperledger.composer.system.AddParticipant');
            tx0.resources.should.have.lengthOf(1);
            tx0.resources[0].getFullyQualifiedType().should.equal('org.hyperledger.composer.system.NetworkAdmin');
            tx0.resources[0].participantId.should.equal('admin');
            const tx1 = txs[1];
            tx1.getFullyQualifiedType().should.equal('org.hyperledger.composer.system.BindIdentity');
            tx1.participant.toURI().should.equal('resource:org.hyperledger.composer.system.NetworkAdmin#admin');
            tx1.certificate.should.equal(identityCertificate);
        });

    });

    describe('#_buildStartTransaction', () => {

        const businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');
        const identityName = 'admin';

        beforeEach(() => {
            mockSecurityContext.getUser.returns(identityName);
            sandbox.stub(uuid, 'v4').returns('47bc3a67-5599-4460-9745-6a291df4f879');
        });

        it('should build the start transaction if no bootstrap transactions specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                networkAdmins : [{
                    userName : 'admin',
                    enrollmentSecret  : 'adminpw'
                }, {userName : 'adminc', certificate : 'certcertcert'}]
            })
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class : 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions : [
                            {
                                $class : 'org.hyperledger.composer.system.AddParticipant',
                                resources : [
                                    {
                                        $class : 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId : 'admin'
                                    }
                                ],
                                targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class : 'org.hyperledger.composer.system.AddParticipant',
                                resources : [
                                    {
                                        $class : 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId : 'adminc'
                                    }
                                ],
                                targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class : 'org.hyperledger.composer.system.IssueIdentity',
                                identityName : 'admin',
                                participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                            ,
                            {
                                $class : 'org.hyperledger.composer.system.BindIdentity',
                                certificate : 'certcertcert',
                                participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#adminc',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive : 'UEsDBAoAAAAAAAAAjA55auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAjA4AAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAAIwOeWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAACMDgAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp : '1970-01-01T00:00:00.000Z',
                        transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                });
        });

        it('should build the start transaction if empty bootstrap transactions specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                bootstrapTransactions : [],
                networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
            })
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class : 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions : [
                            {
                                $class : 'org.hyperledger.composer.system.AddParticipant',
                                resources : [
                                    {
                                        $class : 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId : 'admin'
                                    }
                                ],
                                targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class : 'org.hyperledger.composer.system.IssueIdentity',
                                identityName : 'admin',
                                participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive : 'UEsDBAoAAAAAAAAAjA55auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAjA4AAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAAIwOeWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAACMDgAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp : '1970-01-01T00:00:00.000Z',
                        transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                });
        });

        it('should build the start transaction using additional modelled properties from the start options', () => {
            const userMetadata = {
                userName : 'user',
                businessNetwork : 'penguin-network'
            };
            const connection = config;
            connection.card = 'user@penguin-network';
            connection.name = 'connectionName';
            let userCard = new IdCard(userMetadata, connection);
            userCard.setCredentials({certificate : 'card cert', privateKey : 'String'});
            const startOptions = {
                logLevel : 'DEBUG',
                card : userCard,
                networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
            };
            return adminConnection._buildStartTransaction(businessNetworkDefinition, startOptions)
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class : 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions : [
                            {
                                $class : 'org.hyperledger.composer.system.AddParticipant',
                                resources : [
                                    {
                                        $class : 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId : 'admin'
                                    }
                                ],
                                targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class : 'org.hyperledger.composer.system.IssueIdentity',
                                identityName : 'admin',
                                participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive : 'UEsDBAoAAAAAAAAAjA55auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAjA4AAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAAIwOeWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAACMDgAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp : '1970-01-01T00:00:00.000Z',
                        transactionId : '47bc3a67-5599-4460-9745-6a291df4f879',
                        logLevel : 'DEBUG'
                    });
                    should.equal(startOptions.logLevel, undefined);
                });
        });

        it('should build the start transaction ignoring additional unmodelled properties from the start options', () => {
            const startOptions = {
                notAModelledProp : 'lulz',
                networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
            };
            return adminConnection._buildStartTransaction(businessNetworkDefinition, startOptions)
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class : 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions : [
                            {
                                $class : 'org.hyperledger.composer.system.AddParticipant',
                                resources : [
                                    {
                                        $class : 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId : 'admin'
                                    }
                                ],
                                targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class : 'org.hyperledger.composer.system.IssueIdentity',
                                identityName : 'admin',
                                participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp : '1970-01-01T00:00:00.000Z',
                                transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive : 'UEsDBAoAAAAAAAAAjA55auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAjA4AAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAAIwOeWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAACMDgAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp : '1970-01-01T00:00:00.000Z',
                        transactionId : '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                    startOptions.notAModelledProp.should.equal('lulz');
                });
        });

        it('should build the start transaction using bootstrap transactions from the start options', () => {
            const bootstrapTransactions = [
                {
                    $class : 'org.hyperledger.composer.system.AddParticipant',
                    resources : [
                        {
                            $class : 'org.hyperledger.composer.system.NetworkAdmin',
                            participantId : 'dave'
                        }
                    ],
                    targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                },
                {
                    $class : 'org.hyperledger.composer.system.BindIdentity',
                    certificate : 'daves cert',
                    participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#dave',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                }
            ];
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {bootstrapTransactions})
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        '$class' : 'org.hyperledger.composer.system.StartBusinessNetwork',
                        'businessNetworkArchive' : 'UEsDBAoAAAAAAAAAjA55auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAjA4AAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAAIwOeWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAACMDgAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAAIwOAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        'bootstrapTransactions' : [
                            {
                                '$class' : 'org.hyperledger.composer.system.AddParticipant',
                                'resources' : [
                                    {
                                        '$class' : 'org.hyperledger.composer.system.NetworkAdmin',
                                        'participantId' : 'dave'
                                    }
                                ],
                                'targetRegistry' : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                'transactionId' : '82b350a3-ecac-44e1-849a-24ff2cfa7db7',
                                'timestamp' : '1970-01-01T00:00:00.000Z'
                            },
                            {
                                '$class' : 'org.hyperledger.composer.system.BindIdentity',
                                'participant' : 'resource:org.hyperledger.composer.system.NetworkAdmin#dave',
                                'certificate' : 'daves cert',
                                'transactionId' : '82b350a3-ecac-44e1-849a-24ff2cfa7db7',
                                'timestamp' : '1970-01-01T00:00:00.000Z'
                            }
                        ],
                        'transactionId' : '47bc3a67-5599-4460-9745-6a291df4f879',
                        'timestamp' : '1970-01-01T00:00:00.000Z'
                    });
                });
        });

        it('should throw error if no start options', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition).should.eventually.be.rejectedWith('No network administrators or bootstrap transactions are specified');
        });

        it('should handle no networkadmins', () => {
            const bootstrapTransactions = [
                {
                    $class : 'org.hyperledger.composer.system.AddParticipant',
                    resources : [
                        {
                            $class : 'org.hyperledger.composer.system.NetworkAdmin',

                            participantId : 'dave'
                        }
                    ],
                    targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                },
                {
                    $class : 'org.hyperledger.composer.system.BindIdentity',
                    certificate : 'daves cert',
                    participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#dave',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                }
            ];

            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                bootstrapTransactions
            });
        });

        it('should throw error if network admins and bootstrap transactions specified', () => {
            const bootstrapTransactions = [
                {
                    $class : 'org.hyperledger.composer.system.AddParticipant',
                    resources : [
                        {
                            $class : 'org.hyperledger.composer.system.NetworkAdmin',

                            participantId : 'dave'
                        }
                    ],
                    targetRegistry : 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                },
                {
                    $class : 'org.hyperledger.composer.system.BindIdentity',
                    certificate : 'daves cert',
                    participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#dave',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                }
            ];

            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                bootstrapTransactions,
                networkAdmins : [{userName : 'admin', enrollmentSecret  : 'adminpw'}]
            }).should.eventually.be.rejectedWith('You cannot specify both network administrators and bootstrap transactions');
        });

        it('should throw error if no userName specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                networkAdmins : [{
                    enrollmentSecret  : 'adminpw'
                }]
            }).should.eventually.be.rejectedWith('A user name must be specified for all network administrators');
        });

        it('should throw error if no secret or certificate specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                networkAdmins : [{
                    userName : 'admin'
                }]
            }).should.eventually.be.rejectedWith('Either a secret or a certificate must be specified for all network administrators');
        });

        it('should serialize the same business network archive regardless of the current date', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                networkAdmins : [{
                    userName : 'admin',
                    enrollmentSecret  : 'adminpw'
                }, {userName : 'adminc', certificate : 'certcertcert'}]
            })
                .then((startTransactionJSON) => {
                    const originalBusinessNetworkArchive = startTransactionJSON.businessNetworkArchive;
                    let promise = Promise.resolve();
                    for (let i = 0; i < 5; i++) {
                        clock.tick(60000);
                        promise = promise.then(() => {
                            return adminConnection._buildStartTransaction(businessNetworkDefinition, {
                                networkAdmins : [{
                                    userName : 'admin',
                                    enrollmentSecret  : 'adminpw'
                                }, {userName : 'adminc', certificate : 'certcertcert'}]
                            });
                        }).then((startTransactionJSON) => {
                            const thisBusinessNetworkArchive = startTransactionJSON.businessNetworkArchive;
                            thisBusinessNetworkArchive.should.equal(originalBusinessNetworkArchive, `Failed to match serialized business network archive, iteration ${i + 1}/5`);
                        });
                    }
                    return promise;
                });
        });

    });

    describe('Business Network Cards', function () {
        let peerAdminCard;
        let userCard;
        const connection = config;

        beforeEach(function () {
            const peerAdminMetadata = {
                userName : 'PeerAdmin',
                roles : ['PeerAdmin', 'ChannelAdmin']
            };
            const userMetadata = {
                userName : 'user',
                businessNetwork : 'penguin-network'
            };
            connection.card='user@penguin-network';
            connection.name='connectionName';
            peerAdminCard = new IdCard(peerAdminMetadata, connection);

            userCard = new IdCard(userMetadata, connection);
        });

        describe('#importCard', function () {

            beforeEach(() => {
                mockConnectionManager.importIdentity.resolves();
                mockConnectionManager.removeIdentity.resolves();
                sinon.spy(userCard,'getCredentials');
            });

            it('should import a new card to card store', function() {
                const cardName = 'conga';
                sandbox.stub(cardStore, 'has').returns(false);
                return adminConnection.importCard(cardName, userCard)
                .then((updated) => {
                    updated.should.be.false;
                    sinon.assert.notCalled(mockConnectionManager.removeIdentity);
                    return cardStore.get(cardName).should.eventually.deep.equal(userCard);
                });
            });

            it('should update a card to card store', function() {
                const cardName = 'conga';
                let expectedConnection = Object.assign({}, connection);
                expectedConnection.cardName = cardName;
                sandbox.stub(cardStore, 'has').returns(true);
                return adminConnection.importCard(cardName, userCard)
                .then((updated) => {
                    sinon.assert.calledOnce(mockConnectionManager.removeIdentity);
                    sinon.assert.calledWith(mockConnectionManager.removeIdentity, 'connectionName', expectedConnection, 'user');
                    updated.should.be.true;
                    return cardStore.get(cardName).should.eventually.deep.equal(userCard);
                });
            });


            it('should not import identity if card does not contain credentials', function() {
                const cardName = 'conga';
                return adminConnection.importCard(cardName, userCard).then(() => {
                    return sinon.assert.notCalled(mockConnectionManager.importIdentity);
                });
            });

            it('should import identity if card contains credentials', function () {
                const certificate = 'CERTIFICATE_DATA';
                const privateKey = 'PRIVATE_KEY_DATA';
                userCard.setCredentials({certificate : certificate, privateKey : privateKey});
                return adminConnection.importCard('conga', userCard).then(() => {
                    return sinon.assert.calledWith(mockConnectionManager.importIdentity,
                        userCard.getConnectionProfile().name,
                        sinon.match.object,
                        userCard.getUserName(),
                        certificate,
                        privateKey
                    );
                });
            });
        });

        describe('#getAllCards', function () {
            it('should return empty map when card store contains no cards', function () {
                return adminConnection.getAllCards().should.eventually.be.instanceOf(Map).that.is.empty;
            });

            it('should return map of cards when card store is not empty', function () {
                const cardName = 'conga-card';
                return cardStore.put(cardName, peerAdminCard).then(() => {
                    return adminConnection.getAllCards();
                }).then((result) => {
                    result.should.be.instanceOf(Map);
                    result.size.should.equal(1);
                    result.get(cardName).should.deep.equal(peerAdminCard);
                });
            });
        });

        describe('#deleteCard', function () {
            it('should return false for non-existent card', function () {
                const cardName = 'conga-card';
                return adminConnection.deleteCard(cardName).should.become(false);
            });

            it('should return true for existing card', function () {
                const cardName = 'conga-card';
                return cardStore.put(cardName, peerAdminCard).then(() => {
                    return adminConnection.deleteCard(cardName);
                }).should.become(true);
            });

            it('should remove existing card', function () {
                const cardName = 'conga-card';
                return cardStore.put(cardName, peerAdminCard).then(() => {
                    return adminConnection.deleteCard(cardName);
                }).then(() => {
                    return cardStore.getAll();
                }).then(cardMap => {
                    cardMap.size.should.equal(0);
                });
            });
        });


        describe('#hasCard', function () {
            it('should return false for non-existent card', function () {
                const cardName = 'conga-card';
                return adminConnection.hasCard(cardName).should.become(false);
            });

            it('should return true for existing card', function () {
                const cardName = 'conga-card';
                return cardStore.put(cardName, peerAdminCard).then(() => {
                    return adminConnection.hasCard(cardName);
                }).should.become(true);
            });
        });

        describe('#exportCard', () => {

            it('Card exists, but no credentials, call to export identity is correct executed', () => {
                const credentials = {certificate : 'String', privateKey : 'String'};
                mockConnectionManager.exportIdentity = sinon.stub();
                mockConnectionManager.exportIdentity.resolves(credentials);
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                const cardName = 'conga';

                sinon.spy(userCard, 'setCredentials');
                return cardStore.put(cardName, userCard).then(() => {
                    return adminConnection.exportCard(cardName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.equal('user');
                    result.getCredentials().should.equal(credentials);
                });

            });

            it('Card exists, but with credentials', () => {
                mockConnectionManager.exportIdentity = sinon.stub();
                userCard.setCredentials({certificate : 'String', privateKey : 'String'});
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;
                const cardName = 'conga';

                return cardStore.put(cardName, userCard).then(() => {
                    return adminConnection.exportCard(cardName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.equal('user');
                });

            });

            it('should still export a card with no secret or credentials', () => {
                mockConnectionManager.exportIdentity = sinon.stub();
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;
                const cardName = 'conga';

                return cardStore.put(cardName, userCard).then(() => {
                    return adminConnection.exportCard(cardName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.equal('user');
                });

            });

            it('Card exists, but with no credentials but does have secret', () => {
                mockConnectionManager.exportIdentity = sinon.stub();
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                const connection = config;
                connection.card = 'user@penguin-network';
                connection.name = 'connectionName';
                const userMetadata = {
                    userName : 'user',
                    businessNetwork : 'penguin-network',
                    enrollmentSecret : 'humbolt'
                };
                userCard = new IdCard(userMetadata, connection);
                const cardName = 'conga';

                return cardStore.put(cardName, userCard).then(() => {
                    return adminConnection.exportCard(cardName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.deep.equal('user');
                });

            });
        });
    });
});
