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

const Admin = require('../lib/admin');
const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
const fs = require('fs');
const chai = require('chai');
chai.should();
//const expect = require('chai').expect;
chai.use(require('chai-things'));

describe('Admin', () => {

    describe('#constructor', () => {
        let admin = new Admin();
        admin.should.not.be.null;
    });

    // enrollmentID: 'WebAppAdmin',
    // enrollmentSecret : 'DJY27pEnl16d',
    // chaincodeID : 'adcc3aee85db589003b93445ef03eb42900da44b716c8bc96b0d4e1e6b6b7b36'

    const admin = new Admin();
    const config =
        {
            type: 'hfc',
            keyValStore: '/tmp/keyValStore',
            membershipServicesURL : 'grpc://localhost:7054',
            peerURL : 'grpc://localhost:7051',
            eventHubURL: 'grpc://localhost:7053'
        };

    describe('#connect', () => {

        it('should get a connection', () => {
            return admin.createConnectionProfile('testprofile', config)
            .then(() => {
                return admin.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then((connection) => {
                connection.should.not.be.null;
                return admin.disconnect();
            });
        });
    });

    describe('#deploy', () => {

        it('should be able to deploy a business network', () => {
            return admin.createConnectionProfile('testprofile', config)
            .then(() => {
                return admin.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then((connection) => {
                let readFile = fs.readFileSync(__dirname+'/data/businessnetwork.zip');
                return BusinessNetwork.fromArchive(readFile);
            })
            .then((businessNetwork) => {
                return admin.deploy( businessNetwork, true );
            })
            .then(() => {
                return admin.disconnect();
            });
        }).timeout(50000);
    });
});
