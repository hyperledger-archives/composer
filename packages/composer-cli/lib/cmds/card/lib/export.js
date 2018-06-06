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
const path = require('path');
const chalk = require('chalk');
/**
 * Composer "card export" command
 * @private
 */
class Export {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {

        const cardName = args.card;
        const fileName = cmdUtil.sanitizeCardFileName(args.file || cardName);

        const adminConnection = cmdUtil.createAdminConnection();
        return adminConnection.exportCard(cardName)
        .then((card) =>{
            return Export.writeCardToFile(fileName,card);
        })
        .then(() => {
            cmdUtil.log(chalk.blue.bold('\nSuccessfully exported business network card'));
            cmdUtil.log(chalk.blue('\tCard file: ')+fileName);
            cmdUtil.log(chalk.blue('\tCard name: ')+cardName);
        });

    }

    /**
     * Read a business network card file.
     * @param {String} cardFileName absolute or relative (to current working directory) card file name
     * @param {IdCard} card Businss Network Card to write to disk
     * @return {Promise} Resolvesd when written to disk
     */
    static writeCardToFile(cardFileName,card) {
        let cardFilePath;
        return card.toArchive({ type: 'nodebuffer' })
           .then( (cardBuffer)=>{
               // got the id card to write to a buffer
               cardFilePath = path.resolve(cardFileName);
               try {
                   fs.writeFileSync(cardFilePath,cardBuffer);
               } catch (cause) {
                   const error = new Error(`Unable to write card file: ${cardFilePath}`);
                   error.cause = cause;
                   return Promise.reject(error);
               }
           });
    }
}

module.exports = Export;
