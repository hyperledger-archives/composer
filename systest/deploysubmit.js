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

const Admin = require('@ibm/ibm-concerto-admin').Admin;
//const Client = require('@ibm/ibm-concerto-client');
const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
const fs = require('fs');
const admin = new Admin();

const config = {
    type: 'hlf',
    keyValStore: '/tmp/keyValStore',
    membershipServicesURL: 'grpc://localhost:7054',
    peerURL: 'grpc://localhost:7051',
    eventHubURL: 'grpc://localhost:7053'
};

const CONNECTION_PROFILE_NAME = 'testprofile';

// the id of the business network archive (as defined in package.json)
//const NETWORK_ID = '@ibm/test-archive-0.0.1';

return admin.createConnectionProfile('testprofile', config)
    .then(() => {
        console.log('Created connection profile');
        return admin.connect(CONNECTION_PROFILE_NAME, 'WebAppAdmin', 'DJY27pEnl16d');
    })
    .then(() => {
        let readFile = fs.readFileSync(__dirname + '/data/businessnetwork.zip');
        return BusinessNetwork.fromArchive(readFile);
    })
    .then((businessNetwork) => {
        console.log('Read BusinessNetwork archive');
        return admin.deploy(businessNetwork, true);
    })
    .then(() => {
        console.log('Deployed BusinessNetwork archive');
        return admin.ping();
    })
    .then(() => {
        console.log('Pinged server');
        return admin.disconnect();
    })
    .then(() => {
        console.log('Done');
    });
