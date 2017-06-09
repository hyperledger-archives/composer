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

const fs = require('fs');

const cmdUtil = require('../../utils/cmdutils');

/**
 * <p>
 * Composer "identity issue" command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Import {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let userId;
        let publicKeyFile;
        let privateKeyFile;
        let connectionProfileName;

        userId = argv.userId;
        publicKeyFile = argv.publicKeyFile;
        privateKeyFile = argv.privateKeyFile;
        connectionProfileName = argv.connectionProfileName;
        let adminConnection = cmdUtil.createAdminConnection();
        let signerCert;
        let key;
        try {
            signerCert = fs.readFileSync(publicKeyFile).toString();
        } catch(error) {
            return Promise.reject(new Error('Unable to read public key file ' + publicKeyFile + '. ' + error.message));
        }
        try {
            key = fs.readFileSync(privateKeyFile).toString();
        } catch(error) {
            return Promise.reject(new Error('Unable to read private key file ' + privateKeyFile + '. ' + error.message));
        }
        return adminConnection.importIdentity(connectionProfileName, userId, signerCert, key)
            .then((result) => {
                console.log(`An identity was imported with name '${userId}' successfully`);
            });
    }
}

module.exports = Import;
