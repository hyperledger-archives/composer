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

const crypto = require('crypto');
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

    /**
     * Generate a key
     * @param {String} hmacKey The hmac key, default to 'loopback'
     * @param {String} algorithm The algorithm, default to 'sha1'
     * @param {String} encoding The string encoding, default to 'hex'
     * @returns {String} The generated key
     */
    static generateKey(hmacKey, algorithm, encoding) {
        algorithm = algorithm || 'sha1';
        encoding = encoding || 'hex';
        let hmac = crypto.createHmac(algorithm, hmacKey);
        let buf = crypto.randomBytes(32);
        hmac.update(buf);
        let key = hmac.digest(encoding);
        return key;
    }

    /**
     * Convert a user profile into a user object. This is an adapted copy of the code
     * in loopback-component-passport that is not so brain-dead that it ignores the
     * fact that a user profile ID might already be an email address.
     * @param {String} provider The provider.
     * @param {Object} profile The user profile.
     * @param {Object} options The options.
     * @return {Object} The user.
     */
    static profileToUser(provider, profile, options) {
        // Let's create a user for that
        let usernameOrId = profile.username || profile.id;
        let actualProvider = profile.provider || provider;
        let profileEmail = profile.emails && profile.emails[0] && profile.emails[0].value;
        // Check and encode the username/ID (the email local part) if required.
        if (usernameOrId.match(/[^A-Za-z0-9\.\-_]/)) {
            usernameOrId = new Buffer(usernameOrId).toString('hex');
        }
        // Check and encode the provider (the email hostname) if required.
        // Note that unlike the email local part, the email hostname cannot
        // contain underscore characters.
        if (actualProvider.match(/[^A-Za-z0-9\.\-]/)) {
            actualProvider = new Buffer(actualProvider).toString('hex');
        }
        let generatedEmail = usernameOrId + '@loopback.' + actualProvider + '.com';
        let email = provider === 'ldap' ? profileEmail : generatedEmail;
        let username = actualProvider + '.' + usernameOrId;
        let password = Util.generateKey('password');
        let userObj = {
            username: username,
            password: password,
        };
        if (email) {
            userObj.email = email;
        }
        return userObj;
    }

}

module.exports = Util;
