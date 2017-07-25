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
 * Utility methods for the LoopBack server.
 */
class Util {

    /**
     * Get the required connection information for the business network - namely
     * the connection profile name, business network identifier, and identity.
     * @returns {Promise} A promise that will be resolved with the required
     * connection information.
     */
    static getConnectionSettings() {
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
            },
            {
                name: 'namespaces',
                type: 'list',
                message: 'Specify if you want namespaces in the generated REST API:',
                choices: [
                    {name: 'always use namespaces', value: 'always'},
                    {name: 'use namespaces if conflicting types exist', value: 'required'},
                    {name: 'never use namespaces', value: 'never'}
                ],
                default: 'always'
            },
            {
                name: 'security',
                type: 'confirm',
                message: 'Specify if you want the generated REST API to be secured:',
                default: false
            },
            {
                name: 'websockets',
                type: 'confirm',
                message: 'Specify if you want to enable event publication over WebSockets:',
                default: true
            }
        ];

        return inquirer.prompt(questions);
    }

}

module.exports = Util;
