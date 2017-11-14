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
const cmdUtil = require('../../utils/cmdutils');
const chalk = require('chalk');
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
            if(Array.isArray(argv.role)) {
                metadata.roles = argv.role;
            } else {
                metadata.roles = [argv.role];
            }
        }

        if (argv.enrollSecret){
            metadata.enrollmentSecret = argv.enrollSecret;
        }

        if (argv.businessNetworkName){
            metadata.businessNetwork = argv.businessNetworkName;
        }

        // handle the connection profile - read from a file
        // start the promise chain to all sync errors are converted to rejected promises
        return Promise.resolve()
            .then( ()=>{
                const filePath = path.resolve(argv.connectionProfileFile);
                let profileData = JSON.parse(this.readFile(filePath));

                return this.createCard(metadata,profileData,argv);
            })
            .then((fileName) => {
                cmdUtil.log(chalk.blue.bold('\nSuccessfully created business network card file to '));
                cmdUtil.log(chalk.blue('\tOutput file: ')+fileName);
                return;
            });
    }


    /** Creates a ID card and writes it to file
     * factored out fn to permit it's use by other clis
     *
     * @param {Object} metadata the metadata object to be passed to the IDCard constructor
     * @param {Object} profileData connection profile data for the new card
     * @param {Object} argv arguments from the user
     * @returns {Promise} resolved with the filename of the card when it has been written
     */
    static createCard(metadata,profileData,argv){
        let fileName;
        // setup the id card with the meta data
        let idCard = new IdCard(metadata,profileData);

        // certificates & privateKey
        // YARGS command spec logic will have enforced the correct set of options
        if (argv.certificate || argv.privateKey) {
            const newCredentials = { };
            if (argv.certificate){
                newCredentials.certificate = this.readFile(path.resolve(argv.certificate));
            }
            if (argv.privateKey){
                newCredentials.privateKey =  this.readFile(path.resolve(argv.privateKey));
            }
            idCard.setCredentials(newCredentials);
        }

        // handle the filename
        // Default is userName@businessNetworkName.card if the card includes a business network name;
        // otherwise userName@connectionProfileName.card.
        if (!argv.file) {
            if (metadata.hasOwnProperty('businessNetwork')){
                fileName = metadata.userName+'@'+ metadata.businessNetwork+'.card';
            } else {
                fileName = metadata.userName+'@'+ profileData.name +'.card';
            }
        } else {
            fileName = argv.file;
        }

        // finally write out the card file
        return Export.writeCardToFile(fileName,idCard)
        .then(()=>{
            return fileName;
        });
    }

    /**
     * Read a file from disc and return the result or throw an error.
     * @param {String} filePath file to load
     * @return {String} with contents or throws an error

     */
    static readFile(filePath){
        let content;
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
