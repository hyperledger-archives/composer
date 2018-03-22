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
const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const IdCard = require('composer-common').IdCard;
const NetworkCardStoreManager = require('composer-common').NetworkCardStoreManager;
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
    const sandbox = sinon.sandbox.create();

    const testProfileName = 'profile';
    const config = {
        name: testProfileName,
        'x-type': 'hlfv1'
    };

    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let adminConnection;
    let clock;
    let cardStore;
    let mockAdminIdCard;
    let secretCard;
    let credentialsCard;
    let faultyCard;

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockConnection = sinon.createStubInstance(Connection);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockSecurityContext.getConnection.returns(mockConnection);

        mockConnection.getConnectionManager.returns(mockConnectionManager);
        mockConnection.getIdentifier.returns('BNI@CP');
        mockConnection.disconnect.resolves();
        mockConnection.login.resolves(mockSecurityContext);
        mockConnection.install.resolves();
        mockConnection.start.resolves();
        mockConnection.ping.resolves();
        mockConnection.queryChainCode.resolves();
        mockConnection.invokeChainCode.resolves();
        mockConnection.upgrade.resolves();
        mockConnection.reset.resolves();
        mockConnection.list.resolves(['biznet1', 'biznet2']);

        mockConnectionManager.connect.resolves(mockConnection);

        cardStore = NetworkCardStoreManager.getCardStore( { type : 'composer-wallet-inmemory' });
        const adminConnectionOptions = { cardStore };
        adminConnection = new AdminConnection(adminConnectionOptions);

        adminConnection.securityContext = mockSecurityContext;
        mockAdminIdCard = sinon.createStubInstance(IdCard);
        mockAdminIdCard.getConnectionProfile.returns({name : 'profile', 'x-type' : 'test'});
        mockSecurityContext.card = mockAdminIdCard;
        sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManager').resolves(mockConnectionManager);
        sinon.stub(adminConnection.connectionProfileManager, 'getConnectionManagerByType').resolves(mockConnectionManager);
        delete process.env.COMPOSER_CONFIG;
        clock = sinon.useFakeTimers();
        let faultyMetaData = { userName: 'fred',

            description:'test'};

        let minimalMetadata = { userName: 'fred',
            businessNetwork:'network',
            description:'test'};
        let secretMetadata = { userName: 'fred',
            businessNetwork:'network',
            description:'test',
            enrollmentSecret : 'password' };
        let minimalConnectionProfile = config;
        let validCredentials = {
            certificate: 'cert',
            privateKey: 'key'
        };

        secretCard = new IdCard(secretMetadata, minimalConnectionProfile);
        faultyCard = new IdCard(faultyMetaData, minimalConnectionProfile);
        credentialsCard = new IdCard(minimalMetadata, minimalConnectionProfile);
        credentialsCard.setCredentials(validCredentials);

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

    });

    describe('#connect', () => {


        beforeEach(() => {

            sinon.spy(cardStore, 'get');
            return cardStore.put('secretCardname', secretCard).then(()=>{
                sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
                return cardStore.put('testCardname', credentialsCard);
            }).then(()=>{
                return cardStore.put('faultyCardname', faultyCard);
            });

        });

        it('should connect and login when card has secret', () => {
            return adminConnection.connect('secretCardname').then(() => {
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData, config, 'network',sinon.match({cardName : 'secretCardname'}));
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'fred', 'password');
            });
        });

        it('should connect and login when card has certificates', () => {

            return adminConnection.connect('testCardname').then(() => {
                sinon.assert.calledOnce(adminConnection.connectionProfileManager.connectWithData);
                sinon.assert.calledWith(adminConnection.connectionProfileManager.connectWithData, config, 'network',sinon.match({cardName : 'testCardname'}));
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
            return adminConnection.connect('faultyCardname').then(() => {
                sinon.assert.notCalled(mockConnection.ping);
            });
        });
    });

    describe('#disconnect', () => {


        beforeEach(() => {
            sinon.spy(cardStore, 'get');
            return cardStore.put('secretCardname', secretCard).then(()=>{
                sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
                return cardStore.put('testCardname', credentialsCard);
            }).then(()=>{
                return cardStore.put('faultyCardname', faultyCard);
            });

        });

        it('should set connection and security context to null if connection is set', () => {
            return adminConnection.connect('testCardname')
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
        const networkName = 'network-name';
        const networkVersion = '1.0.0-test';
        const identityName = 'admin';
        const networkAdmins = [
            { userName: 'admin', enrollmentSecret: 'adminpw' },
            { userName: 'adminc', certificate: 'certcertcert'}
        ];
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

        const expectedStartTransaction = {
            $class : 'org.hyperledger.composer.system.StartBusinessNetwork',
            timestamp : '1970-01-01T00:00:00.000Z',
            transactionId : sinon.match.string
        };
        const expectedNetworkAdminBootstrapTransactions = {
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
                    transactionId : sinon.match.string
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
                    transactionId : sinon.match.string
                },
                {
                    $class : 'org.hyperledger.composer.system.IssueIdentity',
                    identityName : 'admin',
                    participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#admin',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : sinon.match.string
                },
                {
                    $class : 'org.hyperledger.composer.system.BindIdentity',
                    certificate : 'certcertcert',
                    participant : 'resource:org.hyperledger.composer.system.NetworkAdmin#adminc',
                    timestamp : '1970-01-01T00:00:00.000Z',
                    transactionId : sinon.match.string
                }
            ]
        };

        beforeEach(() => {
            mockSecurityContext.getUser.returns(identityName);
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
        });

        it('should error if neither networkAdmins or bootstrapTransactions specified', () => {
            return adminConnection.start(networkName, networkVersion, { })
                .should.be.rejectedWith('No network administrators or bootstrap transactions are specified');
        });

        it('should error if both networkAdmins and bootstrapTransactions specified', () => {
            return adminConnection.start(networkName, networkVersion, {
                networkAdmins: networkAdmins,
                bootstrapTransactions: bootstrapTransactions
            }).should.be.rejectedWith('You cannot specify both network administrators and bootstrap transactions');
        });

        it('should error if no userName specified for network admin', () => {
            return adminConnection.start(networkName, networkVersion, {
                networkAdmins : [ { enrollmentSecret  : 'adminpw' } ]
            }).should.be.rejectedWith('A user name must be specified for all network administrators');
        });

        it('should error if no secret or certificate specified for network admin', () => {
            return adminConnection.start(networkName, networkVersion, {
                networkAdmins : [ { userName : 'admin' } ]
            }).should.be.rejectedWith('Either a secret or a certificate must be specified for all network administrators');
        });


        it('should create valid start transaction', () => {
            return adminConnection.start(networkName, networkVersion, { networkAdmins: networkAdmins })
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { });
                    const actualStartTransactions = JSON.parse(mockConnection.start.getCall(0).args[3]);
                    sinon.assert.match(actualStartTransactions, expectedStartTransaction);
                });
        });

        it('should create bootstrap transactions for network admins', () => {
            return adminConnection.start(networkName, networkVersion, { networkAdmins: networkAdmins })
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { });
                    const actualStartTransactions = JSON.parse(mockConnection.start.getCall(0).args[3]);
                    sinon.assert.match(actualStartTransactions, expectedNetworkAdminBootstrapTransactions);
                });
        });

        it('should pass start options not modelled in the start transaction on to connector', () => {
            return adminConnection.start(networkName, networkVersion, {
                opt : 1,
                networkAdmins: networkAdmins
            })
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { opt: 1 });
                });
        });

        it('should create bootstrap transactions for network admins with empty bootstrap transactions start option', () => {
            return adminConnection.start(networkName, networkVersion, {
                bootstrapTransactions: [ ],
                networkAdmins: networkAdmins
            })
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { });
                    const actualStartTransactions = JSON.parse(mockConnection.start.getCall(0).args[3]);
                    sinon.assert.match(actualStartTransactions, expectedNetworkAdminBootstrapTransactions);
                });
        });

        it('should include in start transactions modelled properties from start options', () => {
            const logLevel = 'DEBUG';
            return adminConnection.start(networkName, networkVersion, {
                logLevel: logLevel,
                networkAdmins: networkAdmins
            })
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { });
                    const actualStartTransactions = JSON.parse(mockConnection.start.getCall(0).args[3]);
                    sinon.assert.match(actualStartTransactions, { logLevel: logLevel });
                });
        });

        it('should use supplied bootstrap transactions when no network admins specified', () => {
            const startOptions = {
                bootstrapTransactions: bootstrapTransactions
            };
            return adminConnection.start(networkName, networkVersion, startOptions)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.start);
                    sinon.assert.calledWith(mockConnection.start, mockSecurityContext, networkName, networkVersion, sinon.match.string, { });
                    const actualStartTransactions = JSON.parse(mockConnection.start.getCall(0).args[3]);
                    sinon.assert.match(actualStartTransactions, startOptions);
                });
        });

    });

    describe('#upgrade', () => {

        it('should be able to upgrade a composer runtime', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.upgrade('name', '1.0.1', {'foo':'bar'})
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.upgrade);
                    sinon.assert.calledWith(mockConnection.upgrade, mockSecurityContext, 'name', '1.0.1', {'foo':'bar'});
                });
        });
    });

    describe('#undeploy', () => {
        it('should call undeploy on the connection', async () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            const networkName = 'conga';
            await adminConnection.undeploy(networkName);
            sinon.assert.calledWith(mockConnection.undeploy, mockSecurityContext, networkName);
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
            return cardStore.put('secretCardname', secretCard).then(()=>{
                sinon.stub(adminConnection.connectionProfileManager, 'connectWithData').resolves(mockConnection);
                return cardStore.put('testCardname', credentialsCard);
            }).then(()=>{
                return cardStore.put('faultyCardname', faultyCard);
            });
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

            return adminConnection.requestIdentity('secretCardname')
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
                    sinon.assert.calledWith(mockConnectionManager.removeIdentity, 'connectionName', sinon.match(expectedConnection), 'user');
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

            it('should not add card to card store if importIdentity fails', function() {
                const cardName = 'conga';
                const certificate = 'CERTIFICATE_DATA';
                const privateKey = 'PRIVATE_KEY_DATA';
                userCard.setCredentials({certificate : certificate, privateKey : privateKey});
                mockConnectionManager.importIdentity.rejects(new Error('importIdentity'));
                return adminConnection.importCard(cardName, userCard).should.be.rejected.then(() => {
                    return cardStore.has(cardName).should.become(false);
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
