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
const Admin = require('@ibm/concerto-admin');
/**
 * <p>
 * Concerto "network network undeploy" command
 * </p>
 * @private
 */
class Undeploy {

  /**
    * Command process for undeploy command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = Undeploy.getDefaultProfileName(argv);
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
            adminConnection = new Admin.AdminConnection();
            return adminConnection.connect(connectionProfileName, enrollId, enrollSecret,  businessNetworkName);
        })
          .then((result) => {

              console.log('Undeploying business network definition. This may take some seconds...');
              return adminConnection.undeploy(businessNetworkName);

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

module.exports = Undeploy;
