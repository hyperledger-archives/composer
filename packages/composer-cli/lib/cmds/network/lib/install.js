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
const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;

const ora = require('ora');

/**
 * Network install command
 * @private
 */
class Install {
   /**
    * Command process for install command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        const cardName = argv.card;
        const installOptions = cmdUtil.parseOptions(argv);
        const adminConnection = cmdUtil.createAdminConnection();

        const spinner = ora('Installing business network. This may take a minute...').start();
        let definition;

        return adminConnection.connect(cardName).then(() => {
            const businessNetworkArchive = cmdUtil.getArchiveFileContents(argv.archiveFile);
            return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        }).then((definition_) => {
            definition = definition_;
            return adminConnection.install(definition, installOptions);
        }).then((result) => {
            spinner.succeed();
            cmdUtil.log(chalk.bold.blue(`Successfully installed business network ${definition.getName()}, version ${definition.getVersion()}`));
            cmdUtil.log();
            return result;
        }).catch((error) => {
            spinner.fail();
            cmdUtil.log();
            throw error;
        });
    }

}

module.exports = Install;
