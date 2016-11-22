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
const cmdUtil = require('../cmdutils');

module.exports.command = 'network [options]';
module.exports.describe = 'Concerto network administration subcommand';
module.exports.builder = {
    networkFile: {alias: 'n', required: true, describe: 'The business network definition file', type: 'string' },
    enrollId: { alias: 'i', required: true, describe: 'The enrollment ID of the user', type: 'string' },
    enrollSecret: { alias: 's', required: false, describe: 'The enrollment secret of the user', type: 'string' },
};

module.exports.handler = (argv) => {

    let businessNetworkRegistry;
    let businessNetworkName = 'TestNet';

    let connectOptions = {membershipServicesURL: 'grpc://localhost:7054',
                          peerURL: 'grpc://localhost:7051',
                          eventHubURL: 'grpc://localhost:7053',
                          keyValStore: '/tmp/keyValStore',
                          deployWaitTime: '300',
                          invokeWaitTime: '100'
                         };
    let connection;

    return (() => {


        console.log('Parms: Id='+argv.enrollId+' secret='+argv.enrollSecret+' archive='+argv.networkFile) ;
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
        connection = new concertoAdmin.ManagementConnection(argv.enrollId, argv.enrollSecret, connectOptions);
        console.log('Got connection');
        return connection.connect();
    })
    .then ((result) => {
        console.log('Connected to BNR');
        businessNetworkRegistry = result;
        console.log('Connected to Business network registry');
    })
    .then(() => {
        console.log('Now determine network status...'+businessNetworkName);
        process.exit();
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
};

/*
//const admin = require('@ibm/ibm-concerto-client');

let enrollId = 'WebAppAdmin';
let enrollSecret = 'DJY27pEnl16d';
let networkName = 'biz.net.digtalTestNet';
let businessNetworkRegistry;

concertoAdmin.connect(networkName, enrollId, enrollSecret)
.then((result) => {
    businessNetworkRegistry = result;
    console.log('Connected to Business Network Registry',JSON.stringify(businessNetworkRegistry,null,2));
})
.catch(function (error) {
    throw error;
});

if (!concerto.networkExists(businessNetworkName)) {
    createNetwork = true;
    resolve(concerto.create(businessNetworkName, this.getConnectOptions()));
}  else {
    createNetwork = false;
    resolve(concerto.connect(businessNetworkName));
}
})
.then (() => {
return concerto.login(enrollId, enrollSecret);
})
// Then deploy the Concerto framework.
.then((result) => {
// Save the security context returned by login().
securityContext = result;
if (createNetwork === true) {
   // Deploy the Concerto framework.
    return concerto.deploy(securityContext);
} else {
   // Just set the chaincode ID as framework is already deployed
    securityContext.setChaincodeID(concerto.getChaincodeId(businessNetworkName));
}
})
// Concerto is now deployed and ready for use.
// Now we need to load the Concerto models.
.then(() => {
let modelManager = concerto.getModelManager(securityContext);
modelManager.clearModelFiles();
modelManager.addModelFiles(this.getModels());

// Update the models in the Blockchain.
return concerto.updateModels(securityContext);
*/
