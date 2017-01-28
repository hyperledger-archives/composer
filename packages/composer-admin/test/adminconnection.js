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

const Module = require('../');
const AdminConnection = require('../lib/adminconnection');
const ConcertoCommon = require('composer-common');
const BusinessNetworkDefinition = ConcertoCommon.BusinessNetworkDefinition;
const Connection = ConcertoCommon.Connection;
const ConnectionManager = ConcertoCommon.ConnectionManager;
const SecurityContext = ConcertoCommon.SecurityContext;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('AdminConnection', () => {

    let mockConnectionManager;
    let mockConnection;
    let mockSecurityContext;
    let adminConnection;

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

        mockConnection.getConnectionManager.returns(mockConnectionManager);
        mockConnection.getIdentifier.returns('BNI@CP');
        mockConnection.disconnect.resolves();
        mockConnection.login.resolves(mockSecurityContext);
        mockConnection.deploy.resolves();
        mockConnection.ping.resolves();
        mockConnection.undeploy.resolves();
        mockConnection.update.resolves();
        mockConnection.list.resolves(['biznet1', 'biznet2']);

        mockConnectionManager.connect.resolves(mockConnection);
        adminConnection = new AdminConnection();
        sinon.stub(adminConnection.connectionProfileManager, 'connect').resolves(mockConnection);
        sinon.stub(adminConnection.connectionProfileStore, 'save').withArgs('testprofile', sinon.match.any).resolves();
        sinon.stub(adminConnection.connectionProfileStore, 'load').withArgs('testprofile').resolves(config);
        sinon.stub(adminConnection.connectionProfileStore, 'loadAll').resolves({ profile1: config, profile2: config2 });
        sinon.stub(adminConnection.connectionProfileStore, 'delete').withArgs('testprofile').resolves();
    });

    describe('#module', () => {
        it('should give access to AdminConnection', () => {
            Module.AdminConnection.should.not.be.null;
        });
        it('should give access to BusinessNetworkDefinition', () => {
            Module.BusinessNetworkDefinition.should.not.be.null;
        });
    });

    describe('#constructor', () => {
        it('should create a new AdminConnection instance', () => {
            let adminConnection = new AdminConnection();
            adminConnection.should.not.be.null;
        });
        it('should not fail if no connectionManager is provided', () => {
            let adminConnection = new AdminConnection();
            adminConnection.connectionProfileManager.should.not.be.null;
        });
    });

    describe('#connect', () => {

        it('should return connected connection', () => {
            return adminConnection.connect('testprofile', 'testnetwork', 'WebAppAdmin', 'DJY27pEnl16d')
            .then((res) => {
                res.should.equal('connected');
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

    describe('#deploy', () => {

        it('should be able to deploy a business network definition', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            let businessNetworkDefinition = new BusinessNetworkDefinition('name@1.0.0');
            return adminConnection.deploy(businessNetworkDefinition)
            .then(() => {
                sinon.assert.calledOnce(mockConnection.deploy);
                sinon.assert.calledWith(mockConnection.deploy, mockSecurityContext,  true, businessNetworkDefinition);
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
        it('should not fail', () => {
            adminConnection.connection = mockConnection;
            adminConnection.securityContext = mockSecurityContext;
            return adminConnection.ping()
            .then(() => {
                sinon.assert.calledOnce(mockConnection.ping);
                sinon.assert.calledWith(mockConnection.ping, mockSecurityContext);
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

});
