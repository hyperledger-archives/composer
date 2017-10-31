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
    * @param {Object} argv argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let profileFile  = argv.connectionProfileFile;
        let user = argv.user;

        let businessNetworkName = argv.businessNetworkName || '';
        let fileName = argv.file || '';
        let enrollSecret = argv.enrollSecret || '';
        let certificate = argv.certificate || '';
        let privateKey = argv.privateKey || '';
        let roles = argv.roles || '';

        // user & profileFile are required, others are optional


        let metadata= {
            userName : user,
            version : 1,
            enrollmentSecret: enrollSecret,
            businessNetwork : businessNetworkName,
            roles : roles
        };

        //
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

                // setup the id card with the meta data
                let idCard = new IdCard(metadata,profileData);

                // certificates & privateKey
                if (certificate && privateKey){
                    let certFile = this.readCredentialFile(path.resolve(certificate));
                    let keyFile =  this.readCredentialFile(path.resolve(privateKey));
                    idCard.setCredentials({ certificate: certFile, privateKey: keyFile });
                }

                // handle the filename
                // Default is userName@businessNetworkName.card if the card includes a business network name; otherwise userName@connectionProfileName.card.
                if (fileName==='') {
                    if (businessNetworkName!==''){
                        fileName = user+'@'+businessNetworkName+'.card';
                    } else {
                        fileName = user+'@'+profileData.name+'.card';
                    }
                }

                // finally write out the card file
                return Export.writeCardToFile(fileName,idCard);
            })
            .then(() => {
                console.log('Successfully created business network card to '+fileName);
            });
    }

    /**
     * Read a file from disc and return the result or throw an error.
     * @param {String} filePath file to load
     * @return {String} with contents or throws an error
     */
    static readCredentialFile(filePath){
        console.log(filePath);
        let content='';
        try {
            content = fs.readFileSync(filePath,'utf8');
        } catch (cause) {
            const error = new Error(`Unable to read file: ${filePath}`);
            error.cause = cause;
            throw error;
        }

        return content;
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

        return Promise.resolve(JSON.parse(content));
    }

}

module.exports = Create;
