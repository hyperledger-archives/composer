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
const fs = require('fs');
const ora = require('ora');
const sanitize = require('sanitize-filename');

/**
 * <p>
 * Composer deploy command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Download {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @param {boolean} updateOption true if the network is to be updated
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let businessNetworkDefinition;
        let businessNetworkName;
        let spinner;
        let cardName = argv.card;

        let businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();

<<<<<<< HEAD

        spinner = ora('Downloading deployed Business Network Archive').start();

        return businessNetworkConnection.connect(cardName)
=======
        return Promise.resolve()
        .then (() => {
            spinner = ora('Downloading deployed Business Network Archive').start();

            return businessNetworkConnection.connect(cardName);

        })
>>>>>>> code for the network cli updates
        .then((result) => {
            businessNetworkDefinition = result;
            return businessNetworkConnection.disconnect();
        })
        .then (() => {
            spinner.succeed();
            businessNetworkName = businessNetworkDefinition.getIdentifier();
            console.log(chalk.blue.bold('Business network definition:'));
            console.log(chalk.blue('\tIdentifier: ')+businessNetworkName);
            console.log(chalk.blue('\tDescription: ')+businessNetworkDefinition.getDescription());
            console.log();

            if (!argv.archiveFile){
                argv.archiveFile = sanitize(businessNetworkName,{replacement:'_'})+'.bna';
            }

            // need to write this out to the required file now.
            return businessNetworkDefinition.toArchive();
        }).then ( (result) => {
            //write the buffer to a file
            fs.writeFileSync(argv.archiveFile,result);
            console.log(chalk.blue.bold('\nWritten Business Network Definition Archive file to: ')+argv.archiveFile);

        }).catch( (error) => {
            console.log(error);

            if (spinner) {
                spinner.fail();
            }

            throw error;
        })
        ;
    }

}

module.exports = Download;
