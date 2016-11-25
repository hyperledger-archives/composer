/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Module = require('../');
const Admin = require('../lib/admin');
const ConcertoCommon = require('@ibm/ibm-concerto-common');
const BusinessNetwork = ConcertoCommon.BusinessNetwork;
const ConcertoHLFConnectionManager = require('@ibm/ibm-concerto-connector-hlf');
const HFCConnection = require('@ibm/ibm-concerto-connector-hlf/lib/hfcconnection');
const SecurityContext = ConcertoCommon.SecurityContext;

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
const expect = chai.expect;
chai.use(require('chai-things'));

describe('Admin', () => {

    let mockConcertoConnectionManager;
    let mockHFCConnection;
    let admin;

    const config =
        {
            type: 'hlf',
            keyValStore: '/tmp/keyValStore',
            membershipServicesURL : 'grpc://localhost:7054',
            peerURL : 'grpc://localhost:7051',
            eventHubURL: 'grpc://localhost:7053'
        };

    mockConcertoConnectionManager = sinon.createStubInstance(ConcertoHLFConnectionManager);
    mockHFCConnection = sinon.createStubInstance(HFCConnection);

    mockHFCConnection.getConnectionManager.returns(ConcertoHLFConnectionManager);
    mockHFCConnection.getIdentifier.returns('BNI@CP');
    mockHFCConnection.disconnect.returns(Promise.resolve());
    mockHFCConnection.login.returns(Promise.resolve(new SecurityContext(mockHFCConnection)));
    mockHFCConnection.deploy.returns(Promise.resolve({'chaincodeID': '<ChaincodeID>'}));
    mockHFCConnection.ping.returns(Promise.resolve('TXID'));

    mockConcertoConnectionManager.connect.returns(Promise.resolve(mockHFCConnection));
    mockConcertoConnectionManager.onDisconnect.returns();
    admin = new Admin();
    sinon.stub(admin.connectionProfileManager, 'connect').resolves(mockHFCConnection);

    describe('#module', () => {
        it('should give access to Admin', () => {
            Module.Admin.should.not.be.null;
        });
        it('should give access to BusinessNetwork', () => {
            Module.BusinessNetwork.should.not.be.null;
        });
    });

    describe('#constructor', () => {
        it('should create a new Admin instance', () => {
            let admin = new Admin();
            admin.should.not.be.null;
        });
        it('should not fail if no connectionManager is provided', () => {
            let admin = new Admin();
            admin.connectionProfileManager.should.not.be.null;
        });
    });

    describe('#connect', () => {

        it('should return connected connection', () => {
            admin.connect('testprofile', 'testnetwork', 'WebAppAdmin', 'DJY27pEnl16d')
            .then((res) => {
                res.should.equal('connected');
            })
            .catch(() => {
                // Should not get here
            });
        });

    });

    describe('#createConnectionProfile', () => {
        it('should return a resolved promise', () => {
            admin.createConnectionProfile('testprofile', config)
            .then((res) => {
                res.should.be.undefined;
            })
            .catch(() => {
                // Should not get here
            });
        });
    });

    describe('#disconnect', () => {
        it('should set connection and security context to null', () => {
            let admin = new Admin();
            sinon.stub(admin.connectionProfileManager, 'connect').resolves(mockHFCConnection);
            admin.connect()
            .then(() => {
                admin.disconnect();
                expect(admin.connection).should.be.true;
                expect(admin.securityContext).to.be.null;
            });
        });

        it('should not fail when no connection is set', () => {
            let admin = new Admin();
            expect(admin.disconnect()).not.to.throw;
        });
    });

    describe('#deploy', () => {

        it('should be able to deploy a business network', () => {
            let businessNetwork = new BusinessNetwork();
            admin.deploy(businessNetwork)
            .then((res) => {
                res.should.equal({ chaincodeID: '<ChaincodeID>'});
            });
        });
    });

    describe('#ping', () => {
        it('should not fail', () => {
            admin.ping()
            .then((res) => {
                res.should.equal('TXID');
            });
        });
    });
});
