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
const sinon = require('sinon');

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const BusinessNetworkMetadata = require('composer-common').BusinessNetworkMetadata;
const Logger = require('composer-common').Logger;

const Channel = require('fabric-client/lib/Channel');
const Peer = require('fabric-client/lib/Peer');
const Client = require('fabric-client');
const EventHub = require('fabric-client/lib/EventHub');
const TransactionID = require('fabric-client/lib/TransactionID.js');
const User = require('fabric-client/lib/User.js');

const FabricCAClientImpl = require('fabric-ca-client');

const HLFConnection = require('../lib/hlfconnection');
const HLFConnectionManager = require('../lib/hlfconnectionmanager');
const HLFSecurityContext = require('../lib/hlfsecuritycontext');

const path = require('path');
const semver = require('semver');
const fs = require('fs-extra');

const connectorPackageJSON = require('../package.json');
const originalVersion = connectorPackageJSON.version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));


//TODO: Ideally we should stub out hlftxeventhandler.
describe('HLFConnection', () => {

    const sandbox = sinon.sandbox.create();

    let mockConnectionManager, mockChannel, mockClient, mockEventHub, mockCAClient, mockUser, mockSecurityContext, mockBusinessNetwork, mockPeer1, mockPeer2, mockPeer3;
    let connectOptions;
    let connection;
    let mockEventHubDef, mockTransactionID, logWarnSpy;

    beforeEach(() => {
        const LOG = Logger.getLog('HLFConnection');
        logWarnSpy = sandbox.spy(LOG, 'warn');
        mockConnectionManager = sinon.createStubInstance(HLFConnectionManager);
        mockChannel = sinon.createStubInstance(Channel);
        mockClient = sinon.createStubInstance(Client);
        mockEventHub = sinon.createStubInstance(EventHub);
        mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
        mockUser = sinon.createStubInstance(User);
        mockTransactionID = sinon.createStubInstance(TransactionID);
        mockTransactionID.getTransactionID.returns('00000000-0000-0000-0000-000000000000');
        mockClient.newTransactionID.returns(mockTransactionID);
        mockSecurityContext = sinon.createStubInstance(HLFSecurityContext);
        mockBusinessNetwork = new BusinessNetworkDefinition('org-acme-biznet@1.0.0');
        sandbox.stub(mockBusinessNetwork, 'toArchive').resolves(Buffer.from('hello world'));
        mockChannel.getName.returns('testchainid');
        mockPeer1 = sinon.createStubInstance(Peer);
        mockPeer1.getName.returns('Peer1');
        mockPeer2 = sinon.createStubInstance(Peer);
        mockPeer2.getName.returns('Peer2');
        mockPeer3 = sinon.createStubInstance(Peer);
        mockPeer3.getName.returns('Peer3');
        connection = new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), {}, mockClient, mockChannel, mockCAClient);
    });

    afterEach(() => {
        sandbox.restore();
        connectorPackageJSON.version = originalVersion;
    });

    describe('#createUser', () => {

        it('should create a new user', () => {
            let user = HLFConnection.createUser('admin', mockClient);
            user.should.be.an.instanceOf(User);
        });

    });

    describe('#_getLoggedInUser', () => {

        it('should return the current user', () => {
            connection.user = 'CurrentUser';
            connection._getLoggedInUser().should.equal('CurrentUser');
        });

    });

    describe('#constructor', () => {

        it('should throw if connectOptions not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), null, mockClient, mockChannel, mockCAClient);
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw if client not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), { type: 'hlfv1' }, null, mockChannel, mockCAClient);
            }).should.throw(/client not specified/);
        });

        it('should throw if channel not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), { type: 'hlfv1' }, mockClient, null, mockCAClient);
            }).should.throw(/channel not specified/);
        });


        it('should throw if caClient not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), { type: 'hlfv1' }, mockClient, mockChannel, null);
            }).should.throw(/caClient not specified/);
        });
    });

    describe('#_connectToEventHubs', () => {
        beforeEach(() => {
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
        });

        it('should ignore a disconnected event hub on process exit', () => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockEventHub.isconnected.returns(false);
            connection._connectToEventHubs();
            sinon.assert.calledOnce(process.on);
            sinon.assert.calledWith(process.on, 'exit');
            sinon.assert.notCalled(mockEventHub.disconnect);
        });

        it('should disconnect a connected event hub on process exit', () => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockEventHub.isconnected.returns(true);
            connection._connectToEventHubs();
            sinon.assert.calledOnce(process.on);
            sinon.assert.calledWith(process.on, 'exit');
            sinon.assert.calledOnce(mockEventHub.disconnect);
        });

        it('should subscribe to the eventHub and emit events', () => {
            connection._connectToEventHubs();
            const events = {
                payload: {
                    toString: () => {
                        return '{"event":"event"}';
                    }
                }
            };
            connection.emit = sandbox.stub();
            mockEventHub.registerChaincodeEvent.withArgs(mockBusinessNetwork.getName(), 'composer', sinon.match.func).yield(events);
            sinon.assert.calledOnce(mockEventHub.registerChaincodeEvent);
            sinon.assert.calledWith(mockEventHub.registerChaincodeEvent, mockBusinessNetwork.getName(), 'composer', sinon.match.func);
            sinon.assert.calledOnce(connection.emit);
            sinon.assert.calledWith(connection.emit, 'events', {'event':'event'});
        });

        it('should not register any listeners for chaincode events if no business network is specified', () => {
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', null, {}, mockClient, mockChannel, mockCAClient);
            connection._connectToEventHubs();
            sinon.assert.notCalled(mockEventHub.registerChaincodeEvent);
            connection.ccEvents.length.should.equal(0);

        });

        it('should do nothing and not register an exit handler if there are no eventhubs', () => {
            mockClient.getEventHubsForOrg.returns([]);
            sandbox.stub(process, 'on');
            connection._connectToEventHubs();
            sinon.assert.notCalled(mockEventHub.registerChaincodeEvent);
            sinon.assert.notCalled(process.on);
        });

    });

    describe('#disconnect', () => {
        beforeEach(() => {
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
            mockEventHub.registerChaincodeEvent.withArgs(mockBusinessNetwork.getName(), 'composer', sinon.match.func).returns('events');
        });

        it('should unregister the exit listener', () => {
            let stubExit = sandbox.stub(process, 'on').withArgs('exit').yields();
            let stubRemove = sandbox.stub(process, 'removeListener');
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', null, {}, mockClient, mockChannel, [mockEventHub], mockCAClient);
            connection._connectToEventHubs();
            sinon.assert.calledOnce(stubExit);
            let exitListener = stubExit.firstCall.args[0];

            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(stubRemove);
                    sinon.assert.calledWith(stubRemove, exitListener);
                });


        });

        it('should not unregister any chaincode listeners if non were setup', () => {
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', null, {}, mockClient, mockChannel, [mockEventHub], mockCAClient);
            connection._connectToEventHubs();
            return connection.disconnect()
                .then(() => {
                    sinon.assert.notCalled(mockEventHub.unregisterChaincodeEvent);
                });
        });

        it('should unregister a registered chaincode listener', () => {
            mockEventHub.unregisterChaincodeEvent.returns(true);
            connection._connectToEventHubs();
            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockEventHub.unregisterChaincodeEvent);
                    sinon.assert.calledWith(mockEventHub.unregisterChaincodeEvent, 'events');
                });
        });

        it('should disconnect from the event hub if connected', () => {
            mockEventHub.isconnected.returns(true);
            connection._connectToEventHubs();
            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockEventHub.disconnect);
                });
        });

        it('should not disconnect from the event hub if not connected', () => {
            mockEventHub.isconnected.returns(false);
            connection._connectToEventHubs();
            return connection.disconnect()
                .then(() => {
                    sinon.assert.notCalled(mockEventHub.disconnect);
                });
        });

        it('should handle an error disconnecting from the event hub', () => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            connection._connectToEventHubs();
            mockEventHub.isconnected.throws(new Error('such error'));
            return connection.disconnect()
                .should.be.rejectedWith(/such error/);
        });

        it('should handle being called twice', () => {
            mockEventHub.isconnected.returns(true);
            connection._connectToEventHubs();
            return connection.disconnect()
                .then(() => {
                    mockEventHub.isconnected.returns(false);
                    return connection.disconnect();
                })
                .then(() => {
                    sinon.assert.calledOnce(mockEventHub.disconnect);
                });
        });

    });

    describe('#enroll', () => {

        beforeEach(() => {
            sandbox.stub(HLFConnection, 'createUser').returns(mockUser);
            sandbox.stub(connection, '_initializeChannel').resolves();
        });

        it('should reject if enrollmentID not specified', () => {
            return connection.enroll(null, 'adminpw')
                .should.be.rejectedWith(/enrollmentID not specified/);
        });

        it('should reject if enrollmentSecret not specified', () => {
            return connection.enroll('admin', null)
                .should.be.rejectedWith(/enrollmentSecret not specified/);
        });

        it('should enroll and store the user context using the CA client', () => {
            mockClient.getMspid.returns('suchmsp');
            mockCAClient.enroll.withArgs({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' }).resolves({
                key: 'suchkey',
                certificate: 'suchcert'
            });
            return connection.enroll('admin', 'adminpw')
                .then(() => {
                    sinon.assert.calledOnce(mockUser.setEnrollment);
                    sinon.assert.calledWith(mockUser.setEnrollment, 'suchkey', 'suchcert', 'suchmsp');
                    sinon.assert.calledOnce(mockClient.setUserContext);
                    sinon.assert.calledWith(mockClient.setUserContext, mockUser);
                });
        });

        it('should handle an error from enrollment', () => {
            mockCAClient.enroll.withArgs({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' }).rejects('such error');
            return connection.enroll('admin', 'adminpw')
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#login', () => {

        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
        });

        it('should reject if identity not specified', () => {
            return connection.login(null, 'adminpw')
                .should.be.rejectedWith(/identity not specified/);
        });

        it('should load an already enrolled user from the state store', () => {
            mockClient.getUserContext.withArgs('admin').resolves(mockUser);
            mockUser.isEnrolled.returns(true);
            return connection.login('admin', 'adminpw')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(HLFSecurityContext);
                    securityContext.getUser().should.equal('admin');
                });
        });

        it('should enroll a user if not already enrolled', () => {
            mockClient.getUserContext.withArgs('admin').resolves(null);
            sandbox.stub(connection, 'enroll').withArgs('admin', 'adminpw').resolves(mockUser);
            return connection.login('admin', 'adminpw')
                .then((securityContext) => {
                    securityContext.should.be.an.instanceOf(HLFSecurityContext);
                    securityContext.getUser().should.equal('admin');
                });
        });

        it('should handle an error from the client', () => {
            mockClient.getUserContext.withArgs('admin').rejects('such error');
            return connection.login('admin', 'adminpw')
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#install', () => {

        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
            sandbox.stub(connection,'getChannelPeersInOrg').returns([mockPeer1]);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'writeFileSync').returns();
        });

        it('should reject if businessNetworkDefinition not specified', () => {
            return connection.install(mockSecurityContext, null)
                .should.be.rejectedWith(/businessNetworkDefinition not specified/);
        });

        it('should install the business network', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: proposalResponses});
            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodeType: 'node',
                        chaincodePath: sinon.match.string,
                        chaincodeVersion: mockBusinessNetwork.getVersion(),
                        chaincodeId: mockBusinessNetwork.getName(),
                        txId: mockTransactionID,
                        targets: [mockPeer1]
                    });
                });
        });

        it('should include an npmrc file if specified', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: proposalResponses});
            return connection.install(mockSecurityContext, mockBusinessNetwork, {npmrcFile: '/some/file'})
                .then(() => {
                    sinon.assert.calledWith(connection.fs.copy, '/some/file', sinon.match(/\/.npmrc$/));
                });
        });

        it('should copy .tgz package dependencies', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };

            const tgzFileName = 'XYZ.tgz';
            const tgzDependency = { 'testDependency': tgzFileName };

            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: proposalResponses});
            const stubMetadata = sinon.createStubInstance(BusinessNetworkMetadata);
            stubMetadata.getPackageJson.returns({ dependencies: tgzDependency });
            sandbox.stub(mockBusinessNetwork, 'getMetadata').returns(stubMetadata);

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    const expected = (value => path.basename(value) === tgzFileName);
                    sinon.assert.calledWithMatch(connection.fs.copy, expected, expected);
                });
        });

        it('should not copy any .tgz dependencies if none included', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };

            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: proposalResponses});
            const stubMetadata = sinon.createStubInstance(BusinessNetworkMetadata);
            stubMetadata.getPackageJson.returns({ dependencies: { } });
            sandbox.stub(mockBusinessNetwork, 'getMetadata').returns(stubMetadata);
            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    const unexpected = /.tgz$/;
                    sinon.assert.neverCalledWithMatch(connection.fs.copy, unexpected, unexpected);
                });
        });

        it('should throw an error if specified npmrcFile doesn\'t exist', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: proposalResponses});
            connection.fs.copy.withArgs('/some/file', sinon.match(/\/.npmrc$/)).rejects(new Error('ENOENT: no such file or directory, lstat \'/some/file\''));
            return connection.install(mockSecurityContext, mockBusinessNetwork, {npmrcFile: '/some/file'})
                .should.be.rejectedWith(/ENOENT/);
        });

        it('should throw error if peer rejects installation', () => {
            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);

            sandbox.stub(connection, '_validatePeerResponses').throws(new Error('Some error occurs'));

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Some error occurs/);
        });

        it('should throw error if all peers says chaincode already installed and from deploy flag not defined', () => {
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp, errorResp, errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 3, validResponses: []});

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/already installed on all/);
        });

        it('should not throw an error and return false for chaincode installed if from deploy flag set', () => {
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp, errorResp, errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 3, validResponses: []});

            return connection.install(mockSecurityContext, mockBusinessNetwork, {calledFromDeploy: true})
            .then((chaincodeInstalled) => {
                chaincodeInstalled.should.be.false;
                sinon.assert.calledOnce(mockClient.installChaincode);
            });
        });

        it('should throw an error if it only installs chaincode on some of the peers that need chaincode installed', () => {
            const goodResp = {
                response: {
                    status: 200
                }
            };
            const errorResp = new Error('Failed to install, not because it exists');
            const installResponses = [errorResp, goodResp, errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: [goodResp], invalidResponseMsgs: [errorResp]});

            return connection.install(mockSecurityContext, mockBusinessNetwork)
        .should.be.rejectedWith(/failed to install on 1 .* not because it exists/);
        });

        it('should install chaincode on peers that still need chaincode to be installed', () => {
            const goodResp = {
                response: {
                    status: 200
                }
            };
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp, goodResp, errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 2, validResponses: [goodResp]});

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .then((chaincodeInstalled) => {
                    chaincodeInstalled.should.be.true;
                    sinon.assert.calledOnce(mockClient.installChaincode);
                });
        });

        it('should not throw an error and return false for chaincode installed if from deploy flag set', () => {
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp, errorResp, errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 3, validResponses: []});

            return connection.install(mockSecurityContext, mockBusinessNetwork, {calledFromDeploy: true})
            .then((chaincodeInstalled) => {
                chaincodeInstalled.should.be.false;
                sinon.assert.calledOnce(mockClient.installChaincode);
            });
        });
    });

    describe('#_createPackageDependencies', () => {
        it('should not modify dependencies if all required present', () => {
            const testVersion = '0.0.1-banana';
            const dependencies = {
                'composer-runtime-hlfv1': testVersion,
                'banana': testVersion
            };
            connection._createPackageDependencies(dependencies).should.equal(dependencies);
        });

        it('should add required dependencies if none supplied', () => {
            connection._createPackageDependencies().should.have.all.keys(
                'composer-runtime-hlfv1'
            );
        });
    });

    describe('#__addEndorsementPolicy', () => {
        it('should handle an endorsement policy string', () => {
            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            const policy = JSON.parse(policyString);
            const options = {
                endorsementPolicy : policyString
            };
            const request = {};

            connection._addEndorsementPolicy(options, request);
            request.should.deep.equal({
                'endorsement-policy': policy
            });
        });

        it('should handle an endorsement policy object', () => {
            const policy = {
                identities: [
                    { role: { name: 'member', mspId: 'Org1MSP' }},
                    { role: { name: 'member', mspId: 'Org2MSP' }},
                    { role: { name: 'admin', mspId: 'Org1MSP' }}
                ],
                policy: {
                    '1-of': [
                        { 'signed-by': 2},
                        { '2-of': [{ 'signed-by': 0}, { 'signed-by': 1 }]}
                    ]
                }
            };
            const options = {
                endorsementPolicy : policy
            };
            const request = {};

            connection._addEndorsementPolicy(options, request);
            request.should.deep.equal({
                'endorsement-policy': policy
            });
        });

        it('should handle an endorsement policy in a file', () => {
            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const options = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            const request = {};

            connection._addEndorsementPolicy(options, request);
            request.should.deep.equal({
                'endorsement-policy': JSON.parse(policyString)
            });
        });


        it('should throw an error if the policy string isn\'t valid json', () => {
            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            const options = {
                endorsementPolicy : policyString
            };
            (() => {
                connection._addEndorsementPolicy(options, {});
            }).should.throw(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file doesn\'t exist', () => {
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').throws(new Error('ENOENT'));
            const options = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            (() => {
                connection._addEndorsementPolicy(options, {});
            }).should.throw(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file isn\'t valid json', () => {
            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const options = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            (() => {
                connection._addEndorsementPolicy(options, {});
            }).should.throw(/Error trying parse endorsement policy/);
        });


    });

    describe('start and upgrade', () => {
        let validProposalResponses;
        let sendTransactionSuccessResponse;

        let expectedProposal;

        /**
         * Fake implementation of a Fabric proposal returning a successful result.
         * @param {Object} request Proposal request
         * @return {Array} Prposal response
         * @async
         */
        async function fakeSuccessfulProposal(request) {
            const proposal = Object.assign({}, request);
            // The proposal returned within the proposal response appears to have the transaction ID removed
            delete proposal.txId;
            return [ validProposalResponses, proposal ];
        }

        beforeEach(() => {
            validProposalResponses = [{
                response: { status: 200 }
            }];
            sendTransactionSuccessResponse = { status: 'SUCCESS' };

            expectedProposal = {
                chaincodeType: 'node',
                chaincodeVersion: mockBusinessNetwork.getVersion(),
                chaincodeId: mockBusinessNetwork.getName(),
                txId: mockTransactionID,
            };

            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: validProposalResponses});
            sandbox.stub(connection, '_initializeChannel').resolves();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);

            connection._connectToEventHubs();
        });

        describe('#start', () => {
            beforeEach(() => {
                expectedProposal.fcn = 'start';
                expectedProposal.args = ['{"start":"json"}'];
                mockChannel.sendInstantiateProposal.callsFake(fakeSuccessfulProposal);
            });

            it('should throw if business network name not specified', () => {
                return connection.start(mockSecurityContext, undefined, mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .should.be.rejectedWith(/network name/i);
            });

            it('should throw if business network version not specified', () => {
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), undefined, '{"start":"json"}')
                    .should.be.rejectedWith(/network version/i);
            });

            it('should throw if startTransaction not specified', () => {
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), undefined)
                .should.be.rejectedWith(/start transaction/i);
            });

            it('should request an event timeout based on connection settings', () => {
                connectOptions = {
                    'x-commitTimeout': 22
                };
                connection = new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
                sandbox.stub(connection, '_validatePeerResponses').callsFake(responses => {
                    return {
                        ignoredErrors: 0,
                        validResponses: responses
                    };
                });
                sandbox.stub(connection, '_initializeChannel').resolves();
                connection._connectToEventHubs();
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                sandbox.stub(global, 'setTimeout').yields();
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .should.be.rejectedWith(/Failed to receive commit notification/)
                    .then(() => {
                        sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                        sinon.assert.calledWith(global.setTimeout, sinon.match.func, 22 * 1000);
                    });
            });

            it('should start the business network with endorsement policy object', () => {
                sandbox.stub(global, 'setTimeout');

                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                const policy = {
                    identities: [
                        { role: { name: 'member', mspId: 'Org1MSP' }},
                        { role: { name: 'member', mspId: 'Org2MSP' }},
                        { role: { name: 'admin', mspId: 'Org1MSP' }}
                    ],
                    policy: {
                        '1-of': [
                            { 'signed-by': 2},
                            { '2-of': [{ 'signed-by': 0}, { 'signed-by': 1 }]}
                        ]
                    }
                };
                const deployOptions = {
                    endorsementPolicy : policy
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                    .then(() => {
                        sinon.assert.calledOnce(connection._initializeChannel);
                        sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                        expectedProposal['endorsement-policy'] = policy;
                        sinon.assert.calledWith(mockChannel.sendInstantiateProposal, expectedProposal);

                        sinon.assert.calledOnce(mockChannel.sendTransaction);
                    });
            });

            it('should start the business network with endorsement policy string', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
                const policy = JSON.parse(policyString);
                const deployOptions = {
                    endorsementPolicy : policyString
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                    .then(() => {
                        sinon.assert.calledOnce(connection._initializeChannel);
                        sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                        expectedProposal['endorsement-policy'] = policy;
                        sinon.assert.calledWith(mockChannel.sendInstantiateProposal, expectedProposal);

                        sinon.assert.calledOnce(mockChannel.sendTransaction);
                    });
            });

            it('should start the business network with endorsement policy file', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
                sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
                const deployOptions = {
                    endorsementPolicyFile : '/path/to/options.json'
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                    .then(() => {
                        sinon.assert.calledOnce(connection._initializeChannel);
                        sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                        expectedProposal['endorsement-policy'] = JSON.parse(policyString);
                        sinon.assert.calledWith(mockChannel.sendInstantiateProposal, expectedProposal);

                        sinon.assert.calledOnce(mockChannel.sendTransaction);
                    });
            });

            it('should start the business network and ignore unrecognized options', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                const deployOptions = {
                    foobar: true
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                    .then(() => {
                        sinon.assert.calledOnce(connection._initializeChannel);
                        sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                        sinon.assert.calledWith(mockChannel.sendInstantiateProposal, expectedProposal);

                        sinon.assert.calledOnce(mockChannel.sendTransaction);
                    });
            });

            it('should throw an error if the policy string isn\'t valid json', () => {
                const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
                const deployOptions = {
                    endorsementPolicy : policyString
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                .should.be.rejectedWith(/Error trying parse endorsement policy/);
            });

            it('should throw an error if the policy file doesn\'t exist', () => {
                sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').throws(new Error('ENOENT'));
                const deployOptions = {
                    endorsementPolicyFile : '/path/to/options.json'
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                .should.be.rejectedWith(/Error trying parse endorsement policy/);
            });

            it('should throw an error if the policy file isn\'t valid json', () => {
                const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
                sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
                const deployOptions = {
                    endorsementPolicyFile : '/path/to/options.json'
                };
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}', deployOptions)
                .should.be.rejectedWith(/Error trying parse endorsement policy/);
            });

            it('should start the business network with no debug level specified', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .then(() => {
                        sinon.assert.calledOnce(connection._initializeChannel);
                        sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                        sinon.assert.calledWith(mockChannel.sendInstantiateProposal, expectedProposal);

                        sinon.assert.calledOnce(mockChannel.sendTransaction);
                    });
            });

            it('should throw any instantiate fails to validate', () => {
                const errorResp = new Error('such error');
                const instantiateResponses = [ errorResp ];
                const proposal = { proposal: 'i do' };
                const header = { header: 'gooooal' };
                mockChannel.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
                //TODO:
                connection._validatePeerResponses.withArgs(instantiateResponses).throws(errorResp);
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .should.be.rejectedWith(/such error/);
            });

            it('should throw an error if the orderer responds with an error', () => {
                const failureResponse = {
                    status: 'FAILURE'
                };
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(failureResponse);
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .should.be.rejectedWith(/Failed to send/);
            });

            it('should throw an error if peer says transaction not valid', () => {
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response to indicate transaction not valid
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
                return connection.start(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion(), '{"start":"json"}')
                    .should.be.rejectedWith(/Peer has rejected transaction '00000000-0000-0000-0000-000000000000'/);
            });
        });

        describe('#upgrade', () => {
            beforeEach(() => {
                expectedProposal.fcn = 'upgrade';
                mockChannel.sendUpgradeProposal.callsFake(fakeSuccessfulProposal);
            });

            it('should throw if business network name not specified', () => {
                return connection.upgrade(mockSecurityContext, null)
                    .should.be.rejectedWith(/network name/i);
            });

            it('should throw if business network version not specified', () => {
                return connection.upgrade(mockSecurityContext, 'name')
                    .should.be.rejectedWith(/network version/i);
            });

            it('should send proposal', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                return connection.upgrade(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion())
                    .then(() => {
                        sinon.assert.calledWith(mockChannel.sendUpgradeProposal, expectedProposal);
                    });
            });

            it('should send transaction based on proposal response', () => {
                sandbox.stub(global, 'setTimeout');
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(sendTransactionSuccessResponse);
                // This is the event hub response.
                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                return connection.upgrade(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion())
                    .then(() => {
                        return mockChannel.sendUpgradeProposal.returnValues[0];
                    }).then(proposalResponse => {
                        sinon.assert.calledWith(mockChannel.sendTransaction, sinon.match({
                            proposal: proposalResponse[1],
                            proposalResponses: validProposalResponses,
                        }));
                    });
            });

            it('should throw if sendTransaction fails', () => {
                sandbox.stub(global, 'setTimeout');
                const failureResponse = {
                    status: 'FAILURE'
                };
                mockChannel.sendTransaction.withArgs(sinon.match({
                    proposalResponses: validProposalResponses,
                    proposal: sinon.match.object
                })).resolves(failureResponse);

                mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

                return connection.upgrade(mockSecurityContext, mockBusinessNetwork.getName(), mockBusinessNetwork.getVersion())
                    .should.be.rejectedWith(failureResponse.status);
            });
        });
    });

    describe('#_validatePeerResponses', () => {
        it('should return all responses because all are valid', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                },

                {
                    response: {
                        status: 200,
                        payload: 'good here'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                const {ignoredErrors, validResponses} = connection._validatePeerResponses(responses, true);
                ignoredErrors.should.equal(0);
                validResponses.should.deep.equal(responses);
            }).should.not.throw();
        });

        it('should not throw if pattern is found in message of Error object', () => {
            const err = new Error('the chaincode exists somewhere');
            const responses = [
                err
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                const {ignoredErrors, validResponses} = connection._validatePeerResponses(responses, false, /chaincode exists/);
                ignoredErrors.should.equal(1);
                validResponses.length.should.equal(0);
            }).should.not.throw();
        });

        it('should throw if no responses', () => {
            (function() {
                connection._validatePeerResponses([], false);
            }).should.throw(/No results were returned/);
        });

        it('should throw if no proposal responses', () => {
            (function() {
                connection._validatePeerResponses([], true);
            }).should.throw(/No results were returned/);
        });

        it('should throw if all responses are either not 200 or errors', () => {
            const responses = [
                {
                    response: {
                        status: 500,
                        payload: 'got an error'
                    }
                },
                new Error('had a problem'),
                {
                    response: {
                        status: 500,
                        payload: 'oh oh another error'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                connection._validatePeerResponses(responses, true);
            }).should.throw(/No valid responses/);
        });

        it('should return only the valid responses', () => {
            let resp1 = {
                response: {
                    status: 200,
                    payload: 'no error'
                }
            };

            let resp2 = new Error('had a problem');

            let resp3 = {
                response: {
                    status: 500,
                    payload: 'such error'
                }
            };

            const responses = [resp1, resp2, resp3];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                let {ignoredErrors, validResponses} = connection._validatePeerResponses(responses, true);
                ignoredErrors.should.equal(0);
                validResponses.should.deep.equal([resp1]);

            }).should.not.throw();

        });

        it('should log warning if verifyProposal returns false', () => {
            const response1 = {
                response: {
                    status: 200,
                    payload: 'NOTVALID'
                }
            };
            const response2 = {
                response: {
                    status: 200,
                    payload: 'I AM VALID'
                }
            };

            const responses = [ response1, response2 ];

            mockChannel.verifyProposalResponse.withArgs(response1).returns(false);
            mockChannel.verifyProposalResponse.withArgs(response2).returns(true);
            mockChannel.compareProposalResponseResults.returns(true);
            connection._validatePeerResponses(responses, true);
            sinon.assert.calledWith(logWarnSpy, sinon.match(/Proposal response from peer failed verification/));
        });

        it('should log if compareProposals returns false', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(false);
            connection._validatePeerResponses(responses, true);
            sinon.assert.calledWith(logWarnSpy, 'Peers do not agree, Read Write sets differ');
        });

        it('should not try to check proposal responses if not a response from a proposal', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                }
            ];

            connection._validatePeerResponses(responses, false);
            sinon.assert.notCalled(mockChannel.verifyProposalResponse);
            sinon.assert.notCalled(mockChannel.compareProposalResponseResults);
        });


    });

    describe('#_checkRuntimeVersions', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
        });

        it('should handle a chaincode with the same version as the connector', () => {
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.true;
                });
        });

        it('should handle a chaincode with a lower version than the connector', () => {
            const oldVersion = connectorPackageJSON.version;
            connectorPackageJSON.version = semver.inc(oldVersion, 'patch');
            const response = {
                version: oldVersion,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.true;
                });
        });

        it('should handle a chaincode with a greater version than the connector as not compatible', () => {
            const version = connectorPackageJSON.version;
            const newVersion = semver.inc(version, 'major');
            const response = {
                version: newVersion,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.false;
                });
        });

        it('should handle a chaincode running a prelease build at the same version as the connector', () => {
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.true;
                });
        });

        it('should handle a chaincode running a prelease build at the same version as the connector', () => {
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.true;
                });
        });

        it('should handle a chaincode running a older pre-release build than that of the connector', () => {
            const oldVersion = connectorPackageJSON.version;
            connectorPackageJSON.version += '-20170202';
            const response = {
                version: oldVersion + '-20170101',
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.true;
                });
        });

        it('should handle a chaincode running a prelease build is newer than the connector saying it isn\'t compatible', () => {
            const oldVersion = connectorPackageJSON.version;
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: oldVersion + '-20170202',
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection._checkRuntimeVersions(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.response.should.deep.equal(response);
                    result.isCompatible.should.be.false;
                });
        });
    });

    describe('#ping', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
            connection._connectToEventHubs();
        });

        it('should handle a compatible runtime', () => {
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            const results = {isCompatible: true, response: response};
            sandbox.stub(connection, '_checkRuntimeVersions').resolves(results);
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    result.should.deep.equal(response);
                });
        });

        it('should handle an incompatible runtime', () => {
            const version = connectorPackageJSON.version;
            const newVersion = semver.inc(version, 'major');
            const response = {
                version: newVersion,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            const results = {isCompatible: false, response: response};
            sandbox.stub(connection, '_checkRuntimeVersions').resolves(results);
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/is not compatible with/);
        });

        it('should handle errors thrown from the runtime check', () => {
            sandbox.stub(connection, '_checkRuntimeVersions').rejects('such error');
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#queryChainCode', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            delete connection.businessNetworkIdentifier;
            return connection.queryChainCode(mockSecurityContext, null, [])
                .should.be.rejectedWith(/No business network/);
        });

        it('should throw if functionName not specified', () => {
            return connection.queryChainCode(mockSecurityContext, null, [])
                .should.be.rejectedWith(/functionName not specified/);
        });

        it('should throw if args not specified', () => {
            return connection.queryChainCode(mockSecurityContext, 'myfunc', null)
                .should.be.rejectedWith(/args not specified/);
        });

        it('should throw if args contains non-string values', () => {
            return connection.queryChainCode(mockSecurityContext, 'myfunc', [3.142])
                .should.be.rejectedWith(/invalid arg specified: 3.142/);
        });

        it('should choose a valid peer from the same org', async () => {
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([mockPeer2, mockPeer3]);

            const response = Buffer.from('hello world');
            mockChannel.queryByChaincode.resolves([response]);
            let result = await connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledOnce(mockChannel.queryByChaincode);
            sinon.assert.calledWith(mockChannel.queryByChaincode, {
                chaincodeId: mockBusinessNetwork.getName(),
                chaincodeVersion: connectorPackageJSON.version,
                txId: mockTransactionID,
                fcn: 'myfunc',
                args: ['arg1', 'arg2'],
                targets: [mockPeer2]
            });
            result.equals(response).should.be.true;
        });

        it('should cache a valid peer', async () => {
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([mockPeer2, mockPeer3]);

            const response = Buffer.from('hello world');
            mockChannel.queryByChaincode.resolves([response]);
            await connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2']);
            await connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledTwice(mockChannel.queryByChaincode);
            sinon.assert.alwaysCalledWith(mockChannel.queryByChaincode, {
                chaincodeId: mockBusinessNetwork.getName(),
                chaincodeVersion: connectorPackageJSON.version,
                txId: mockTransactionID,
                fcn: 'myfunc',
                args: ['arg1', 'arg2'],
                targets: [mockPeer2]
            });
            sinon.assert.calledOnce(connection.getChannelPeersInOrg);
            sinon.assert.notCalled(mockChannel.getPeers);
        });


        it('should choose a valid peer from all peers if no suitable one in same org', async () => {
            mockPeer1.isInRole.withArgs('chaincodeQuery').returns(false);
            mockPeer2.isInRole.withArgs('chaincodeQuery').returns(false);
            mockPeer3.isInRole.withArgs('chaincodeQuery').returns(true);
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([]);
            mockChannel.getPeers.returns([mockPeer1, mockPeer2, mockPeer3]);

            const response = Buffer.from('hello world');
            mockChannel.queryByChaincode.resolves([response]);
            let result = await connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2']);
            sinon.assert.calledOnce(mockChannel.queryByChaincode);
            sinon.assert.calledWith(mockChannel.queryByChaincode, {
                chaincodeId: mockBusinessNetwork.getName(),
                chaincodeVersion: connectorPackageJSON.version,
                txId: mockTransactionID,
                fcn: 'myfunc',
                args: ['arg1', 'arg2'],
                targets: [mockPeer3]
            });
            result.equals(response).should.be.true;
        });

        it('should throw if no suitable peers to query', () => {
            mockPeer1.isInRole.withArgs('chaincodeQuery').returns(false);
            mockPeer2.isInRole.withArgs('chaincodeQuery').returns(false);
            mockPeer3.isInRole.withArgs('chaincodeQuery').returns(false);
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([]);
            mockChannel.getPeers.returns([mockPeer1, mockPeer2, mockPeer3]);

            mockChannel.queryByChaincode.resolves([]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/Unable to determine/);
        });


        it('should throw if no responses are returned', () => {
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([mockPeer2, mockPeer3]);

            mockChannel.queryByChaincode.resolves([]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No payloads were returned from the query request/);
        });

        it('should throw any responses that are errors', () => {
            sandbox.stub(connection, 'getChannelPeersInOrg').withArgs(['chaincodeQuery']).returns([mockPeer2, mockPeer3]);

            const response = [ new Error('such error') ];
            mockChannel.queryByChaincode.resolves(response);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#invokeChainCode', () => {
        const validResponses = [{
            response: {
                status: 200
            }
        }];


        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: validResponses});
            sandbox.stub(connection, '_initializeChannel').resolves();
            mockClient.getEventHubsForOrg.returns([mockEventHub]);
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            delete connection.businessNetworkIdentifier;
            return connection.invokeChainCode(mockSecurityContext, null, [])
                .should.be.rejectedWith(/No business network/);
        });

        it('should throw if functionName not specified', () => {
            return connection.invokeChainCode(mockSecurityContext, null, [])
                .should.be.rejectedWith(/functionName not specified/);
        });

        it('should throw if args not specified', () => {
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', null)
                .should.be.rejectedWith(/args not specified/);
        });

        it('should throw if args contains non-string values', () => {
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', [3.142])
                .should.be.rejectedWith(/invalid arg specified: 3.142/);
        });

        it('should submit an invoke request to the chaincode', () => {
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .then((result) => {
                    should.equal(result, undefined);
                    sinon.assert.calledOnce(mockChannel.sendTransactionProposal);
                    sinon.assert.calledWith(mockChannel.sendTransactionProposal, {
                        chaincodeId: mockBusinessNetwork.getName(),
                        chaincodeVersion: connectorPackageJSON.version,
                        txId: mockTransactionID,
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2']
                    });
                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should submit an invoke request to the chaincode - with the options giving a real txid', () => {
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            let options = {transactionId : mockTransactionID};
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'],options)
                .then((result) => {
                    should.equal(result, undefined);
                    sinon.assert.notCalled(mockClient.newTransactionID);
                    sinon.assert.calledOnce(mockChannel.sendTransactionProposal);
                    sinon.assert.calledWith(mockChannel.sendTransactionProposal, {
                        chaincodeId: mockBusinessNetwork.getName(),
                        chaincodeVersion: connectorPackageJSON.version,
                        txId: mockTransactionID,
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2']
                    });
                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should submit an invoke request to the chaincode - with the options giving a data only txid', () => {
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            let options = {transactionId : {_nonce: '1234', _transaction_id: '5678'}};
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('5678', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'],options)
                .then((result) => {
                    should.equal(result, undefined);
                    mockTransactionID.should.deep.equal({_nonce: '1234', _transaction_id: '5678'});
                    sinon.assert.calledOnce(mockClient.newTransactionID);
                    sinon.assert.calledOnce(mockChannel.sendTransactionProposal);
                    sinon.assert.calledWith(mockChannel.sendTransactionProposal, {
                        chaincodeId: mockBusinessNetwork.getName(),
                        chaincodeVersion: connectorPackageJSON.version,
                        txId: mockTransactionID,
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2']
                    });
                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should throw if transaction proposals were not valid', () => {
            const proposalResponses = [];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            const errorResp = new Error('an error');
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            connection._validatePeerResponses.withArgs(proposalResponses).throws(errorResp);
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/an error/);
        });

        it('should set the timeout to value specified in connection profile', () => {
            connectOptions = {
                'x-commitTimeout': 38
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', mockBusinessNetwork.getName(), connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
            sandbox.stub(connection, '_validatePeerResponses').returns({ignoredErrors: 0, validResponses: validResponses});
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejected
                .then(() => {
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, 38 * 1000);
                });
        });

        it('should throw an error if the commit of the transaction times out', () => {
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            // mockEventHub.registerTxEvent.yields();
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/Failed to receive commit notification/);
        });

        it('should throw an error if the orderer responds with an error', () => {
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/Failed to send/);
        });

    });

    describe('#createIdentity', () => {
        beforeEach(() => {
            sandbox.stub(connection, '_getLoggedInUser').returns(mockUser);
        });


        it('should throw error if no user is specified', () => {
            return connection.createIdentity(mockSecurityContext, '')
                .should.be.rejectedWith(/userID not specified/)
                .then(() => {
                    return connection.createIdentity(mockSecurityContext).should.be.rejectedWith(/userID not specified/);
                })
                .then(() => {
                    return connection.createIdentity(mockSecurityContext, null).should.be.rejectedWith(/userID not specified/);
                });
        });

        it('should issue a request to register a user', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser')
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [],
                        maxEnrollments: 1,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should issue a request to register a user who can register other users', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {issuer: true})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [
                            {name: 'hf.Registrar.Roles', value: 'client'},
                            {name: 'hf.Registrar.Attributes', value: 'hf.Registrar.Roles, hf.Registrar.Attributes'}
                        ],
                        maxEnrollments: 1,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should issue a request with a limited number of enrollments', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {maxEnrollments: 9})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [],
                        maxEnrollments: 9,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should issue a request with a different affiliation', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {affiliation: 'bank_b'})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'bank_b',
                        attrs: [],
                        maxEnrollments: 1,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should issue a request with a different role', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {role: 'peer,auditor'})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [],
                        maxEnrollments: 1,
                        role: 'peer,auditor'
                    }, mockUser);
                });
        });

        it('should issue a request with user supplied attributes object', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {attributes: {attr1: 'value1', attr2: 'value2'}})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [
                            {name: 'attr1', value: 'value1'},
                            {name: 'attr2', value: 'value2'}
                        ],
                        maxEnrollments: 1,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should issue a request with user supplied attributes JSON string', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {attributes: '{"attr1": "value1", "attr2": 20}'})
                .then((result) => {
                    result.should.deep.equal({
                        userID: 'auser',
                        userSecret: 'asecret'
                    });
                    sinon.assert.calledWith(mockCAClient.register, {
                        enrollmentID: 'auser',
                        affiliation: 'org1',
                        attrs: [
                            {name: 'attr1', value: 'value1'},
                            {name: 'attr2', value: 20}
                        ],
                        maxEnrollments: 1,
                        role: 'client'
                    }, mockUser);
                });
        });

        it('should handle an error with an invalid  user supplied attributes JSON string', () => {
            mockCAClient.register.resolves('asecret');
            return connection.createIdentity(mockSecurityContext, 'auser', {attributes: 'NO JSON HERE LULZ'})
                .should.be.rejectedWith(/attributes provided are not valid JSON/);
        });

        it('should handle a register error', () => {
            mockCAClient.register.rejects(new Error('anerror'));
            return connection.createIdentity(mockSecurityContext, 'auser')
                .should.be.rejectedWith(/anerror/);

        });
    });

    describe('#list', () => {

        it('should return an empty array if no instantiated chaincodes', () => {
            mockChannel.queryInstantiatedChaincodes.resolves({
                chaincodes: []
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal([]);
        });

        it('should return an array of chaincode names for all instantiated chaincodes', () => {
            mockChannel.queryInstantiatedChaincodes.resolves({
                chaincodes: [{
                    name: 'org-acme-biznet1',
                    version: '1.0.0',
                    path: 'composer'
                }, {
                    name: 'org-acme-biznet2',
                    version: '1.2.0',
                    path: 'composer'
                }]
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal(['org-acme-biznet1', 'org-acme-biznet2']);
        });

        it('should filter out any non-composer instantiated chaincodes', () => {
            mockChannel.queryInstantiatedChaincodes.resolves({
                chaincodes: [{
                    name: 'org-acme-biznet1',
                    version: '1.0.0',
                    path: 'composer'
                }, {
                    name: 'org-acme-biznet2',
                    version: '1.2.0',
                    path: 'dogecc'
                }]
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal(['org-acme-biznet1']);
        });

        it('should handle any errors querying instantiated chaincodes', () => {
            mockChannel.queryInstantiatedChaincodes.rejects(new Error('such error'));
            return connection.list(mockSecurityContext)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#_initializeChannel', () => {
        beforeEach(() => {
            mockChannel.initialize.resolves();
        });

        it('should initialize the channel if not initialized', () => {
            connection.initialized.should.be.false;
            return connection._initializeChannel()
                .then(() => {
                    sinon.assert.calledOnce(mockChannel.initialize);
                    connection.initialized.should.be.true;
                });
        });

        it('should not initialize the channel if initialized', () => {
            connection.initialized = true;
            return connection._initializeChannel()
                .then(() => {
                    sinon.assert.notCalled(mockChannel.initialize);
                });
        });
    });

    describe('#createTransactionID', ()=> {
        it('should create a transaction id', () => {
            return connection.createTransactionId()
                .then((result) =>{
                    sinon.assert.calledOnce(mockClient.newTransactionID);
                    result.should.deep.equal({
                        id: mockTransactionID,
                        idStr: '00000000-0000-0000-0000-000000000000'
                    });
                });
        });
    });

    describe('#getChannelPeersInOrg', ()=> {
        let mockPeer4, mockPeer5, mockPeer6;
        beforeEach(() => {
            mockPeer1.isInRole.withArgs('endorsingPeer').returns(false);
            mockPeer1.isInRole.withArgs('chaincodeQuery').returns(false);
            mockPeer2.isInRole.withArgs('endorsingPeer').returns(false);
            mockPeer2.isInRole.withArgs('chaincodeQuery').returns(true);
            mockPeer3.isInRole.withArgs('endorsingPeer').returns(true);
            mockPeer3.isInRole.withArgs('chaincodeQuery').returns(true);

            mockPeer4 = sinon.createStubInstance(Peer);
            mockPeer4.getName.returns('Peer4');
            mockPeer4.isInRole.withArgs('endorsingPeer').returns(false);
            mockPeer4.isInRole.withArgs('chaincodeQuery').returns(false);

            mockPeer5 = sinon.createStubInstance(Peer);
            mockPeer5.getName.returns('Peer5');
            mockPeer5.isInRole.withArgs('endorsingPeer').returns(true);
            mockPeer5.isInRole.withArgs('chaincodeQuery').returns(false);

            mockPeer6 = sinon.createStubInstance(Peer);
            mockPeer6.getName.returns('Peer6');
            mockPeer6.isInRole.withArgs('endorsingPeer').returns(true);
            mockPeer6.isInRole.withArgs('chaincodeQuery').returns(true);

        });

        it('Should find the correct set of Peers #1', () => {
            mockClient.getPeersForOrg.returns([mockPeer4, mockPeer6]);
            mockChannel.getPeers.returns([mockPeer4, mockPeer5, mockPeer6]);
            connection.getChannelPeersInOrg(['endorsingPeer', 'chaincodeQuery']).should.deep.equal([mockPeer6]);
        });

        it('Should find the correct set of Peers #2', () => {
            mockClient.getPeersForOrg.returns([mockPeer1, mockPeer2, mockPeer3]);
            mockChannel.getPeers.returns([mockPeer2, mockPeer4, mockPeer5, mockPeer6, mockPeer3]);
            connection.getChannelPeersInOrg(['chaincodeQuery']).should.deep.equal([mockPeer2, mockPeer3]);
            connection.getChannelPeersInOrg(['endorsingPeer', 'chaincodeQuery']).should.deep.equal([mockPeer3]);
        });

        it('should return an empty array if no peers found #1', () => {
            mockClient.getPeersForOrg.returns([mockPeer1, mockPeer2, mockPeer3]);
            mockChannel.getPeers.returns([mockPeer4, mockPeer5, mockPeer6]);
            connection.getChannelPeersInOrg(['chaincodeQuery']).should.deep.equal([]);
        });

        it('should return an empty array if no peers found #2', () => {
            mockClient.getPeersForOrg.returns([mockPeer1, mockPeer4]);
            mockChannel.getPeers.returns([mockPeer4, mockPeer1]);
            connection.getChannelPeersInOrg(['chaincodeQuery']).should.deep.equal([]);
        });

    });
});
