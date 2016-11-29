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

const Admin = require('@ibm/ibm-concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const cmdUtil = require('./utils/cmdutils');
const fs = require('fs');

/**
 * <p>
 * Concerto deploy command
 * </p>
 * <p><a href="diagrams/DeployCommand.svg"><img src="diagrams/deploycommand.svg" style="width:100%;"/></a></p>
 * @private
 */
class DeployCommand {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let businessNetwork;

        let connectOptions = {type: 'hlf'
                             ,membershipServicesURL: 'grpc://localhost:7054'
                             ,peerURL: 'grpc://localhost:7051'
                             ,eventHubURL: 'grpc://localhost:7053'
                             ,keyValStore: '/tmp/keyValStore'
                             ,deployWaitTime: '300'
                             ,invokeWaitTime: '100'};
        let adminConnection;
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
            adminConnection = new Admin.AdminConnection();
            return adminConnection.createProfile(connectionProfileName, connectOptions);
        })
        .then ((result) => {
            return adminConnection.connect(connectionProfileName, argv.enrollId, argv.enrollSecret);
        })
        .then((result) => {
            console.log('Deploying business network definition. This may take a little time.');
            return adminConnection.deploy(businessNetwork);
        });
    }
}

module.exports = DeployCommand;
