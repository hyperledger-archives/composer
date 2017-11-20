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
const ora = require('ora');

/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Update {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let businessNetworkDefinition;
        let adminConnection;
        let businessNetworkName;
        let spinner;
        let cardName = argv.card;

        // needs promise resolve here in case the archive errors
        return Promise.resolve()
            .then(() => {
                cmdUtil.log(chalk.blue.bold('Updating business network from archive: ')+argv.archiveFile);
                let archiveFileContents = null;

                // Read archive file contents
                archiveFileContents = cmdUtil.getArchiveFileContents(argv.archiveFile);
                return BusinessNetworkDefinition.fromArchive(archiveFileContents);
            })
            .then ((result) => {
                businessNetworkDefinition = result;
                businessNetworkName = businessNetworkDefinition.getIdentifier();
                cmdUtil.log(chalk.blue.bold('Business network definition:'));
                cmdUtil.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
                cmdUtil.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
                cmdUtil.log('');
                adminConnection = cmdUtil.createAdminConnection();

                return adminConnection.connect(cardName);
            })
            .then(() => {
                spinner = ora('Updating business network definition. This may take a few seconds...').start();
                return adminConnection.update(businessNetworkDefinition);

            })
            .then((result)=>{
                spinner.succeed();
                cmdUtil.log(chalk.bold.blue('Successfully updated business network'));
                return;
            }).catch((error) => {
                if (spinner) {
                    spinner.fail();
                }
                throw error;
            });
    }


}

module.exports = Update;
