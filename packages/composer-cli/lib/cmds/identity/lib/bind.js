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
const fs = require('fs');

/**
 * <p>
 * Composer "identity bind" command
 * </p>
 * <p><a href="diagrams/Deploy.svg"><img src="diagrams/deploy.svg" style="width:100%;"/></a></p>
 * @private
 */
class Bind {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let businessNetworkConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = argv.connectionProfileName;
        let businessNetworkName;
        let participantId = argv.participantId;
        let certificateFile = argv.certificateFile;
        let certificate;

        try {
            certificate = fs.readFileSync(certificateFile).toString();
        } catch(error) {
            return Promise.reject(new Error('Unable to read certificate file ' + certificateFile + '. ' + error.message));
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
            businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
            return businessNetworkConnection.connectWithDetails(connectionProfileName, businessNetworkName, enrollId, enrollSecret);
        })
        .then(() => {
            return businessNetworkConnection.bindIdentity(participantId, certificate);
        })
        .then((result) => {
            console.log(`An identity was bound to the participant '${participantId}'`);
            console.log('The participant can now connect to the business network using the identity');
        });
    }

}

module.exports = Bind;
