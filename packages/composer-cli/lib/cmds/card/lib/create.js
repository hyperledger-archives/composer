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

        // set if the options have been given into the metadata
        let metadata= { version:1,
            userName : argv.user };

        if (argv.role){
            metadata.roles = argv.role;
        }

        if (argv.enrollSecret){
            metadata.enrollmentSecret = argv.enrollSecret;
        }

        if (argv.businessNetworkName){
            metadata.businessNetwork = argv.businessNetworkName;
        }

        // used in confirmation message so define here
        let fileName = argv.file;

        // handle the connection profile - read from a file
        // start the promise chain to all sync errors are converted to rejected promises
        return Promise.resolve()
            .then( ()=>{
                const filePath = path.resolve(argv.connectionProfileFile);
                let profileData = JSON.parse(this.readFile(filePath));

                // setup the id card with the meta data and profileData
                let idCard = new IdCard(metadata,profileData);

                // certificates & privateKey
                // YARGS command spec logic will have enforced the correct set of options
                if (argv.certificate && argv.privateKey){
                    let certFile = this.readFile(path.resolve(argv.certificate));
                    let keyFile =  this.readFile(path.resolve(argv.privateKey));
                    idCard.setCredentials({ certificate: certFile, privateKey: keyFile });
                }
                // handle the filename
                // Default is userName@businessNetworkName.card if the card includes a business network name;
                // otherwise userName@connectionProfileName.card.
                if (!fileName) {
                    if (metadata.hasOwnProperty('businessNetwork')){
                        fileName = metadata.userName+'@'+ metadata.businessNetwork+'.card';
                    } else {
                        fileName = metadata.userName+'@'+ profileData.name +'.card';
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
    static readFile(filePath){
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

}

module.exports = Create;
