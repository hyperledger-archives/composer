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
const IdCard = require('composer-common').IdCard;
const Export = require('./export');

/**
 * Composer "card import" command
 * @private
 */
class Create {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {

        let profileName  = args.connectionProfileName;
        let businessNetworkName = args.businessNetworkName;
        let fileName = args.file;

        let metadata= {
            userName : args.enrollId,
            version : 1,
            enrollmentSecret:args.enrollSecret,
            businessNetwork : businessNetworkName
        };

        return Promise.resolve()
            .then( ()=>{
                const adminConnection = cmdUtil.createAdminConnection();
                return adminConnection.getProfile(profileName);
            })
            .then((profileData) =>{
                if (!profileData.name){
                    profileData.name = profileName;
                }
                let idCard = new IdCard(metadata,profileData);

                return Export.writeCardToFile(fileName,idCard);
            })
            .then(() => {
                console.log('Successfully created business network card');
            });
    }

}

module.exports = Create;
