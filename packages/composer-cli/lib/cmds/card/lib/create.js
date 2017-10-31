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

const IdCard = require('composer-common').IdCard;
const Export = require('./export');
const fs = require('fs');
const path = require('path');
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

        let profileFile  = args.connectionProfileFile;
        let businessNetworkName = args.businessNetworkName;
        let fileName = args.file;

        let metadata= {
            userName : args.enrollId,
            version : 1,
            enrollmentSecret:args.enrollSecret,
            businessNetwork : businessNetworkName
        };
        const filePath = path.resolve(profileFile);
        return Promise.resolve()
            .then( ()=>{
                return this.readJsonFromFile(filePath);
            })
            .then((profileData) =>{
                // if there is no name, take the name from the directory the profilefile is in
                if (!profileData.name){
                    profileData.name =  path.parse(filePath).dir.split(path.sep).slice(-1)[0];
                }

                let idCard = new IdCard(metadata,profileData);
                return Export.writeCardToFile(fileName,idCard);
            })
            .then(() => {
                console.log('Successfully created business network card');
            });
    }

    /**
     * Read a json file (that in this case has the connection profile)
     * @param {String} filePath absolute or relative (to current working directory) file name
     * @return {Promise} Resolves with a JSON object
     */
    static readJsonFromFile(filePath) {

        let content='';
        try {
            content = fs.readFileSync(filePath,'utf8');
        } catch (cause) {
            const error = new Error(`Unable to read JSON file: ${filePath}`);
            error.cause = cause;
            return Promise.reject(error);
        }

        return JSON.parse(content);
    }

}

module.exports = Create;
