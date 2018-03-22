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

const Certificate = require('composer-common').Certificate;
const chalk = require('chalk');
const cmdUtil = require('../../utils/cmdutils');
const Pretty = require('prettyjson');
const Table = require('cli-table');

/**
 * Composer "card list" command
 * @private
 */
class List {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    */
    static async handler(args) {
        if (args.card){
            await this.showCardDetails(args.card);
        } else {
            const cardMap = await cmdUtil.createAdminConnection().getAllCards();
            if (args.quiet) {
                this.showNames(cardMap);
            } else {
                this.showtable(cardMap);
            }
        }
    }

    /** Show the name of each card
      * @param {Map} cardMap Map of the cards currently held
      */
    static showNames(cardMap){
        const cardNames = Array.from(cardMap.keys());
        cardNames.forEach(function(card){
            cmdUtil.log(card);
        });
    }

    /** Show summary table
     * @param {Map} cardMap  Map of the cards currently held
     */
    static showtable(cardMap){
        const cardNames = Array.from(cardMap.keys());
        let alltables = {};

        if (cardNames.length === 0) {
            cmdUtil.log('There are no Business Network Cards available.');
            return;
        }

        cmdUtil.log(chalk.bold.blue('The following Business Network Cards are available:\n'));

        cardNames.forEach((e)=>{
            let tableLine = [];
            let idCard = cardMap.get(e);
            let bnn = idCard.getConnectionProfile().name;
            let currenttable = alltables[bnn];
            if (!currenttable){
                currenttable = new Table({
                    head: ['Card Name', 'UserId', 'Business Network']
                });
                alltables[bnn]=currenttable;
            }

            tableLine.push(e);
            tableLine.push(idCard.getUserName());
            tableLine.push(idCard.getBusinessNetworkName());
            currenttable.push(tableLine);

        });

        Object.keys(alltables).sort().forEach((n)=>{
            cmdUtil.log(chalk.blue('Connection Profile: ')+n);
            cmdUtil.log(alltables[n].toString());
            cmdUtil.log('\n');
        });

        cmdUtil.log('Issue '+chalk.magenta('composer card list --card <Card Name>')+' to get details a specific card');
    }

    /**
     * Get the identity ID for the specified business network card.
     * @param {IdCard} idCard The business network card.
     * @return {string} The identity ID, or null if one is not available.
     */
    static _getIdentityIdForCard(idCard) {
        const credentials = idCard.getCredentials();
        const pem = credentials.certificate;
        if (!pem) {
            return '';
        }
        const certificate = new Certificate(pem);
        return certificate.getIdentifier();
    }

    /**
     * Show the details of a single card
     * @param {String} cardName Name of the card to show
     */
    static async showCardDetails(cardName){
        const card = await cmdUtil.createAdminConnection().exportCard(cardName);

        let cp = card.getConnectionProfile();
        let cpData = { name :cp.name , 'x-type': cp['x-type'], channel:cp.channel };

        let listOutput={
            userName:this.handleArray(card.getUserName()),
            description:this.handleArray(card.getDescription()),
            businessNetworkName:this.handleArray(card.getBusinessNetworkName()),
            identityId:this.handleArray(List._getIdentityIdForCard(card)),
            roles:this.handleArray(card.getRoles()),
            connectionProfile:cpData
        };

        let credCount = Object.keys(card.getCredentials()).length;
        switch(credCount) {
        case 1:
            listOutput.credentials = 'Credentials set, HSM managed';
            break;
        case 2:
            listOutput.credentials = 'Credentials set';
            break;
        default:
            if (card.getEnrollmentCredentials() === null){
                listOutput.credentials = 'No secret or credentials set';
            } else {
                listOutput.credentials = 'One time use only secret set';
            }
        }

        cmdUtil.log(Pretty.render(listOutput,{
            keysColor: 'blue',
            dashColor: 'blue',
            stringColor: 'white'
        }));
    }

    /** handleNull - to process any undefined or null values
     * @param {Object} o thing to otuput
     * @return {String} either 'none' of the object is undefined or the object itself
     */
    static handleArray(o){

        if (Array.isArray(o) && o.length===0) {
            return 'none';
        } else {
            return o;
        }
    }
}

module.exports = List;
