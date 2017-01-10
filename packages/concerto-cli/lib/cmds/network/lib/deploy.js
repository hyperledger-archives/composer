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

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const cmdUtil = require('../../utils/cmdutils');
const fs = require('fs');
const homedir = require('homedir');

const PROFILE_ROOT = homedir() + '/.concerto-connection-profiles/';
const CONNECTION_FILE = 'connection.json';

const CREDENTIALS_ROOT = homedir() + '/.concerto-credentials';
const DEFAULT_PROFILE_NAME = 'defaultProfile';

/**
 * <p>
 * Concerto deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Deploy {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv, updateOption) {

        let updateBusinessNetwork = (updateOption === true)
                                  ? true
                                  : false;
        let businessNetworkDefinition;

        let connectOptions;
        let adminConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = Deploy.getDefaultProfileName(argv);
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
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            let archiveFileContents = null;
            // Read archive file contents
            archiveFileContents = Deploy.getArchiveFileContents(argv.archiveFile);
            // Get the connection ioptions
            connectOptions = Deploy.getConnectOptions(connectionProfileName);
            return BusinessNetworkDefinition.fromArchive(archiveFileContents);
        })
        .then ((result) => {
            businessNetworkDefinition = result;
            businessNetworkName = businessNetworkDefinition.getIdentifier();
            console.log('Business network definition:');
            console.log('\tIdentifier: '+businessNetworkName);
            console.log('\tDescription: '+businessNetworkDefinition.getDescription());
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.createProfile(connectionProfileName, connectOptions);
        })
        .then ((result) => {
            // if we are performing an update we have to actually connect to the network
            // we want to update!
            return adminConnection.connect(connectionProfileName, enrollId, enrollSecret, updateBusinessNetwork ? businessNetworkDefinition.getName() : null);
        })
        .then((result) => {
            if (updateBusinessNetwork === false) {
                console.log('Deploying business network definition. This may take a minute...');
                return adminConnection.deploy(businessNetworkDefinition);
            } else {
                console.log('Updating business network definition. This may take a few seconds...');
                return adminConnection.update(businessNetworkDefinition);
            }
        });
    }

    /**
      * Get connection options from profile
      * @param {string} connectionProfileName connection profile name
      * @return {connectOptions} connectOptions options
      */
    static getConnectOptions(connectionProfileName) {

        let connectOptions;
        let connectionProfile = PROFILE_ROOT + connectionProfileName + '/' + CONNECTION_FILE;
        if (fs.existsSync(connectionProfile)) {
            let connectionProfileContents = fs.readFileSync(connectionProfile);
            connectOptions = JSON.parse(connectionProfileContents);
        } else {
            let defaultKeyValStore = CREDENTIALS_ROOT;

            connectOptions = {type: 'hlf'
                             ,membershipServicesURL: 'grpc://localhost:7054'
                             ,peerURL: 'grpc://localhost:7051'
                             ,eventHubURL: 'grpc://localhost:7053'
                             ,keyValStore: defaultKeyValStore
                             ,deployWaitTime: '300'
                             ,invokeWaitTime: '100'};
        }
        return connectOptions;
    }

    /**
      * Get contents from archive file
      * @param {string} archiveFile connection profile name
      * @return {String} archiveFileContents archive file contents
      */
    static getArchiveFileContents(archiveFile) {
        let archiveFileContents;
        if (fs.existsSync(archiveFile)) {
            archiveFileContents = fs.readFileSync(archiveFile);
        } else {
            throw new Error('Archive file '+archiveFile+' does not exist.');
        }
        return archiveFileContents;
    }

    /**
      * Get default profile name
      * @param {argv} argv program arguments
      * @return {String} defaultConnection profile name
      */
    static getDefaultProfileName(argv) {
        return argv.connectionProfileName || DEFAULT_PROFILE_NAME;
    }

}

module.exports = Deploy;
