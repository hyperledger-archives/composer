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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Chain = require('fabric-client/lib/Chain');
const Client = require('fabric-client');
const EventHub = require('fabric-client/lib/EventHub');
const FabricCAClientImpl = require('fabric-ca-client');
const HLFConnection = require('../lib/hlfconnection');
const HLFConnectionManager = require('../lib/hlfconnectionmanager');
const HLFSecurityContext = require('../lib/hlfsecuritycontext');
const path = require('path');
const semver = require('semver');
const User = require('fabric-client/lib/User.js');
const utils = require('fabric-client/lib/utils.js');

const connectorPackageJSON = require('../package.json');
const originalVersion = connectorPackageJSON.version;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlfv1'));

describe('HLFConnection', () => {

    let sandbox;
    let mockConnectionManager, mockChain, mockClient, mockEventHub, mockCAClient, mockUser, mockSecurityContext, mockBusinessNetwork;
    let connectOptions;
    let connection;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockConnectionManager = sinon.createStubInstance(HLFConnectionManager);
        mockChain = sinon.createStubInstance(Chain);
        mockClient = sinon.createStubInstance(Client);
        mockEventHub = sinon.createStubInstance(EventHub);
        mockCAClient = sinon.createStubInstance(FabricCAClientImpl);
        mockUser = sinon.createStubInstance(User);

        mockSecurityContext = sinon.createStubInstance(HLFSecurityContext);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetwork.getName.returns('org.acme.biznet');
        mockBusinessNetwork.toArchive.resolves(Buffer.from('hello world'));
        connectOptions = {
            orderers: [
                'grpc://localhost:7050'
            ],
            peers: [
                'grpc://localhost:7051'
            ],
            events: [
                'grpc://localhost:7053'
            ],
            ca: 'http://localhost:7054',
            keyValStore: '/tmp/hlfabric1',
            channel: 'testchainid',
            mspID: 'suchmsp'
        };
        connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', connectOptions, mockClient, mockChain, [mockEventHub], mockCAClient);
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

    describe('#constructor', () => {

        it('should subscribe to the eventHub and emit events', () => {
            const events = {
                payload: {
                    toString: () => {
                        return '"{"event":"event"}"';
                    }
                }
            };
            connection.emit = sandbox.stub();
            mockEventHub.registerChaincodeEvent.withArgs('org.acme.biznet', 'composer', sinon.match.func).yield(events);
            sinon.assert.calledOnce(mockEventHub.registerChaincodeEvent);
            sinon.assert.calledWith(mockEventHub.registerChaincodeEvent, 'org.acme.biznet', 'composer', sinon.match.func);
            sinon.assert.calledOnce(connection.emit);
        });

        it('should throw if connectOptions not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', null, mockClient, mockChain, mockEventHub, mockCAClient);
            }).should.throw(/connectOptions not specified/);
        });

        it('should throw if client not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', { type: 'hlfv1' }, null, mockChain, mockEventHub, mockCAClient);
            }).should.throw(/client not specified/);
        });

        it('should throw if chain not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', { type: 'hlfv1' }, mockClient, null, mockEventHub, mockCAClient);
            }).should.throw(/chain not specified/);
        });

        it('should throw if eventHubs not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', { type: 'hlfv1' }, mockClient, mockChain, null, mockCAClient);
            }).should.throw(/eventHubs not specified or not an array/);
        });

        it('should throw if eventHubs not an array', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', { type: 'hlfv1' }, mockClient, mockChain, mockEventHub, mockCAClient);
            }).should.throw(/eventHubs not specified or not an array/);
        });


        it('should throw if caClient not specified', () => {
            (() => {
                new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', { type: 'hlfv1' }, mockClient, mockChain, [mockEventHub], null);
            }).should.throw(/caClient not specified/);
        });
    });

    describe('#getConnectionOptions', () => {

        it('should return the connection options', () => {
            connection.getConnectionOptions().should.deep.equal(connectOptions);
        });

    });

    describe('#disconnect', () => {

        it('should disconnect from the event hub if connected', () => {
            mockEventHub.isconnected.returns(true);
            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockEventHub.disconnect);
                });
        });

        it('should not disconnect from the event hub if not connected', () => {
            mockEventHub.isconnected.returns(false);
            return connection.disconnect()
                .then(() => {
                    sinon.assert.notCalled(mockEventHub.disconnect);
                });
        });

        it('should handle an error disconnecting from the event hub', () => {
            mockEventHub.isconnected.throws(new Error('such error'));
            return connection.disconnect()
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#enroll', () => {

        beforeEach(() => {
            sandbox.stub(HLFConnection, 'createUser').returns(mockUser);
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

        it('should throw if enrollmentID not specified', () => {
            (() => {
                connection.login(null, 'adminpw');
            }).should.throw(/enrollmentID not specified/);
        });

        it('should throw if enrollmentSecret not specified', () => {
            (() => {
                connection.login('admin', null);
            }).should.throw(/enrollmentSecret not specified/);
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

    describe('#_install', () => {
        const tempDirectoryPath = path.resolve('tmp', 'composer1234567890');
        //const targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', 'composer');
        //const versionFilePath = path.resolve(targetDirectoryPath, 'version.go');
        it('should rethrow error if unable to create temp dir', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').rejects(new Error('some error 1'));
            connection._install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error 1/);
        });

        it('should rethrow error if unable to copy chaincode source', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').rejects(new Error('some error 2'));
            connection._install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error/);
        });

        it('should rethrow error if unable to copy chaincode source', () => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').rejects(new Error('some error 3'));
            connection._install(mockSecurityContext, mockBusinessNetwork)
                .should.be.rejectedWith(/some error 3/);
        });

    });

    describe('#deploy', () => {

        const tempDirectoryPath = path.resolve('tmp', 'composer1234567890');
        const targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', 'composer');
        const versionFilePath = path.resolve(targetDirectoryPath, 'version.go');

        beforeEach(() => {
            sandbox.stub(connection.temp, 'mkdir').withArgs('composer').resolves(tempDirectoryPath);
            sandbox.stub(connection.fs, 'copy').resolves();
            sandbox.stub(connection.fs, 'outputFile').resolves();
        });

        it('should throw if businessNetwork not specified', () => {
            (() => {
                connection.deploy(mockSecurityContext, false, null);
            }).should.throw(/businessNetwork not specified/);
        });

        it('should request an event timeout based on connection settings', () => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [
                    'grpc://localhost:7051'
                ],
                events: [
                    'grpc://localhost:7053'
                ],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'suchmsp',
                deployWaitTime: 39,
                invokeWaitTime: 63,
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', connectOptions, mockClient, mockChain, [mockEventHub], mockCAClient);
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
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
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .catch(() => {
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, connectOptions.deployWaitTime * 1000);
                });
        });

        it('should deploy the business network', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, versionFilePath, sinon.match(/const version = /));
                    sinon.assert.calledOnce(mockChain.sendInstallProposal);
                    sinon.assert.calledOnce(mockChain.initialize);
                    sinon.assert.calledOnce(mockChain.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChain.sendInstallProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: connectOptions.channel,
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                    });
                    sinon.assert.calledWith(mockChain.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: connectOptions.channel,
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=']
                    });

                    sinon.assert.calledOnce(mockChain.sendTransaction);
                });
        });

        it('should instantiate the business network if it responds already installed', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const errorResp = new Error('Error installing chaincode code systest-participants:0.5.11(chaincode /var/hyperledger/production/chaincodes/systest-participants.0.5.11 exists)');
            const installResponses = [errorResp];
            const instantiateResponses = [{
                response: {
                    status: 200
                }
            }];

            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ installResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: instantiateResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .then(() => {
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, versionFilePath, sinon.match(/const version = /));
                    sinon.assert.calledOnce(mockChain.sendInstallProposal);
                    sinon.assert.calledOnce(mockChain.initialize);
                    sinon.assert.calledOnce(mockChain.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChain.sendInstallProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: connectOptions.channel,
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                    });
                    sinon.assert.calledWith(mockChain.sendInstantiateProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: connectOptions.channel,
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                        fcn: 'init',
                        args: ['aGVsbG8gd29ybGQ=']
                    });

                    sinon.assert.calledOnce(mockChain.sendTransaction);
                });
        });

        it('should throw if install fails for unexpected reason', () => {
            sandbox.stub(global, 'setTimeout');
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const errorResp = new Error('Error something went completely wrong');
            const installResponses = [errorResp];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ installResponses, proposal, header ]);
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .catch((error) => {
                    error.message.should.equal(errorResp.message);
                    sinon.assert.calledOnce(connection.fs.copy);
                    sinon.assert.calledWith(connection.fs.copy, runtimeModulePath, targetDirectoryPath, sinon.match.object);
                    // Check the filter ignores any relevant node modules files.
                    connection.fs.copy.firstCall.args[2].filter('some/path/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('some/node_modules/here').should.be.true;
                    connection.fs.copy.firstCall.args[2].filter('composer-runtime-hlfv1/node_modules/here').should.be.false;
                    sinon.assert.calledOnce(connection.fs.outputFile);
                    sinon.assert.calledWith(connection.fs.outputFile, versionFilePath, sinon.match(/const version = /));
                    sinon.assert.calledOnce(mockChain.sendInstallProposal);
                    sinon.assert.notCalled(mockChain.initialize);
                    sinon.assert.notCalled(mockChain.sendInstantiateProposal);
                    sinon.assert.calledWith(mockChain.sendInstallProposal, {
                        chaincodePath: 'composer',
                        chaincodeVersion: connectorPackageJSON.version,
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: connectOptions.channel,
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                    });
                });
        });

        it('should throw if no install responses are returned', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const installResponses = [];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ installResponses, proposal, header ]);
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/No results were returned/);
        });

        it('should throw if no instantiate responses are returned', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const installResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposalResponses = [];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ installResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/No results were returned/);
        });


        it('should throw any instantiate responses that are errors', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            const installResponses = [{
                response: {
                    status: 200
                }
            }];
            const instantiateResponses = [ new Error('such error') ];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ installResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ instantiateResponses, proposal, header ]);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/such error/);
        });

        it('should throw any endorsement responses that have a non-200 status code', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 500,
                    payload: 'such error'
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/such error/);
        });

        it('should throw an error if peer says transaction not valid', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'INVALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/Peer has rejected transaction '00000000-0000-0000-0000-000000000000'/);
        });

        it('should throw an error if the commit of the transaction times out', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            // mockEventHub.registerTxEvent.yields();
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to receive commit notification/);
        });

        it('should throw an error if the commit throws an error', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the deployment proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            mockChain.sendInstallProposal.resolves([ proposalResponses, proposal, header ]);
            mockChain.sendInstantiateProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'INVALID');
            return connection.deploy(mockSecurityContext, false, mockBusinessNetwork)
                .should.be.rejectedWith(/Failed to commit transaction/);
        });

    });

    describe('#undeploy', () => {

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
            return connection.undeploy(mockSecurityContext, 'org.acme.biznet')
                .then(() => {
                    sinon.assert.calledOnce(connection.invokeChainCode);
                    sinon.assert.calledWith(connection.invokeChainCode, mockSecurityContext, 'undeployBusinessNetwork', []);
                });
        });

        it('should handle errors invoking the chaincode', () => {
            sandbox.stub(connection, 'invokeChainCode').rejects('such error');
            return connection.undeploy(mockSecurityContext, 'org.acme.biznet')
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#update', () => {

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

    describe('#ping', () => {

        it('should handle a chaincode with the same version as the connector', () => {
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.should.deep.equal(response);
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
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.should.deep.equal(response);
                });
        });

        it('should throw for a chaincode with a greater version than the connector', () => {
            const version = connectorPackageJSON.version;
            const newVersion = semver.inc(version, 'major');
            const response = {
                version: newVersion,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/is incompatible with/);
        });

        it('should handle a chaincode running a prelease build at the same version as the connector', () => {
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.should.deep.equal(response);
                });
        });

        it('should handle a chaincode running a prelease build at the same version as the connector', () => {
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: connectorPackageJSON.version,
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection.ping(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                    result.should.deep.equal(response);
                });
        });

        it('should throw for a chaincode running a prelease build at a different version to the connector', () => {
            const oldVersion = connectorPackageJSON.version;
            connectorPackageJSON.version += '-20170101';
            const response = {
                version: oldVersion + '-20170202',
                participant: 'org.acme.biznet.Person#SSTONE1@uk.ibm.com'
            };
            sandbox.stub(connection, 'queryChainCode').resolves(Buffer.from(JSON.stringify(response)));
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/is incompatible with/);
        });

        it('should handle errors invoking the chaincode', () => {
            sandbox.stub(connection, 'queryChainCode').rejects('such error');
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#queryChainCode', () => {

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
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the response from the chaincode.
            const response = Buffer.from('hello world');
            mockChain.queryByChaincode.resolves([response]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockChain.queryByChaincode);
                    sinon.assert.calledWith(mockChain.queryByChaincode, {
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: 'testchainid',
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2'],
                        attrs: ['userID']
                    });
                    result.equals(response).should.be.true;
                });
        });

        it('should throw if no responses are returned', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the response from the chaincode.
            mockChain.queryByChaincode.resolves([]);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No payloads were returned from the query request/);
        });

        it('should throw any responses that are errors', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const response = [ new Error('such error') ];
            // This is the response from the chaincode.
            mockChain.queryByChaincode.resolves(response);
            return connection.queryChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#invokeChainCode', () => {

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
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(mockChain.sendTransactionProposal);
                    sinon.assert.calledWith(mockChain.sendTransactionProposal, {
                        //chaincodeId: 'org-acme-biznet', required for alpha2
                        chaincodeId: 'org.acme.biznet',
                        chainId: 'testchainid',
                        txId: '00000000-0000-0000-0000-000000000000',
                        nonce: '11111111-1111-1111-1111-111111111111',
                        fcn: 'myfunc',
                        args: ['arg1', 'arg2'],
                        attrs: ['userID']
                    });
                    sinon.assert.calledOnce(mockChain.sendTransaction);
                });
        });

        it('should throw if no endorsement responses are returned', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/No results were returned/);
        });

        it('should throw any endorsement responses that are errors', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [ new Error('such error') ];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/such error/);
        });

        it('should throw any endorsement responses that have a non-200 status code', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 500,
                    payload: 'such error'
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            mockEventHub.registerTxEvent.yields('00000000-0000-0000-0000-000000000000', 'VALID');
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/such error/);
        });

        it('should set the timeout to value specified in connection profile', () => {
            connectOptions = {
                orderers: [
                    'grpc://localhost:7050'
                ],
                peers: [
                    'grpc://localhost:7051'
                ],
                events: [
                    'grpc://localhost:7053'
                ],
                ca: 'http://localhost:7054',
                keyValStore: '/tmp/hlfabric1',
                channel: 'testchainid',
                mspID: 'suchmsp',
                deployWaitTime: 39,
                invokeWaitTime: 63,
            };
            connection = new HLFConnection(mockConnectionManager, 'hlfabric1', 'org.acme.biznet', connectOptions, mockClient, mockChain, [mockEventHub], mockCAClient);
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            // mockEventHub.registerTxEvent.yields();
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .catch(() => {
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
                    sinon.assert.calledWith(global.setTimeout, sinon.match.func, connectOptions.invokeWaitTime * 1000);
                });
        });


        it('should throw an error if the commit of the transaction times out', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'SUCCESS'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
            // This is the event hub response.
            sandbox.stub(global, 'setTimeout').yields();
            // mockEventHub.registerTxEvent.yields();
            return connection.invokeChainCode(mockSecurityContext, 'myfunc', ['arg1', 'arg2'])
                .should.be.rejectedWith(/Failed to receive commit notification/);
        });

        it('should throw an error if the commit throws an error', () => {
            // This is the generated nonce.
            sandbox.stub(utils, 'getNonce').returns('11111111-1111-1111-1111-111111111111');
            // This is the generated transaction
            mockChain.buildTransactionID.returns('00000000-0000-0000-0000-000000000000');
            // mock out getUserContext version in case we need to return to using this one
            mockChain.buildTransactionID_getUserContext.resolves('00000000-0000-0000-0000-000000000000');
            // This is the transaction proposal and response (from the peers).
            const proposalResponses = [{
                response: {
                    status: 200
                }
            }];
            const proposal = { proposal: 'i do' };
            const header = { header: 'gooooal' };
            mockChain.sendTransactionProposal.resolves([ proposalResponses, proposal, header ]);
            // This is the commit proposal and response (from the orderer).
            const response = {
                status: 'FAILURE'
            };
            mockChain.sendTransaction.withArgs({ proposalResponses: proposalResponses, proposal: proposal, header: header }).resolves(response);
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
                            {name: 'hf.Registrar.Roles', value: 'client'}//,
//                            {name: 'hf.Registrar.DelegateRoles', value: 'client'},
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

        it('should issue a request with user supplied attributes', () => {
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


        it('should handle a register error', () => {
            mockCAClient.register.rejects(new Error('anerror'));
            return connection.createIdentity(mockSecurityContext, 'auser')
                .should.be.rejectedWith(/anerror/);

        });
    });

    describe('#list', () => {

        it('should return an empty array if no instantiated chaincodes', () => {
            mockChain.queryInstantiatedChaincodes.resolves({
                chaincodes: []
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal([]);
        });

        it('should return an array of chaincode names for all instantiated chaincodes', () => {
            mockChain.queryInstantiatedChaincodes.resolves({
                chaincodes: [{
                    name: 'org.acme.biznet1',
                    version: '1.0.0',
                    path: 'composer'
                }, {
                    name: 'org.acme.biznet2',
                    version: '1.2.0',
                    path: 'composer'
                }]
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal(['org.acme.biznet1', 'org.acme.biznet2']);
        });

        it('should filter out any non-composer instantiated chaincodes', () => {
            mockChain.queryInstantiatedChaincodes.resolves({
                chaincodes: [{
                    name: 'org.acme.biznet1',
                    version: '1.0.0',
                    path: 'composer'
                }, {
                    name: 'org.acme.biznet2',
                    version: '1.2.0',
                    path: 'dogecc'
                }]
            });
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal(['org.acme.biznet1']);
        });

        it('should handle any errors querying instantiated chaincodes', () => {
            mockChain.queryInstantiatedChaincodes.rejects(new Error('such error'));
            return connection.list(mockSecurityContext)
                .should.be.rejectedWith(/such error/);
        });

    });

});
