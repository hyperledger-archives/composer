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

const inquirer    = require('inquirer');

/**
 * Get the required connection information for the business network - namely
 * the connection profile name, business network identifier, and identity.
 * @returns {Promise} A promise that will be resolved with the required
 * connection information.
 */
function getFabricDetails() {
    let questions = [
        {
            name: 'profilename',
            type: 'input',
            message: 'Enter your Fabric Connection Profile Name:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter the name of the Fabric Connection Profile you wish to use \n \
                            (hint: this is usually the name of the directory in $HOME containing the connection.json file)';
                }
            }
        },
        {
            name: 'businessNetworkId',
            type: 'input',
            message: 'Enter your Business Network Identifier :',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your Business Network Identifier';
                }
            }
        },
        {
            name: 'userid',
            type: 'input',
            message: 'Enter your Fabric username :',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your Fabric username';
                }
            }
        },
        {
            name: 'secret',
            type: 'secret',
            message: 'Enter your secret:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your secret';
                }
            }
        }
    ];

    return inquirer.prompt(questions);
}
module.exports.getFabricDetails = getFabricDetails;
