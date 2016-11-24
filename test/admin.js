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
const fs = require('fs');

const chai = require('chai');
const sinon = require('sinon');
chai.should();
const expect = require('chai').expect;
chai.use(require('chai-things'));

describe('Admin', () => {

    let mockConcertoConnectionManager;
    let mockHFCConnection;
    let admin;

    const config =
        {
            type: 'hfc',
            keyValStore: '/tmp/keyValStore',
            membershipServicesURL : 'grpc://localhost:7054',
            peerURL : 'grpc://localhost:7051',
            eventHubURL: 'grpc://localhost:7053',
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
    admin = new Admin({'connectionManager': mockConcertoConnectionManager});

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
            let admin = new Admin({'connectionManager': mockConcertoConnectionManager});
            admin.should.not.be.null;
        });
        it('should not fail if no connectionManager is provided', () => {
            let admin = new Admin();
            admin.connectionProfileManager.should.not.be.null;
        });
    });

    describe('#connect', () => {

        it('should get a connection', () => {
            return admin.createConnectionProfile('testprofile', config)
            .then(() => {
                return admin.connect('testprofile', 'testnetwork', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then((connection) => {
                connection.should.not.be.null;
                return admin.disconnect();
            });
        });
    });

    describe('#disconnect', () => {
        it('should not fail when no connection is set', () => {
            let admin = new Admin({'connectionManager': mockConcertoConnectionManager});
            expect(admin.disconnect()).not.to.throw;
        });
    });

    describe('#deploy', () => {

        it('should be able to deploy a business network', () => {
            return admin.createConnectionProfile('testprofile', config)
            .then(() => {
                return admin.connect('testprofile', 'testnetwork', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then(() => {
                let readFile = fs.readFileSync(__dirname+'/data/businessnetwork.zip');
                return BusinessNetwork.fromArchive(readFile);
            })
            .then((businessNetwork) => {
                return admin.deploy( businessNetwork, true );
            })
            .then(() => {
                return admin.disconnect();
            });
        });
    });

    describe('#ping', () => {
        it('should not fail', () => {
            return admin.createConnectionProfile('testprofile', config)
            .then(() => {
                return admin.connect('testprofile', 'testnetwork', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then(() => {
                let readFile = fs.readFileSync(__dirname+'/data/businessnetwork.zip');
                return BusinessNetwork.fromArchive(readFile);
            })
            .then((businessNetwork) => {
                return admin.deploy( businessNetwork, true );
            })
            .then(() => {
                return admin.ping();
            })
            .then(() => {
                return admin.disconnect();
            });
        });
    });
});
