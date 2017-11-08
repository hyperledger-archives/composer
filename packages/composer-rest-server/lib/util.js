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

const formidable = require('formidable');
const inquirer = require('inquirer');
const path = require('path');

const defaultTlsCertificate = path.resolve(__dirname, '..', 'cert.pem');
const defaultTlsKey = path.resolve(__dirname, '..', 'key.pem');

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
                name: 'card',
                type: 'input',
                message: 'Enter the name of the business network card to use:',
                validate: function (value) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter the name of the business network card to use';
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
                name: 'authentication',
                type: 'confirm',
                message: 'Specify if you want to enable authentication for the REST API using Passport:',
                default: false
            },
            {
                name: 'multiuser',
                type: 'confirm',
                message: 'Specify if you want to enable multiple user and identity management using wallets:',
                default: false,
                when: (answers) => {
                    return answers.authentication;
                }
            },
            {
                name: 'websockets',
                type: 'confirm',
                message: 'Specify if you want to enable event publication over WebSockets:',
                default: true
            },
            {
                name: 'tls',
                type: 'confirm',
                message: 'Specify if you want to enable TLS security for the REST API:',
                default: false
            },
            {
                name: 'tlscert',
                type: 'string',
                message: 'Enter the path to the file containing the TLS certificate:',
                default: defaultTlsCertificate,
                when: (answers) => {
                    return answers.tls;
                }
            },
            {
                name: 'tlskey',
                type: 'string',
                message: 'Enter the path to the file containing the TLS private key:',
                default: defaultTlsKey,
                when: (answers) => {
                    return answers.tls;
                }
            },
        ];

        return inquirer.prompt(questions);
    }

    /**
     * Create a formidable IncomingForm object.
     * @return {IncomingForm} The new formidable IncomingForm object.
     */
    static createIncomingForm() {
        return new formidable.IncomingForm();
    }

}

module.exports = Util;
