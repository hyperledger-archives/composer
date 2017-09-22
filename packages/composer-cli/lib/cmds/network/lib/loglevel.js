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

const chalk = require('chalk');
const cmdUtil = require('../../utils/cmdutils');

/**
 * <p>
 * Composer "network loglevel" command
 * </p>
 * @private
 */
class LogLevel {

  /**
    * Command process for loglevel command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName;
        let businessNetworkName;
        let newlevel;

        if (argv.newlevel) {
            // validate log level as yargs cannot at this time
            // https://github.com/yargs/yargs/issues/849
            newlevel = argv.newlevel.toUpperCase();
            if (!LogLevel.validLogLevel(newlevel)) {
                return Promise.reject(new Error('newlevel unspecified or not one of (INFO|WARNING|ERROR|DEBUG)'));
            }
        }

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
                    argv.enrollSecret = result.enrollmentSecret;
                });
            } else {
                return Promise.resolve();
            }
        })()
        .then(() => {
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            businessNetworkName = argv.businessNetworkName;
            connectionProfileName = argv.connectionProfileName;
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.connect(connectionProfileName, enrollId, enrollSecret, businessNetworkName);
        })
        .then(() => {
            if (newlevel) {
                return adminConnection.setLogLevel(newlevel);
            } else {
                return adminConnection.getLogLevel();
            }
        })
        .then((result) => {
            if (newlevel) {
                console.log(chalk.blue.bold('The logging level was successfully changed for: ')+businessNetworkName);
            } else {
                console.log(chalk.blue.bold('The current logging level is: ')+result);
            }
        }).catch((error) => {
            throw error;
        });
    }

    /**
     * check the loglevel specified matches the known set
     *
     * @static
     * @param {string} logLevel the loglevel to check
     * @returns {boolean} true if valid, false otherwise
     * @memberof LogLevel
     */
    static validLogLevel(logLevel) {

        switch (logLevel) {
        case 'INFO':
        case 'WARNING':
        case 'ERROR':
        case 'DEBUG':
            return true;
        }
        return false;
    }

}

module.exports = LogLevel;
