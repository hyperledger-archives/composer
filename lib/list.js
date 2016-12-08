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


const Client = require('@ibm/ibm-concerto-client');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const DEFAULT_PROFILE_NAME = 'defaultProfile';

const cmdUtil = require('./utils/cmdutils');

/**
 * <p>
 * Concerto network list command
 * </p>
 * <p><a href="diagrams/List.svg"><img src="diagrams/list.svg" style="width:100%;"/></a></p>
 * @private
 */
class List {

  /**
    * Command process for network list command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let businessNetworkConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = List.getDefaultProfileName(argv);
        let businessNetworkId = argv.businessNetworkId;
        let businessNetworkDefinition;

        return (() => {

            console.log ('List business network '+businessNetworkId);
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
            console.log('Create new business network connection');
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            businessNetworkConnection = new BusinessNetworkConnection();
            return businessNetworkConnection.connect(connectionProfileName, businessNetworkId, enrollId, enrollSecret);

        })
        .then ((result) => {
            businessNetworkDefinition = result;
            console.log('businessNetworkDefinition obtained=' + businessNetworkDefinition.getIdentifier());
            return businessNetworkConnection.getAllAssetRegistries();
        })
        .then ((result) => {
            console.log('List of asset registries=');

            for (let i=0; i<result.length;i++){
                console.log('======== AssetRegistry ===== '+i);
                // console.log(util.inspect(result[i] ,{ showHidden: true, depth: 3, colors: true }));
//                const prettyoutput = require('prettyoutput');
                console.log(result[i]);
            }

            return businessNetworkConnection.disconnect();
        });
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

module.exports = List;
