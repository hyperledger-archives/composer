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
const Pretty = require('prettyjson');
const Table = require('cli-table');
const chalk = require('chalk');

/**
 * Composer "card list" command
 * @private
 */
class List {
  /**
    * Command implementation.
    * @param {Object} args argument list from composer command
    * @return {Promise} promise when command complete
    */
    static handler(args) {
        if (args.name){
            return this.showCardDetails(args.name);
        } else {
            return cmdUtil.createAdminConnection().getAllCards().then(cardMap => {
                this.showtable(cardMap);
            });
        }
    }

    /** Show summary table
     * @param {Map} cardMap  Map of the cards currently held
     */
    static showtable(cardMap){
        const cardNames = Array.from(cardMap.keys());
        let alltables = {};

        if (cardNames.length > 0) {
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

            cmdUtil.log('Issue '+chalk.magenta('composer card list --name <Card Name>')+' to get details a specific card');

        } else {
            cmdUtil.log('There are no Business Network Cards available.');
        }

    }

    /** Show the details of a single card
     * @param {String} cardName Name of the card to show
     * @returns {Promise} resolved when details are showed
     */
    static showCardDetails(cardName){
        return cmdUtil.createAdminConnection().exportCard(cardName)
        .then((card)=>{

            let cp = card.getConnectionProfile();
            let cpData = { name :cp.name , type: cp.type, channel:cp.channel };

            let listOutput={
                userName:this.handleArray(card.getUserName()),
                description:this.handleArray(card.getDescription()),
                businessNetworkName:this.handleArray(card.getBusinessNetworkName()),
                roles:this.handleArray(card.getRoles()),
                connectionProfile:cpData
            };

            if(card.getEnrollmentCredentials()===null){
                listOutput.secretSet='No secret set';
            }else {
                listOutput.secretSet='Secret set';
            }

            if (Object.keys(card.getCredentials()).length>0){
                listOutput.credentialsSet='Credentials set';
            }else {
                listOutput.credentialsSet='No Credentials set';
            }
            cmdUtil.log(Pretty.render(listOutput,{
                keysColor: 'blue',
                dashColor: 'blue',
                stringColor: 'white'
            }));

        });
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
