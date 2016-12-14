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

const cmdUtil = require('../../utils/cmdutils');
const DEFAULT_PROFILE_NAME = 'defaultProfile';

/**
 * <p>
 * Concerto deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Submit {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let businessNetworkConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = Submit.getDefaultProfileName(argv);
        let businessNetworkName;

        return (() => {
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
        .then(() => {
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            businessNetworkName = argv.businessNetworkName;
            businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
            return businessNetworkConnection.connect(connectionProfileName, businessNetworkName, enrollId, enrollSecret);
        })
        .then(() => {
            let data = argv.data;

            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    throw new Error('JSON error. Are have you quoted the JSON string?', e);
                }
            } else {
                throw new Error('Data must be a string');
            }

            if (!data.$class) {
                throw new Error('$class attribute not supplied');
            }

            let businessNetwork = businessNetworkConnection.getBusinessNetwork();
            let serializer = businessNetwork.getSerializer();
            let resource = serializer.fromJSON(data);

            return businessNetworkConnection.submitTransaction(resource);
        })
        .then((submitted) => {
            console.log('Transaction Submitted.');
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

module.exports = Submit;
