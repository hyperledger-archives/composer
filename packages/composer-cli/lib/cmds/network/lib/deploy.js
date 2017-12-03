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

const Admin = require('composer-admin');

const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const chalk = require('chalk');
const cmdUtil = require('../../utils/cmdutils');
const fs = require('fs');
const ora = require('ora');
const Start = require('./start.js');

/**
 * Composer deploy command
 * @private
 */
class Deploy {

   /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let adminConnection;
        let businessNetworkDefinition;
        let businessNetworkName;
        let spinner;
        let cardName = argv.card;

        cmdUtil.log(chalk.blue.bold('Deploying business network from archive: ')+argv.archiveFile);
        let archiveFileContents = null;
        adminConnection = cmdUtil.createAdminConnection();

        return Promise.resolve()
        .then(()=>{

            // getArchiveFileContents, is a sync function, so use Promise.resolve() to ensure it gives a rejected promise
            archiveFileContents = Deploy.getArchiveFileContents(argv.archiveFile);
            return BusinessNetworkDefinition.fromArchive(archiveFileContents);
        })
        .then ((result) => {
            businessNetworkDefinition = result;
            businessNetworkName = businessNetworkDefinition.getName();
            cmdUtil.log(chalk.blue.bold('Business network definition:'));
            cmdUtil.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
            cmdUtil.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
            cmdUtil.log('');

            // install runtime
            spinner = ora('Installing runtime for business network ' + argv.businessNetworkName + '. This may take a minute...').start();
            return adminConnection.connect(cardName);

        })
        .then((result) => {
            let installOptions = cmdUtil.parseOptions(argv);
            return adminConnection.install(businessNetworkName, installOptions);
        }).then((result) => {
            spinner.succeed();
            cmdUtil.log('');
            return Start.handler(argv);
        }).then((result)=>{
            return result;
        })
        .catch((error) => {
            if (spinner) {
                spinner.fail();
            }
            cmdUtil.log();

            throw error;
        });
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

}

module.exports = Deploy;
