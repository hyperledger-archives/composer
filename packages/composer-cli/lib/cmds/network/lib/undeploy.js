/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const cmdUtil = require('../../utils/cmdutils');
const DEFAULT_PROFILE_NAME = 'defaultProfile';

const ora = require('ora');
// const chalk = require('chalk');


/**
 * <p>
 * Composer "network network undeploy" command
 * </p>
 * @private
 */
class Undeploy {

  /**
    * Command process for undeploy command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = Undeploy.getDefaultProfileName(argv);
        let businessNetworkName;

        let spinner;

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
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.connect(connectionProfileName, enrollId, enrollSecret,  businessNetworkName);
        })
          .then((result) => {
              spinner = ora('Undeploying business network definition. This may take some seconds...').start();
              return adminConnection.undeploy(businessNetworkName);

          }).then((result) => {
              spinner.succeed();
              return result;
          }).catch((error) => {

              if (spinner) {
                  spinner.fail();
              }

              throw error;
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
