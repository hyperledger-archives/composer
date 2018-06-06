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
const IdCard = require('composer-common').IdCard;
const Validate = require('./validate');
const path = require('path');
const chalk = require('chalk');
const prettyjson = require('prettyjson');
/**
 * Composer "card import" command
 * @private
 */
class Import {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        let cardToImport;
        let cardName;
        let adminConnection;
        return Import.readCardFromFile(args.file).then(card => {
            cardToImport = card;
            cardName = args.card || cmdUtil.getDefaultCardName(card);
            adminConnection = cmdUtil.createAdminConnection();
            return adminConnection.hasCard(cardName);
        }).then((existingCard) => {
            if (existingCard) {
                throw new Error('Card already exists: ' + cardName);
            }

            let errors = Validate.validateProfile(cardToImport.getConnectionProfile());
            if(errors) {
                cmdUtil.log(chalk.red.bold('\nFailed to import the business network card'));
                errors.forEach((err) => {
                    cmdUtil.log(prettyjson.render(err, {keysColor: 'red',stringColor: 'white'}) + '\n');
                });
                throw new Error(chalk.red.bold('Errors found in the connection profile in the card'));
            }

            return adminConnection.importCard(cardName, cardToImport);
        }).then(() => {
            cmdUtil.log(chalk.blue.bold('\nSuccessfully imported business network card'));
            cmdUtil.log(chalk.blue('\tCard file: ')+args.file);
            cmdUtil.log(chalk.blue('\tCard name: ')+cardName);
        });
    }

    /**
     * Read a business network card file.
     * @param {String} cardFileName absolute or relative (to current working directory) card file name
     * @return {Promise} Resolves with an {@link IdCard}
     */
    static readCardFromFile(cardFileName) {
        const cardFilePath = path.resolve(cardFileName);
        let cardBuffer;
        try {
            cardBuffer = fs.readFileSync(cardFilePath);
        } catch (cause) {
            const error = new Error(`Unable to read card file: ${cardFilePath}`);
            error.cause = cause;
            return Promise.reject(error);
        }

        return IdCard.fromArchive(cardBuffer);
    }
}

module.exports = Import;
