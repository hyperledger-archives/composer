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
const ComboConnectionProfileStore = require('composer-common').ComboConnectionProfileStore;
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const ConnectionProfileStore = require('composer-common').ConnectionProfileStore;
const Factory = require('composer-common').Factory;
const FileSystemCardStore = require('composer-common').FileSystemCardStore;
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
const IdCard = require('composer-common').IdCard;
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

/**
 * Stub card store implementation.
 */
class StubCardStore extends BusinessNetworkCardStore {
    /**
     * Constructor.
     */
    constructor() {
        super();
        this.cards = new Map();
    }

    /**
     * @inheritdoc
     */
    get(cardName) {
        return Promise.resolve().then(() => {
            return this.cards.get(cardName);
        });
    }

    /**
     * @inheritdoc
     */
    put(cardName, card) {
        return Promise.resolve().then(() => {
            this.cards.set(cardName, card);
        });
    }

    /**
     * @inheritdoc
     */
    getAll() {
        return Promise.resolve().then(() => {
            return this.cards;
        });
    }

    /**
     * @inheritdoc
     */
    delete(cardName) {
        return Promise.resolve().then(() => {
            if (!this.cards.delete(cardName)) {
                throw new Error('Card not found: ' + cardName);
            }
        });
    }

}

describe('AdminConnection', () => {
    const testProfileName = 'TEST_PROFILE';
    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let adminConnection;
    let sandbox;
    let clock;
    let cardStore;

    const config =
        {
            type: 'hlf',
            keyValStore: '/tmp/keyValStore',
            membershipServicesURL : 'grpc://localhost:7054',
            peerURL : 'grpc://localhost:7051',
            eventHubURL: 'grpc://localhost:7053'
        };

    const config2 =
        {
            type: 'embedded'
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
        cardStore = new StubCardStore();
        const adminConnectionOptions = {
            cardStore: cardStore
        };
        adminConnection = new AdminConnection(adminConnectionOptions);
        adminConnection.securityContext = mockSecurityContext;
        sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManager').resolves(mockConnectionManager);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManagerByType').resolves(mockConnectionManager);
        sinon.stub(adminConnection.connectionProfileStore, 'save').withArgs(testProfileName, sinon.match.any).resolves();
        sinon.stub(adminConnection.connectionProfileStore, 'load').withArgs(testProfileName).resolves(config);
        sinon.stub(adminConnection.connectionProfileStore, 'loadAll').resolves({ profile1: config, profile2: config2 });
        sinon.stub(adminConnection.connectionProfileStore, 'delete').withArgs(testProfileName).resolves();
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

        it('should create a new AdminConnection instance with a specified connection profile store', () => {
            const mockConnectionProfileStore = sinon.createStubInstance(ConnectionProfileStore);
            let adminConnection = new AdminConnection({ connectionProfileStore: mockConnectionProfileStore });
            adminConnection.should.not.be.null;
            adminConnection.connectionProfileStore.should.equal(mockConnectionProfileStore);
        });

        it('should create a new AdminConnection instance with a file system connection profile store', () => {
            let adminConnection = new AdminConnection();
            adminConnection.should.not.be.null;
            adminConnection.connectionProfileStore.should.be.an.instanceOf(FSConnectionProfileStore);
        });

        it('should create a new AdminConnection instance with a combo connection profile store', () => {
            const config = {
                connectionProfiles: {
                    hlfabric1: {
                        type: 'hlfv1'
                    },
                    hlfabric2: {
                        type: 'hlfv2'
                    }
                }
            };
            process.env.COMPOSER_CONFIG = JSON.stringify(config);
            let adminConnection = new AdminConnection();
            adminConnection.should.not.be.null;
            adminConnection.connectionProfileStore.should.be.an.instanceOf(ComboConnectionProfileStore);
        });

        it('should not fail if no connectionManager is provided', () => {
            let adminConnection = new AdminConnection();
            adminConnection.connectionProfileManager.should.not.be.null;
        });

        it('should allow valid card store implementation to be specified', function() {
            const cardStore = new BusinessNetworkCardStore();
            const adminConnection = new AdminConnection({ cardStore: cardStore });
            adminConnection.cardStore.should.equal(cardStore);
        });

        it('should use FileSystemCardStore as default card store', function() {
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

    describe('#connectWithCard', () =>{


        it ('should connect, login and ping if update not specified (secret based)', () => {
            sinon.spy(cardStore,'get');

            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getConnectionProfile.returns({});
            mockIdCard.getUserName.returns('fred');
            mockIdCard.getBusinessNetworkName.returns('network');
            mockIdCard.getEnrollmentCredentials.returns({secret:'password'});
            cardStore.put('testCardname',mockIdCard);

            sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
            return adminConnection.connect('testCardname').then(()=>{
                sinon.assert.calledOnce(cardStore.get);
                sinon.assert.calledWith(cardStore.get,'testCardname');
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData,{},'network');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login,'fred','password');
                sinon.assert.notCalled(mockConnection.ping);
            });
        });

        it ('should connect, login and ping if update not specified (certificate based)', () => {
            sinon.spy(cardStore,'get');

            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getConnectionProfile.returns({});
            mockIdCard.getUserName.returns('fred');
            mockIdCard.getBusinessNetworkName.returns('network');
            mockIdCard.getCredentials.returns({certificate:'cert',privateKey:'key'});
            cardStore.put('testCardname',mockIdCard);

            sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
            return adminConnection.connect('testCardname').then(()=>{
                sinon.assert.calledOnce(cardStore.get);
                sinon.assert.calledWith(cardStore.get,'testCardname');
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData,{},'network');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login,'fred','na');
                sinon.assert.notCalled(mockConnection.ping);
            });
        });


        it ('should connect, login and ping if update specified', () => {
            sinon.spy(cardStore,'get');

            let mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getConnectionProfile.returns({});
            mockIdCard.getUserName.returns('fred');
            mockIdCard.getBusinessNetworkName.returns('network');
            mockIdCard.getEnrollmentCredentials.returns({secret:'password'});
            cardStore.put('testCardname',mockIdCard);

            sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
            return adminConnection.connect('testCardname',true).then(()=>{
                sinon.assert.calledOnce(cardStore.get);
                sinon.assert.calledWith(cardStore.get,'testCardname');
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData,{},'network');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login,'fred','password');
                sinon.assert.calledOnce(mockConnection.ping);
                sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
            });
        });
    });


    describe('#createProfile', () => {
        it('should return a resolved promise', () => {
            return adminConnection.createProfile(testProfileName, config)
                .should.be.fulfilled;
        });
    });

    describe('#deleteProfile', () => {
        it('should return a resolved promise', () => {
            return adminConnection.deleteProfile(testProfileName, config)
                .should.be.fulfilled;
        });
    });

    describe('#getProfile', () => {

        it('should return the specified profile', () => {
            return adminConnection.getProfile(testProfileName)
                .should.eventually.be.deep.equal(config);
        });

    });

    describe('#getAllProfiles', () => {

        it('should return all the profiles', () => {
            return adminConnection.getAllProfiles()
                .should.eventually.be.deep.equal({
                    profile1: config,
                    profile2: config2
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
            return adminConnection.install('org-acme-biznet', {opt: 1})
            .then(() => {
                sinon.assert.calledOnce(mockConnection.install);
                sinon.assert.calledWith(mockConnection.install, mockSecurityContext, 'org-acme-biznet', {opt: 1});
            });
        });

    });

    describe('#start', () => {

        it('should be able to start a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({ start: 'json' });
            return adminConnection.start(businessNetworkDefinition)
            .then(() => {
                sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {});
                sinon.assert.calledOnce(mockConnection.start);
                sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {});
            });
        });

        it('should be able to start a business network definition with start options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({ start: 'json' });
            return adminConnection.start(businessNetworkDefinition, {opt: 1})
            .then(() => {
                sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {opt: 1});
                sinon.assert.calledOnce(mockConnection.start);
                sinon.assert.calledWith(mockConnection.start, mockSecurityContext, 'name', '{"start":"json"}', {opt: 1});
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
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({ start: 'json' });
            return adminConnection.deploy(businessNetworkDefinition)
            .then(() => {
                sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {});
                sinon.assert.calledOnce(mockConnection.deploy);
                sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, 'name', '{"start":"json"}', {});
            });
        });

        it('should be able to deploy a business network definition with deploy options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            sinon.stub(adminConnection, '_buildStartTransaction').resolves({ start: 'json' });
            return adminConnection.deploy(businessNetworkDefinition, {opt: 1})
            .then(() => {
                sinon.assert.calledOnce(adminConnection._buildStartTransaction);
                sinon.assert.calledWith(adminConnection._buildStartTransaction, businessNetworkDefinition, {opt: 1});
                sinon.assert.calledOnce(mockConnection.deploy);
                sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, 'name', '{"start":"json"}', {opt: 1});
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
                version: version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version: version
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
                version: version
            })));
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, 'submitTransaction', ['{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity"}']).resolves();
            adminConnection.connection = mockConnection;
            return adminConnection.ping()
                .should.be.rejectedWith(/ACTIVATION NOT REQUIRED/);
        });

        it('should activate the identity if the ping returns ACTIVATION_REQUIRED', () => {
            mockConnection.ping.onFirstCall().rejects(new Error('something something ACTIVATION_REQUIRED'));
            mockConnection.ping.onSecondCall().resolves(Buffer.from(JSON.stringify({
                version: version
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
                version: version
            })));
            adminConnection.connection = mockConnection;
            return adminConnection.pingInner()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.resolves(Buffer.from(JSON.stringify({
                version: version
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
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', [ '{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1","timestamp":"1970-01-01T00:00:00.000Z"}']);
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
                sinon.assert.calledWith(mockConnection.setLogLevel,mockSecurityContext, 'ERROR');
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

    describe('#importIdentity', () => {
        it('should be able to import an identity', () => {
            mockConnectionManager.importIdentity = sinon.stub();
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.importIdentity(testProfileName, 'anid', 'acerttosign', 'akey')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.importIdentity);
                    sinon.assert.calledWith(mockConnectionManager.importIdentity, testProfileName, config, 'anid', 'acerttosign', 'akey');
                });
        });

        it('should throw an error if import fails', () => {
            mockConnectionManager.importIdentity = sinon.stub();
            mockConnectionManager.importIdentity.rejects(new Error('no identity imported'));
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.importIdentity(testProfileName, 'anid', 'acerttosign', 'akey')
                .should.be.rejectedWith(/no identity imported/);
        });


    });

    describe('#requestIdentity', () => {
        it('should be able to request an identity', () => {
            mockConnectionManager.importIdentity = sinon.stub();
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.requestIdentity(testProfileName, 'id', 'secret')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.requestIdentity);
                    sinon.assert.calledWith(mockConnectionManager.requestIdentity, testProfileName, config, 'id', 'secret');
                });
        });

        it('should throw an error if import fails', () => {
            mockConnectionManager.requestIdentity = sinon.stub();
            mockConnectionManager.requestIdentity.rejects(new Error('some error'));
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.requestIdentity(testProfileName, 'anid', 'acerttosign', 'akey')
                .should.be.rejectedWith(/some error/);
        });


    });

    describe('#exportIdentity', function() {
        const id = 'Eric';

        it('should export credentials for an identity', () => {
            mockConnectionManager.exportIdentity = sinon.stub();
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.exportIdentity(testProfileName, id)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.exportIdentity);
                    sinon.assert.calledWith(mockConnectionManager.exportIdentity, testProfileName, config, id);
                });
        });

        it('should throw an error if export fails', () => {
            const errorText = 'ERROR_TEXT';
            mockConnectionManager.exportIdentity = sinon.stub();
            mockConnectionManager.exportIdentity.rejects(new Error(errorText));
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.exportIdentity(testProfileName, id)
                .should.be.rejectedWith(new RegExp(errorText));
        });
    });

    describe('#_getCurrentIdentity', () => {

        it('should get the current identity', () => {
            mockSecurityContext.getUser.returns('admin');
            const identity = {
                certificate: 'such cert',
                privateKey: 'much private'
            };
            mockConnectionManager.exportIdentity.resolves(identity);
            mockConnection.connectionProfile = testProfileName;
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection._getCurrentIdentity()
                .should.eventually.be.equal(identity)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.exportIdentity);
                    sinon.assert.calledWith(mockConnectionManager.exportIdentity, testProfileName, config, 'admin');
                });
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
        const identity = {
            certificate: 'such cert',
            privateKey: 'much private'
        };

        beforeEach(() => {
            mockSecurityContext.getUser.returns(identityName);
            sinon.stub(adminConnection, '_getCurrentIdentity').resolves(identity);
            sandbox.stub(uuid, 'v4').returns('47bc3a67-5599-4460-9745-6a291df4f879');
        });

        it('should build the start transaction if no bootstrap transactions specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition)
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class: 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [
                                    {
                                        $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId: 'admin'
                                    }
                                ],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class: 'org.hyperledger.composer.system.BindIdentity',
                                certificate: 'such cert',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive: 'UEsDBAoAAAAAAAAAIex5auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAIewAAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAACHseWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAAAh7AAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp: '1970-01-01T00:00:00.000Z',
                        transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                });
        });

        it('should build the start transaction if empty bootstrap transactions specified', () => {
            return adminConnection._buildStartTransaction(businessNetworkDefinition, { bootstrapTransactions: [] })
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class: 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [
                                    {
                                        $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId: 'admin'
                                    }
                                ],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class: 'org.hyperledger.composer.system.BindIdentity',
                                certificate: 'such cert',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive: 'UEsDBAoAAAAAAAAAIex5auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAIewAAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAACHseWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAAAh7AAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp: '1970-01-01T00:00:00.000Z',
                        transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                });
        });

        it('should build the start transaction using additional modelled properties from the start options', () => {
            const startOptions = { logLevel: 'DEBUG' };
            return adminConnection._buildStartTransaction(businessNetworkDefinition, startOptions)
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class: 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [
                                    {
                                        $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId: 'admin'
                                    }
                                ],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class: 'org.hyperledger.composer.system.BindIdentity',
                                certificate: 'such cert',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive: 'UEsDBAoAAAAAAAAAIex5auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAIewAAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAACHseWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAAAh7AAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp: '1970-01-01T00:00:00.000Z',
                        transactionId: '47bc3a67-5599-4460-9745-6a291df4f879',
                        logLevel: 'DEBUG'
                    });
                    should.equal(startOptions.logLevel, undefined);
                });
        });

        it('should build the start transaction ignoring additional unmodelled properties from the start options', () => {
            const startOptions = { notAModelledProp: 'lulz' };
            return adminConnection._buildStartTransaction(businessNetworkDefinition, startOptions)
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class: 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions: [
                            {
                                $class: 'org.hyperledger.composer.system.AddParticipant',
                                resources: [
                                    {
                                        $class: 'org.hyperledger.composer.system.NetworkAdmin',
                                        participantId: 'admin'
                                    }
                                ],
                                targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            },
                            {
                                $class: 'org.hyperledger.composer.system.BindIdentity',
                                certificate: 'such cert',
                                participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                                timestamp: '1970-01-01T00:00:00.000Z',
                                transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                            }
                        ],
                        businessNetworkArchive: 'UEsDBAoAAAAAAAAAIex5auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAIewAAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAACHseWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAAAh7AAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp: '1970-01-01T00:00:00.000Z',
                        transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                    startOptions.notAModelledProp.should.equal('lulz');
                });
        });

        it('should build the start transaction using bootstrap transactions from the start options', () => {
            const bootstrapTransactions = [
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    resources: [
                        {
                            $class: 'org.hyperledger.composer.system.NetworkAdmin',
                            participantId: 'dave'
                        }
                    ],
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin',
                    timestamp: '1970-01-01T00:00:00.000Z',
                    transactionId: '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                },
                {
                    $class: 'org.hyperledger.composer.system.BindIdentity',
                    certificate: 'daves cert',
                    participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#dave',
                    timestamp: '1970-01-01T00:00:00.000Z',
                    transactionId: '82b350a3-ecac-44e1-849a-24ff2cfa7db7'
                }
            ];
            return adminConnection._buildStartTransaction(businessNetworkDefinition, { bootstrapTransactions })
                .then((startTransactionJSON) => {
                    startTransactionJSON.should.deep.equal({
                        $class: 'org.hyperledger.composer.system.StartBusinessNetwork',
                        bootstrapTransactions,
                        businessNetworkArchive: 'UEsDBAoAAAAAAAAAIex5auUHJwAAACcAAAAMAAAAcGFja2FnZS5qc29ueyJuYW1lIjoibXktbmV0d29yayIsInZlcnNpb24iOiIxLjAuMCJ9UEsDBAoAAAAAAAAAIewAAAAAAAAAAAAAAAAHAAAAbW9kZWxzL1BLAwQKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAGxpYi9QSwECFAAKAAAAAAAAACHseWrlBycAAAAnAAAADAAAAAAAAAAAAAAAAAAAAAAAcGFja2FnZS5qc29uUEsBAhQACgAAAAAAAAAh7AAAAAAAAAAAAAAAAAcAAAAAAAAAAAAQAAAAUQAAAG1vZGVscy9QSwECFAAKAAAAAAAAACHsAAAAAAAAAAAAAAAABAAAAAAAAAAAABAAAAB2AAAAbGliL1BLBQYAAAAAAwADAKEAAACYAAAAAAA=',
                        timestamp: '1970-01-01T00:00:00.000Z',
                        transactionId: '47bc3a67-5599-4460-9745-6a291df4f879'
                    });
                });
        });

    });

    describe('Business Network Cards', function() {
        let peerAdminCard;
        let peerAdminCardExpectedName;
        let userCard;
        let userCardExpectedName;

        beforeEach(function() {
            const peerAdminMetadata = {
                userName: 'PeerAdmin',
                roles: [ 'PeerAdmin', 'ChannelAdmin' ]
            };
            const userMetadata = {
                userName: 'user',
                businessNetwork: 'penguin-network'
            };
            const connection = config;
            connection.card='user@penguin-network';
            connection.name='connectionName';
            peerAdminCard = new IdCard(peerAdminMetadata, connection);
            peerAdminCardExpectedName = peerAdminCard.getUserName() + '@' + peerAdminCard.getConnectionProfile().name;

            userCard = new IdCard(userMetadata, connection);
            userCardExpectedName = userCard.getUserName() + '@' + userCard.getBusinessNetworkName();
        });

        describe('#importCard', function() {

            beforeEach(()=>{
                mockConnectionManager.importIdentity.resolves();
                sinon.spy(userCard,'getCredentials');
            });

            it('should import card with name & credentials', function() {
                const cardName = 'conga';
                userCard.setCredentials({certificate: 'String', privateKey: 'String' });
                return adminConnection.importCard(userCard, cardName).then(() => {
                    return cardStore.get(cardName).should.eventually.deep.equal(userCard);
                });
            });

            it('should import card with name', function() {
                const cardName = 'conga';
                return adminConnection.importCard(userCard, cardName).then(() => {
                    return cardStore.get(cardName).should.eventually.deep.equal(userCard);
                });
            });

            it('should generate name for user card when no name supplied', function() {
                return adminConnection.importCard(userCard).then(() => {
                    return cardStore.get(userCardExpectedName).should.eventually.deep.equal(userCard);
                });
            });

            it('should generate name for PeerAdmin card when no name supplied', function() {
                return adminConnection.importCard(peerAdminCard).then(() => {
                    return cardStore.get(peerAdminCardExpectedName).should.eventually.deep.equal(peerAdminCard);
                });
            });

            it('should return provided card name', function() {
                const cardName = 'conga';
                return adminConnection.importCard(userCard, cardName).should.eventually.equal(cardName);
            });

            it('should return generated name for user card when no name supplied', function() {
                return adminConnection.importCard(userCard).should.eventually.equal(userCardExpectedName);
            });

            it('should return generated name for PeerAdmin card when no name supplied', function() {
                return adminConnection.importCard(peerAdminCard).should.eventually.equal(peerAdminCardExpectedName);
            });
        });

        describe('#getCard', ()=>{
            it('should return valid card if one exists', ()=>{
                const cardName = 'conga-card';
                return cardStore.put(cardName, peerAdminCard).then(() => {
                    return adminConnection.getCard('conga-card');
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.deep.equal('PeerAdmin');
                });
            });

        });

        describe('#getAllCards', function() {
            it('should return empty map when card store contains no cards', function() {
                return adminConnection.getAllCards().should.eventually.be.instanceOf(Map).that.is.empty;
            });

            it('should return map of cards when card store is not empty', function() {
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

        describe('#deleteCard', function() {
            it('should reject for non-existent card', function() {
                const cardName = 'conga-card';
                return adminConnection.deleteCard(cardName).should.be.rejectedWith(cardName);
            });

            it('should succeed for an existing card', function() {
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

        describe('#exportCard', ()=> {

            it('Card exists, but no credentials, call to export identity is correct executed',()=>{
                mockConnectionManager.exportIdentity = sinon.stub();
                mockConnectionManager.exportIdentity.resolves({ certificate: 'String', privateKey: 'String' });
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                sinon.spy(userCard,'setCredentials');
                return cardStore.put(userCardExpectedName, userCard).then(() => {
                    return adminConnection.exportCard(userCardExpectedName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.deep.equal('user');
                    sinon.assert.calledOnce(mockConnectionManager.exportIdentity);
                    sinon.assert.calledWith(userCard.setCredentials,{ certificate: 'String', privateKey: 'String' });
                });

            });

            it('Card exists, but with credentials',()=>{
                mockConnectionManager.exportIdentity = sinon.stub();
                userCard.setCredentials({ certificate: 'String', privateKey: 'String' });
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                return cardStore.put(userCardExpectedName, userCard).then(() => {
                    return adminConnection.exportCard(userCardExpectedName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.deep.equal('user');
                });

            });

            it('Card exists, but with no credentials or secret',()=>{
                mockConnectionManager.exportIdentity = sinon.stub();
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                return cardStore.put(userCardExpectedName, userCard).then(() => {
                    return adminConnection.exportCard(userCardExpectedName);
                }).should.eventually.be.rejectedWith(/no credentials or secret so is invalid/);

            });

            it('Card exists, but with no credentials but does have secret',()=>{
                mockConnectionManager.exportIdentity = sinon.stub();
                adminConnection.connection = mockConnection;
                adminConnection.securityContext = mockSecurityContext;

                const connection = config;
                connection.card='user@penguin-network';
                connection.name='connectionName';
                const userMetadata = {
                    userName: 'user',
                    businessNetwork: 'penguin-network',
                    enrollmentSecret: 'humbolt'
                };
                userCard = new IdCard(userMetadata, connection);


                return cardStore.put(userCardExpectedName, userCard).then(() => {
                    return adminConnection.exportCard(userCardExpectedName);
                }).then((result) => {
                    result.should.be.instanceOf(IdCard);
                    result.getUserName().should.deep.equal('user');
                });

            });
        });
    });

});
