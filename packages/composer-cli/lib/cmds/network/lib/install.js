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
const Admin = require('composer-admin');
const fs = require('fs');
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

        return adminConnection.connect(cardName).then(() => {
            const businessNetworkArchive = Install.getArchiveFileContents(argv.archiveFile);
            return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
        }).then((definition) => {
            return adminConnection.install(definition, installOptions);
        }).then((result) => {
            spinner.succeed();
            cmdUtil.log();
            return result;
        }).catch((error) => {
            spinner.fail();
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
        if (fs.existsSync(archiveFile)) {
            return fs.readFileSync(archiveFile);
        } else {
            throw new Error('Archive file '+archiveFile+' does not exist.');
        }
    }
}

module.exports = Install;
