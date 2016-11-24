/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto CLI - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const concertoAdmin = require('@ibm/ibm-concerto-admin');
const registry = concertoAdmin.BusinessNetwork;
const cmdUtil = require('./utils/cmdutils');
const fs = require('fs');

module.exports.command = 'network deploy [options]';
module.exports.describe = 'Concerto network administration subcommand';
module.exports.builder = {
//    networkName: {alias: 'n', required: true, describe: 'The business network name', type: 'string' },
    archiveFile: {alias: 'a', required: true, describe: 'The business network archive file name', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
};

module.exports.handler = (argv) => {

    let businessNetworkRegistry;
    let businessNetwork;

    let connectOptions = {membershipServicesURL: 'grpc://localhost:7054',
                          peerURL: 'grpc://localhost:7051',
                          eventHubURL: 'grpc://localhost:7053',
                          keyValStore: '/tmp/keyValStore',
                          deployWaitTime: '300',
                          invokeWaitTime: '100'
                         };
    let connection;

    return (() => {


        console.log('Parms: Id='+argv.enrollId+' secret='+argv.enrollSecret+' archive='+argv.archiveFile);
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
           throw new Error('Archive file '+argv.archiveFile+' does not exist');
       }
//       console.log('File contents'+JSON.stringify(fileContents));
       console.log('Read archive file, create businessNetwork');
       return registry.fromArchive(fileContents);
   })
   .then ((result) => {
       businessNetwork = result;
       console.log('Now determine network status...'+businessNetwork.getIdentifier());

       connection = new concertoAdmin.ManagementConnection(argv.enrollId, argv.enrollSecret, connectOptions);
       return connection.connect();
   })
   .then ((result) => {
       console.log('Connected to BNR');
       businessNetworkRegistry = result;
       console.log('Connected to Business network registry');
   })
   .then(() => {
       console.log('Now determine network status...'+businessNetwork.getIdentifier());
       process.exit();
   })
   .catch((error) => {
       console.error(error);
       process.exit(1);
   });
};
