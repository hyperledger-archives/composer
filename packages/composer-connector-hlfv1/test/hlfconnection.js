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


const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlfv1'));

describe('HLFConnection', () => {

    let sandbox;
    let mockConnectionManager, mockChannel, mockClient, mockEventHub, mockCAClient, mockUser, mockSecurityContext, mockBusinessNetwork, mockPeer;
    let connectOptions;
    let connection;
    let mockEventHubDef, mockTransactionID, logWarnSpy;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        const LOG = Logger.getLog('HLFConnection');
        logWarnSpy = sandbox.spy(LOG, 'warn');
        mockConnectionManager = sinon.createStubInstance(HLFConnectionManager);
        mockPeer = sinon.createStubInstance(Peer);
        mockChannel = sinon.createStubInstance(Channel);
        mockClient = sinon.createStubInstance(Client);
        mockEventHub = sinon.createStubInstance(EventHub);
        mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
        mockUser = sinon.createStubInstance(User);
        mockChannel.getPeers.returns([mockPeer]);
        mockTransactionID = sinon.createStubInstance(TransactionID);
        mockTransactionID.getTransactionID.returns('00000000-0000-0000-0000-000000000000');
        mockClient.newTransactionID.returns(mockTransactionID);
        mockSecurityContext = sinon.createStubInstance(HLFSecurityContext);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetwork.getName.returns('org-acme-biznet');
        mockBusinessNetwork.toArchive.resolves(Buffer.from('hello world'));
        connectOptions = {
            channel: 'testchainid',
            mspID: 'suchmsp',
            deployWaitTime: 30,
            invokeWaitTime: 30
        };
        mockEventHubDef = {
            'eventURL': 'http://localhost:7053'
        };
        connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
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

    describe('#createEventHub', () => {

        it('should call new event hub', () => {
            (() => {
                HLFConnection.createEventHub(mockClient);
            }).should.throw(/The clientContext has not been properly initialized, missing userContext/);
        });

    });

    describe('#constructor', () => {

        it('should throw if connectOptions not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', null, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw if client not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', { type: 'hlfv1' }, null, mockChannel, [mockEventHubDef], mockCAClient);
            }).should.throw(/client not specified/);
        });

        it('should throw if channel not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', { type: 'hlfv1' }, mockClient, null, [mockEventHubDef], mockCAClient);
            }).should.throw(/channel not specified/);
        });

        it('should throw if eventHubDefs not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', { type: 'hlfv1' }, mockClient, mockChannel, null, mockCAClient);
            }).should.throw(/eventHubDefs not specified or not an array/);
        });

        it('should throw if eventHubDefs not an array', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', { type: 'hlfv1' }, mockClient, mockChannel, mockEventHubDef, mockCAClient);
            }).should.throw(/eventHubDefs not specified or not an array/);
        });


        it('should throw if caClient not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', { type: 'hlfv1' }, mockClient, mockChannel, [mockEventHubDef], null);
            }).should.throw(/caClient not specified/);
        });
    });

    describe('#getConnectionOptions', () => {

        it('should return the connection options', () => {
            connection.getConnectionOptions().should.deep.equal(connectOptions);
        });

    });

    describe('#_connectToEventHubs', () => {
        beforeEach(() => {
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
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
            mockEventHub.registerChaincodeEvent.withArgs('org-acme-biznet', 'composer', sinon.match.func).yield(events);
            sinon.assert.calledOnce(mockEventHub.registerChaincodeEvent);
            sinon.assert.calledWith(mockEventHub.registerChaincodeEvent, 'org-acme-biznet', 'composer', sinon.match.func);
            sinon.assert.calledOnce(connection.emit);
            sinon.assert.calledWith(connection.emit, 'events', {'event':'event'});
        });

        it('should not register any listeners for chaincode events if no business network is specified', () => {
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', null, connectOptions, mockClient, mockChannel, [mockEventHub], mockCAClient);
            connection._connectToEventHubs();
            sinon.assert.notCalled(mockEventHub.registerChaincodeEvent);
            connection.ccEvents.length.should.equal(0);

        });

    });

    describe('#disconnect', () => {
        beforeEach(() => {
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            mockEventHub.registerChaincodeEvent.withArgs('org-acme-biznet', 'composer', sinon.match.func).returns('events');
        });

        it('should not unregister any chaincode listeners if non were setup', () => {
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', null, connectOptions, mockClient, mockChannel, [mockEventHub], mockCAClient);
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

    });

    describe('#enroll', () => {

        beforeEach(() => {
            sandbox.stub(HLFConnection, 'createUser').returns(mockUser);
            sandbox.stub(connection, '_initializeChannel').resolves();
        });

        it('should throw if enrollmentID not specified', () => {
            (() => {
                connection.enroll(null, 'adminpw');
            }).should.throw(/enrollmentID not specified/);
        });

        it('should throw if enrollmentSecret not specified', () => {
            (() => {
                connection.enroll('admin', null);
            }).should.throw(/enrollmentSecret not specified/);
        });

        it('should enroll and store the user context using the CA client', () => {
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
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
        });

        it('should throw if identity not specified', () => {
            (() => {
                connection.login(null, 'adminpw');
            }).should.throw(/identity not specified/);
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
        const tempDirectoryPath = path.resolve('tmp', 'composer1234567890');
        const targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', 'composer');
        const constantsFilePath = path.resolve(targetDirectoryPath, 'constants.go');

        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            (() => {
                connection.install(mockSecurityContext, null);
            }).should.throw(/businessNetworkIdentifier not specified/);
        });


        it('should rethrow error if unable to create temp dir', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').rejects(new Error('some error 1'));
            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error 1/);
        });

        it('should rethrow error if unable to copy chaincode source', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').rejects(new Error('some error 2'));
            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error/);
        });

        it('should rethrow error if unable to copy chaincode source', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').rejects(new Error('some error 3'));
            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error 3/);
        });

        it('should install the runtime with the default pool size', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();

            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validateResponses').returns();
            return connection.install(mockSecurityContext, 'org-acme-biznet')
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = 8/));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                });
        });

        it('should install the runtime with the specified pool size', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();

            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validateResponses').returns();
            return connection.install(mockSecurityContext, 'org-acme-biznet', {poolSize:3})
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = 3/));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                });
        });


        it('should throw error if peer rejects installation', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();

            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validateResponses').throws(new Error('Some error occurs'));

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Some error occurs/);
        });

        it('should throw error if peer says chaincode already installed and no ignore option', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();

            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            sandbox.stub(connection, '_validateResponses').throws(errorResp);

            return connection.install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Error installing chaincode/);
        });

        it('should check for chaincode exists message is ignoreCCinstalled flag set', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();

            // This is the install proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            sandbox.stub(connection, '_validateResponses').returns();

            return connection.install(mockSecurityContext, mockBusinessNetwork, {ignoreCCInstalled: true})
                .then(() => {
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._validateResponses);
                    sinon.assert.calledWith(connection._validateResponses, sinon.match.any, false, /chaincode .+ exists/);
                });
        });


    });

    describe('#start', () => {

        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
        });

        it('should throw if businessNetwork not specified', () => {
            (() => {
                connection.start(mockSecurityContext, null);
            }).should.throw(/businessNetwork not specified/);
        });

        // TODO: should extract out _waitForEvents
        it('should request an event timeout based on connection settings', () => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [ {
                    requestURL: 'grpc://localhost:7051',
                    eventURL: 'grpc://localhost:7053'
                }],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'suchmsp',
                timeout: 22
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            return connection.start(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to receive commit notification/)
                .then(() => {
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, 22 * 1000);
                });
        });

        it('should start the business network with endorsement policy object', () => {
            sandbox.stub(global, 'setTimeout');

            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response.
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
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
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : policy
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should start the business network with endorsement policy string', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            const policy = JSON.parse(policyString);
            const deployOptions = {
                endorsementPolicy : policyString
            };
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : policy
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should start the business network with endorsement policy file', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : JSON.parse(policyString)
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should throw an error if the policy string isn\'t valid json', () => {
            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            const deployOptions = {
                endorsementPolicy : policyString
            };
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file doesn\'t exist', () => {
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').throws(new Error('ENOENT'));
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file isn\'t valid json', () => {
            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.start(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });

        it('should start the business network with no debug level specified', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.start(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}']
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should start the business network with debug level set', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.start(mockSecurityContext, mockBusinessNetwork, {'logLevel': 'WARNING'})
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{"logLevel":"WARNING"}']
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should throw any instantiate fails to validate', () => {
            const errorResp = new Error('such error');
            const instantiateResponses = [ errorResp ];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
            connection._validateResponses.withArgs(instantiateResponses).throws(errorResp);
            // This is the event hub response.
            //mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.start(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/such error/);
        });

        // TODO: should extract out _waitForEvents
        it('should throw an error if the orderer throws an error', () => {
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            //mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
            return connection.start(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to commit transaction/);
        });

        it('should throw an error if peer says transaction not valid', () => {
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response to indicate transaction not valid
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
            return connection.start(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Peer has rejected transaction '00000000-0000-0000-0000-000000000000'/);
        });

    });

    describe('#_validateResponses', () => {
        it('should not throw if all is ok', () => {
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
                connection._validateResponses(responses, true);
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
                connection._validateResponses(responses, false, /chaincode exists/);
            }).should.not.throw();
        });


        it('should throw if no responses', () => {
            (function() {
                connection._validateResponses([], false);
            }).should.throw(/No results were returned/);
        });

        it('should throw if no proposal responses', () => {
            (function() {
                connection._validateResponses([], true);
            }).should.throw(/No results were returned/);
        });

        it('should throw if any responses that have a non-200 status code', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                },

                {
                    response: {
                        status: 500,
                        payload: 'such error'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                connection._validateResponses(responses, true);
            }).should.throw(/such error/);
        });

        it('should throw the error if any of the responses contains an error', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                },
                new Error('had a problem'),
                {
                    response: {
                        status: 500,
                        payload: 'such error'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(true);
            mockChannel.compareProposalResponseResults.returns(true);

            (function() {
                connection._validateResponses(responses, true);
            }).should.throw(/had a problem/);

        });

        it('should log warning if verifyProposal returns false', () => {
            const responses = [
                {
                    response: {
                        status: 200,
                        payload: 'no error'
                    }
                }
            ];

            mockChannel.verifyProposalResponse.returns(false);
            mockChannel.compareProposalResponseResults.returns(true);
            connection._validateResponses(responses, true);
            sinon.assert.calledWith(logWarnSpy, 'Response from peer was not valid');


            //(function() {
            //    connection._validateResponses(responses, true);
            //}).should.throw(/Response from peer was not valid/);

        });

        it('should throw if compareProposals returns false', () => {
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
            connection._validateResponses(responses, true);
            sinon.assert.calledWith(logWarnSpy, 'Peers do not agree, Read Write sets differ');


            //(function() {
            //    connection._validateResponses(responses, true);
            //}).should.throw(/Peers do not agree/);

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

            mockChannel.verifyProposalResponse.returns(false);
            mockChannel.compareProposalResponseResults.returns(false);

            (function() {
                connection._validateResponses(responses, false);
            }).should.not.throw();
        });


    });

    describe('#deploy', () => {

        const tempDirectoryPath = path.resolve('tmp', 'composer1234567890');
        const targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', 'composer');
        const constantsFilePath = path.resolve(targetDirectoryPath, 'constants.go');

        beforeEach(() => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
        });

        it('should throw if businessNetwork not specified', () => {
            (() => {
                connection.deploy(mockSecurityContext, null);
            }).should.throw(/businessNetwork not specified/);
        });

        // TODO: should extract out _waitForEvents
        it('should request an event timeout based on connection settings', () => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [ {
                    requestURL: 'grpc://localhost:7051',
                    eventURL: 'grpc://localhost:7053'
                }],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'suchmsp',
                timeout: 22
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            const response = {
                status: 'SUCCESS'
            };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to receive commit notification/)
                .then(() => {
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, 22 * 1000);
                });
        });

        it('should deploy the business network with endorsement policy object', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
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
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : policy
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should deploy the business network with endorsement policy string', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            const policy = JSON.parse(policyString);
            const deployOptions = {
                endorsementPolicy : policyString
            };
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : policy
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should deploy the business network with endorsement policy file', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

            const policyString = '{"identities": [{"role": {"name": "member","mspId": "Org1MSP"}}],"policy": {"1-of": [{"signed-by": 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}'],
                        'endorsement-policy' : JSON.parse(policyString)
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should throw an error if the policy string isn\'t valid json', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});

            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            const deployOptions = {
                endorsementPolicy : policyString
            };
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file doesn\'t exist', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});

            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').throws(new Error('ENOENT'));
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });

        it('should throw an error if the policy file isn\'t valid json', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);

            const policyString = '{identities: [{role: {name: "member",mspId: "Org1MSP"}}],policy: {1-of: [{signed-by: 0}]}}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(policyString);
            const deployOptions = {
                endorsementPolicyFile : '/path/to/options.json'
            };
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, deployOptions)
            .should.be.rejectedWith(/Error trying parse endorsement policy/);
        });


        it('should deploy the business network with no debug level specified', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}']
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should deploy the business network with debug level set', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork, {'logLevel': 'WARNING'})
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{"logLevel":"WARNING"}']
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });


        it('should instantiate the business network if it responds already installed', () => {
            sandbox.stub(global, 'setTimeout');
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp];
            const instantiateResponses = [{
                response: {
                    status: 200
                }
            }];

            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: instantiateResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID.toString(), 'VALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendInstantiateProposal);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.calledWith(mockChannel.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=', '{}']
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should install and exit cleanly if business network already instantiated', () => {
            sandbox.stub(global, 'setTimeout');
            // This is reponse from an install and instantiate
            const installInstantiateResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installInstantiateResponses ]);

            // query instantiate response shows chaincode already instantiated
            const queryInstantiatedResponse = {
                chaincodes: [
                    {
                        path: 'composer',
                        name: 'org-acme-biznet'
                    }
                ]
            };
            mockChannel.queryInstantiatedChaincodes.resolves(queryInstantiatedResponse);

            // What would be a valid instantiate proposal response, should not be used.
            mockChannel.sendInstantiateProposal.resolves([ installInstantiateResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: installInstantiateResponses, proposal: proposal, header: header }).resolves(response);

            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');

            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const version = /));
                    sinon.assert.calledWith(connection.fs.outputFile, constantsFilePath, sinon.match(/const PoolSize = /));
                    sinon.assert.calledOnce(mockClient.installChaincode);
                    sinon.assert.calledWith(mockClient.installChaincode, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        targets: [mockPeer]
                    });
                    sinon.assert.notCalled(connection._initializeChannel);
                    sinon.assert.notCalled(mockChannel.sendInstantiateProposal);
                    sinon.assert.notCalled(mockChannel.sendTransaction);
                });
        });

        it('should throw if install fails to validate', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the deployment proposal and response (from the peers).
            const errorResp = new Error('Error something went completely wrong');
            const installResponses = [errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            connection._validateResponses.withArgs(installResponses).throws(errorResp);
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Error something went completely wrong/);
        });

        it('should throw any instantiate fails to validate', () => {
            const installResponses = [{
                response: {
                    status: 200
                }
            }];
            const errorResp = new Error('such error');
            const instantiateResponses = [ errorResp ];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ installResponses, proposal, header ]);
            connection._validateResponses.withArgs(installResponses).returns();
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
            connection._validateResponses.withArgs(instantiateResponses).throws(errorResp);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/such error/);
        });

        // TODO: should extract out _waitForEvents
        it('should throw an error if the commit throws an error', () => {
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to commit transaction/);
        });

        it('should throw an error if peer says transaction not valid', () => {
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockClient.installChaincode.resolves([ proposalResponses, proposal, header ]);
            mockChannel.queryInstantiatedChaincodes.resolves({chaincodes: []});
            mockChannel.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
            return connection.deploy(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/Peer has rejected transaction '00000000-0000-0000-0000-000000000000'/);
        });

    });

    describe('#undeploy', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            (() => {
                connection.undeploy(mockSecurityContext, null);
            }).should.throw(/businessNetworkIdentifier not specified/);
        });

        it('should throw if businessNetworkIdentifier not same as the connection', () => {
            (() => {
                connection.undeploy(mockSecurityContext, 'FunnyNetwork');
            }).should.throw(/businessNetworkIdentifier does not match the business network identifier for this connection/);
        });

        it('should invoke the chaincode', () => {
            sandbox.stub(connection, 'invokeChainCode').resolves();
            return connection.undeploy(mockSecurityContext, 'org-acme-biznet')
                .then(() => {
                    sinon.assert.calledOnce(connection.invokeChainCode);
                    sinon.assert.calledWith(connection.invokeChainCode, mockSecurityContext, 'undeployBusinessNetwork', []);
                });
        });

        it('should handle errors invoking the chaincode', () => {
            sandbox.stub(connection, 'invokeChainCode').rejects('such error');
            return connection.undeploy(mockSecurityContext, 'org-acme-biznet')
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#update', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkDefinition not specified', () => {
            (() => {
                connection.update(mockSecurityContext, null);
            }).should.throw(/businessNetworkDefinition not specified/);
        });

        it('should invoke the chaincode', () => {
            sandbox.stub(connection, 'invokeChainCode').resolves();
            return connection.update(mockSecurityContext, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.invokeChainCode);
                    sinon.assert.calledWith(connection.invokeChainCode, mockSecurityContext, 'updateBusinessNetwork', ['aGVsbG8gd29ybGQ=']);
                });
        });

        it('should handle errors invoking the chaincode', () => {
            sandbox.stub(connection, 'invokeChainCode').rejects('such error');
            return connection.update(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#upgrade', () => {

        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
        });

        it('should throw if businessNetworkIdentifier not specified', () => {
            (() => {
                delete connection.businessNetworkIdentifier;
                connection.upgrade(mockSecurityContext, null);
            }).should.throw(/businessNetworkIdentifier not specified/);
        });

        it('should upgrade the business network', () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(connection, '_checkRuntimeVersions').resolves({isCompatible: true, response: {version: '1.0.0'}});
            // This is the upgrade proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendUpgradeProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'VALID');
            return connection.upgrade(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(connection._initializeChannel);
                    sinon.assert.calledOnce(mockChannel.sendUpgradeProposal);
                    sinon.assert.calledWith(mockChannel.sendUpgradeProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        chaincodeId: 'org-acme-biznet',
                        txId: mockTransactionID,
                        fcn: 'upgrade'
                    });

                    sinon.assert.calledOnce(mockChannel.sendTransaction);
                });
        });

        it('should throw if runtime version check fails', () => {
            sandbox.stub(connection, '_checkRuntimeVersions').resolves({isCompatible: false, response: {version: '1.0.0'}});
            return connection.upgrade(mockSecurityContext)
                .should.be.rejectedWith(/cannot be upgraded/);
        });

        it('should throw if upgrade response fails to validate', () => {
            sandbox.stub(connection, '_checkRuntimeVersions').resolves({isCompatible: true, response: {version: '1.0.0'}});
            const errorResp = new Error('such error');
            const upgradeResponses = [ errorResp ];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendUpgradeProposal.resolves([ upgradeResponses, proposal, header ]);
            connection._validateResponses.withArgs(upgradeResponses).throws(errorResp);
            return connection.upgrade(mockSecurityContext)
                .should.be.rejectedWith(/such error/);
        });

        // TODO: should extract out _waitForEvents
        it('should throw an error if the orderer throws an error', () => {
            sandbox.stub(connection, '_checkRuntimeVersions').resolves({isCompatible: true, response: {version: '1.0.0'}});
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendUpgradeProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            return connection.upgrade(mockSecurityContext)
                .should.be.rejectedWith(/Failed to commit transaction/);
        });

        it('should throw an error if peer says transaction not valid', () => {
            sandbox.stub(connection, '_checkRuntimeVersions').resolves({isCompatible: true, response: {version: '1.0.0'}});
            // This is the instantiate proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChannel.sendUpgradeProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the orderer proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChannel.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response to indicate transaction not valid
            mockEventHub.registerTxEvent.yields(mockTransactionID.getTransactionID().toString(), 'INVALID');
            return connection.upgrade(mockSecurityContext)
                .should.be.rejectedWith(/Peer has rejected transaction '00000000-0000-0000-0000-000000000000'/);
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
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
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
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            connection._connectToEventHubs();
        });

        it('should throw if functionName not specified', () => {
            (() => {
                connection.queryChainCode(mockSecurityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw if args not specified', () => {
            (() => {
                connection.queryChainCode(mockSecurityContext, 'myfunc', null);
            }).should.throw(/args not specified/);
        });

        it('should throw if args contains non-string values', () => {
            (() => {
                connection.queryChainCode(mockSecurityContext, 'myfunc', [3.142]);
            }).should.throw(/invalid arg specified: 3.142/);
        });

        it('should submit a query request to the chaincode', () => {
            const response = Buffer.from('hello world');
            mockChannel.queryByChaincode.resolves([response]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockChannel.queryByChaincode);
                    sinon.assert.calledWith(mockChannel.queryByChaincode, {
                        chaincodeId: 'org-acme-biznet',
                        chaincodeVersion: connectorPackageJSON.version,
                        txId: mockTransactionID,
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2']
                    });
                    result.equals(response).should.be.true;
                });
        });

        it('should throw if no responses are returned', () => {
            mockChannel.queryByChaincode.resolves([]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No payloads were returned from the query request/);
        });

        it('should throw any responses that are errors', () => {
            // This is the transaction proposal and response (from the peers).
            const response = [ new Error('such error') ];
            // This is the response from the chaincode.
            mockChannel.queryByChaincode.resolves(response);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#invokeChainCode', () => {
        beforeEach(() => {
            sandbox.stub(process, 'on').withArgs('exit').yields();
            sandbox.stub(HLFConnection, 'createEventHub').returns(mockEventHub);
            sandbox.stub(connection, '_validateResponses').returns();
            sandbox.stub(connection, '_initializeChannel').resolves();
            connection._connectToEventHubs();
        });

        it('should throw if functionName not specified', () => {
            (() => {
                connection.invokeChainCode(mockSecurityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw if args not specified', () => {
            (() => {
                connection.invokeChainCode(mockSecurityContext, 'myfunc', null);
            }).should.throw(/args not specified/);
        });

        it('should throw if args contains non-string values', () => {
            (() => {
                connection.invokeChainCode(mockSecurityContext, 'myfunc', [3.142]);
            }).should.throw(/invalid arg specified: 3.142/);
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
                        chaincodeId: 'org-acme-biznet',
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
            connection._validateResponses.withArgs(proposalResponses).throws(errorResp);
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/an error/);
        });

        //TODO: Should extract out _waitForEvents
        it('should set the timeout to value specified in connection profile', () => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [ {
                    requestURL: 'grpc://localhost:7051',
                    eventURL: 'grpc://localhost:7053'
                }],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'suchmsp',
                timeout: 38
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org-acme-biznet', connectOptions, mockClient, mockChannel, [mockEventHubDef], mockCAClient);
            sandbox.stub(connection, '_validateResponses').returns();
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

        it('should throw an error if the commit throws an error', () => {
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
                .should.be.rejectedWith(/Failed to commit transaction/);
        });

    });

    describe('#createIdentity', () => {
        beforeEach(() => {
            sandbox.stub(connection, '_getLoggedInUser').returns(mockUser);
        });


        it('should throw error if no user is specified', () => {
            (() => {
                connection.createIdentity(mockSecurityContext, '');
            }).should.throw(/userID not specified/);
            (() => {
                connection.createIdentity(mockSecurityContext);
            }).should.throw(/userID not specified/);
            (() => {
                connection.createIdentity(mockSecurityContext, null);
            }).should.throw(/userID not specified/);
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
                        maxEnrollments: 0,
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
                            {name: 'hf.Registrar.Roles', value: 'client'}
                        ],
                        maxEnrollments: 0,
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
                        maxEnrollments: 0,
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
                        maxEnrollments: 0,
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
                        maxEnrollments: 0,
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
                        maxEnrollments: 0,
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

});
