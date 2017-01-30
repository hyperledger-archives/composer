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
const fs = require('fs');

/**
 * <p>
 * Composer List Archive command
 * </p>
 *
 * @private
 */
class ListBNA {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        console.log('Listing Business Network Archive from '+argv.archiveFile);
        let readFile = fs.readFileSync(argv.archiveFile);
        return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
            console.log('Identifier:'+businessNetwork.getIdentifier());
            console.log('Name:'+businessNetwork.getName());
            console.log('Version:'+businessNetwork.getVersion());

            // console.log(businessNetwork.modelManager.modelFiles);
            return;

        });
    }

}

module.exports = ListBNA;
