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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const ComboConnectionProfileStore = require('composer-common').ComboConnectionProfileStore;
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const FSConnectionProfileStore = require('composer-common').FSConnectionProfileStore;
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

    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let adminConnection;
    let sandbox;
    let clock;

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
        mockConnection.list.resolves(['biznet1', 'biznet2']);

        mockConnectionManager.connect.resolves(mockConnection);
        adminConnection = new AdminConnection();
        adminConnection.securityContext = mockSecurityContext;
        sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManager').resolves(mockConnectionManager);
        sinon.stub(adminConnection.connectionProfileStore, 'save').withArgs('testprofile', sinon.match.any).resolves();
        sinon.stub(adminConnection.connectionProfileStore, 'load').withArgs('testprofile').resolves(config);
        sinon.stub(adminConnection.connectionProfileStore, 'loadAll').resolves({ profile1: config, profile2: config2 });
        sinon.stub(adminConnection.connectionProfileStore, 'delete').withArgs('testprofile').resolves();
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

    });

    describe('#connect', () => {

        it('should connect, login and ping if business network specified', () => {
            return adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d', 'testnetwork')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.login);
                    sinon.assert.calledWith(mockConnection.login, 'WebAppAdmin', 'DJY27pEnl16d');
                    sinon.assert.calledOnce(mockConnection.ping);
                    sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
                });
        });

        it('should connect and login if business network not specified', () => {
            return adminConnection.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.login);
                    sinon.assert.calledWith(mockConnection.login, 'WebAppAdmin', 'DJY27pEnl16d');
                    sinon.assert.notCalled(mockConnection.ping);
                });
        });

    });

    describe('#createProfile', () => {
        it('should return a resolved promise', () => {
            return adminConnection.createProfile('testprofile', config)
                .should.be.fulfilled;
        });
    });

    describe('#deleteProfile', () => {
        it('should return a resolved promise', () => {
            return adminConnection.deleteProfile('testprofile', config)
                .should.be.fulfilled;
        });
    });

    describe('#getProfile', () => {

        it('should return the specified profile', () => {
            return adminConnection.getProfile('testprofile')
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
        it('should set connection and security context to null', () => {
            let adminConnection = new AdminConnection();
            sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
            return adminConnection.connect()
            .then(() => {
                return adminConnection.disconnect();
            })
            .then(() => {
                should.equal(adminConnection.connection, null);
                should.equal(adminConnection.securityContext, null);
            });
        });

        it('should not fail when no connection is set', () => {
            let adminConnection = new AdminConnection();
            return adminConnection.disconnect();
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
            return adminConnection.start(businessNetworkDefinition)
            .then(() => {
                sinon.assert.calledOnce(mockConnection.start);
                sinon.assert.calledWith(mockConnection.start, mockSecurityContext, businessNetworkDefinition);
            });
        });

        it('should be able to start a business network definition with start options', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            return adminConnection.start(businessNetworkDefinition, {opt: 1})
            .then(() => {
                sinon.assert.calledOnce(mockConnection.start);
                sinon.assert.calledWith(mockConnection.start, mockSecurityContext, businessNetworkDefinition, {opt: 1});
            });
        });

    });

    describe('#upgrade', () => {

        it('should be able to upgrade a composer runtime', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.upgrade('org-acme-biznet')
            .then(() => {
                sinon.assert.calledOnce(mockConnection.upgrade);
                sinon.assert.calledWith(mockConnection.upgrade, mockSecurityContext, 'org-acme-biznet');
            });
        });
    });

    describe('#deploy', () => {

        it('should be able to deploy a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            return adminConnection.deploy(businessNetworkDefinition)
            .then(() => {
                sinon.assert.calledOnce(mockConnection.deploy);
                sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, businessNetworkDefinition);
            });
        });

        it('should be able to deploy a business network definition with deployOptions', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            return adminConnection.deploy(businessNetworkDefinition, {opt: 1})
            .then(() => {
                sinon.assert.calledOnce(mockConnection.deploy);
                sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext, businessNetworkDefinition, {opt: 1});
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
            mockConnection.invokeChainCode.withArgs(mockSecurityContext, 'submitTransaction', ['default', '{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity"}']).resolves();
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
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['default', '{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1","timestamp":"1970-01-01T00:00:00.000Z"}']);
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
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'submitTransaction', ['default', '{"$class":"org.hyperledger.composer.system.ActivateCurrentIdentity","transactionId":"c89291eb-969f-4b04-b653-82deb5ee0ba1","timestamp":"1970-01-01T00:00:00.000Z"}']);
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
                sinon.assert.calledOnce(mockConnection.invokeChainCode);
                sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'setLogLevel', ['ERROR']);
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
            return adminConnection.importIdentity('testprofile', 'anid', 'acerttosign', 'akey')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.importIdentity);
                    sinon.assert.calledWith(mockConnectionManager.importIdentity, 'testprofile', config, 'anid', 'acerttosign', 'akey');
                });
        });

        it('should throw an error if import fails', () => {
            mockConnectionManager.importIdentity = sinon.stub();
            mockConnectionManager.importIdentity.rejects(new Error('no identity imported'));
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.importIdentity('testprofile', 'anid', 'acerttosign', 'akey')
                .should.be.rejectedWith(/no identity imported/);
        });


    });

});
