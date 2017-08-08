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
const path = require('path');
const os = require('os');
const mkdirp = require('mkdirp');

const cmdUtil = require('../../utils/cmdutils');

/**
 * <p>
 * Composer "identity enroll" command
 * </p>
 * @private
 */
class Enroll {

  /**
    * Command process for enroll command
    * @param {string} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        let adminConnection = cmdUtil.createAdminConnection();
        let actualLocation = argv.path ? path.resolve(argv.path) : path.join(os.homedir(), '/.enrolledCredentials');
        let enrollment;
        return adminConnection.enrollIdentity(argv.connectionProfileName, argv.enrollId, argv.enrollSecret)
            .then((result) => {
                enrollment = result;
                try {
                    mkdirp.sync(actualLocation);
                    fs.writeFileSync(path.join(actualLocation, argv.enrollId + '-pub.pem'), enrollment.certificate);
                    fs.writeFileSync(path.join(actualLocation, argv.enrollId + '-priv.pem'), enrollment.key);
                    fs.writeFileSync(path.join(actualLocation, enrollment.caName + '-root.pem'), enrollment.rootCertificate);
                    console.log(`'${argv.enrollId}' was successfully enrolled and certificates stored in '${actualLocation}'`);
                }
                catch(err) {
                    throw err;
                }
            });
    }
}

module.exports = Enroll;
