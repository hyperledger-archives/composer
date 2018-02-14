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
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

/**
 * <p>
 * Composer "identity request" command
 * </p>
 * @private
 */
class Request {

  /**
    * Command process for request command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection = cmdUtil.createAdminConnection();
        let actualLocation = argv.path ? path.resolve(argv.path) : path.join(os.homedir(), '/.identityCredentials');

        return adminConnection.requestIdentity(argv.card, argv.user, argv.enrollSecret)
            .then((result) => {
                mkdirp.sync(actualLocation);
                fs.writeFileSync(path.join(actualLocation, result.enrollId + '-pub.pem'), result.certificate);
                if (result.key) {
                    fs.writeFileSync(path.join(actualLocation, result.enrollId + '-priv.pem'), result.key);
                }
                fs.writeFileSync(path.join(actualLocation, result.caName + '-root.pem'), result.rootCertificate);
                cmdUtil.log(`'${result.enrollId}' was successfully requested and the certificates stored in '${actualLocation}'`);
            });
    }
}

module.exports = Request;
