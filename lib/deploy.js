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

const adminConnection = require('@ibm/ibm-concerto-admin');
const BusinessNetworkDefinition = adminConnection.BusinessNetwork;
const cmdUtil = require('./utils/cmdutils');
const fs = require('fs');

module.exports.command = 'network deploy [options]';
module.exports.describe = 'Deploy a business network';
module.exports.builder = {
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
};

module.exports.handler = (argv) => {

    let businessNetwork;

    let connectOptions = {type: 'hlf'
                         ,membershipServicesURL: 'grpc://localhost:7054'
                         ,peerURL: 'grpc://localhost:7051'
                         ,eventHubURL: 'grpc://localhost:7053'
                         ,keyValStore: '/tmp/keyValStore'
                         ,deployWaitTime: '300'
                         ,invokeWaitTime: '100'};
    let admin;
    let connectionProfileName = 'cliDeploy';
    let businessNetworkName;

    return (() => {

        console.log ('Deploying business network from archive '+argv.archiveFile);
        if (!argv.enrollSecret) {
            return cmdUtil.prompt({
                name: 'enrollmentSecret',
                description: 'What is the enrollment secret of the user?',
                required: true,
                hidden: true,
                replace: '*'
            })
            .then((result) => {
                argv.enrollSecret = result;
            });
        } else {
            return Promise.resolve();
        }
    })()
   .then (() => {
       let fileContents = null;
       if (fs.existsSync(argv.archiveFile)) {
           fileContents = fs.readFileSync(argv.archiveFile);
       } else {
           throw new Error('Archive file '+argv.archiveFile+' does not exist.');
       }
       return BusinessNetworkDefinition.fromArchive(fileContents);
   })
   .then ((result) => {
       businessNetwork = result;
       businessNetworkName = businessNetwork.getIdentifier();
       console.log('Business network definition:');
       console.log('\tIdentifier: '+businessNetworkName);
       console.log('\tDescription: '+businessNetwork.getDescription());
       admin = new adminConnection.Admin();
       return admin.createConnectionProfile(connectionProfileName, connectOptions);
   })
   .then ((result) => {
       return admin.connect(connectionProfileName, argv.enrollId, argv.enrollSecret);
   })
   .then((result) => {
       console.log('Deploying business network definition. This may take a little time.');
       return admin.deploy(businessNetwork);
   })
   .then(() => {
       console.log ('Command comleted successfully.');
       process.exit(0);
   })
   .catch((error) => {
       console.log(error+ '\nCommand failed.');
       process.exit(1);
   });
};
