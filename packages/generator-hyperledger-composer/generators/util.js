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

const common = require('composer-common');
const BusinessNetworkMetadata = common.BusinessNetworkMetadata;

/**
 * Util class to manage validation and regularly used code
 */
class Util {

    /**
     * Validate the name of the business network
     *
     * @param {string} name name of the business network
     * @return {*} true or error message
     */
    static validateBusinessNetworkName(name) {
        if (Util._validateBusinessNetworkName(name)) {
            return true;
        } else {
            return 'Name cannot be null, empty or contain a space or uppercase character.';
        }
    }

    /**
     * Validate the name of the business network with composer-common
     *
     * @param {string} name name of the business network
     * @return {boolean} true if valid
     */
    static _validateBusinessNetworkName(name) {
        let packageJson = { 'name': name };
        let readme = '';

        try {
            new BusinessNetworkMetadata(packageJson, readme);
            return true;
        } catch(err) {
            return false;
        }
    }

    /**
     * Check if the description is valid
     *
     * @param {string} description the description
     * @return {*} return true or error message
     */
    static validateDescription(description) {
        if(description !== null && description !== undefined && description !== '') {
            return true;
        } else {
            return 'Description cannot be null or empty.';
        }
    }

    /**
     * Check if the cardname is valid
     *
     * @param {string} name the card name to validate
     * @return {*} return true or error message
     */
    static validateCardName(name) {
        if(name !== null && name !== undefined && name !== '') {
            return true;
        } else {
            return 'CardName cannot be null or empty.';
        }
    }

    /**
     * Check if the namespace is valid
     *
     * @param {string} namespace the name space of the first files
     *
     * @return {*} return true or error message
     */
    static validateNamespace(namespace) {
        if(namespace !== null && namespace !== undefined && namespace.match(/^(?:[a-z]\d*(?:\.[a-z])?)+$/)) {
            return true;
        } else {
            return 'Namespace must match: ^(?:[a-z]\d*(?:\.[a-z])?)+$';
        }
    }

    /**
     * Validates the license given
     *
     * @param {string} license the license string
     * @return {*} return true or error message
     */
    static validateLicense(license) {
        if(license !== null && license !== undefined && license !== '') {
            return true;
        } else {
            return 'Licence cannot be null or empty.';
        }
    }

    /**
     * Validates the author name
     *
     * @param {string} name name to be checked
     * @return {*} return true or error message
     */
    static validateAuthorName(name) {
        if(name !== null && name !== undefined && name !== '') {
            return true;
        } else {
            return 'Author name cannot be null or empty.';
        }
    }

    /**
     * Validates the author email
     *
     * @param {string} email email to be checked
     * @return {*} return true or error message
     */
    static validateAuthorEmail(email) {
        if(email !== null && email !== undefined && email !== '') {
            return true;
        } else {
            return 'Author email cannot be null or empty.';
        }
    }

    /**
     * Validates the app name
     *
     * @param {string} name mame to be checked
     * @return {*} return true or error message
     */
    static validateAppName(name) {
        if(name !== null && name !== undefined && name.match(/^[\w-]+$/)) {
            return true;
        } else {
            return 'App name cannon be null or empty';
        }
    }

    /**
     * Validate the connection profile name
     *
     * @param {string} name connection profile name
     * @return {*} return true or error message
     */
    static validateConnectionProfileName(name) {
        if(name !== null && name !== undefined && name !== '') {
            return true;
        }
        else {
            return 'Connection Profile cannot be null or empty.';
        }
    }

    /**
     * Validate the enrollment id
     *
     * @param {string} id enrollment id
     * @return {*} return true or error message
     */
    static validateEnrollmentId(id) {
        if(id !== null && id !== undefined && id !== '') {
            return true;
        }
        else {
            return 'Enrollment id name cannot be null or empty.';
        }
    }

    /**
     * Validate the enrollment secret
     *
     * @param {string} secret enrollment secret
     * @return {*} return true or error message
     */
    static validateEnrollmentSecret(secret) {
        if(secret !== null && secret !== undefined && secret !== '') {
            return true;
        }
        else {
            return 'Enrollment secret cannot be null or empty.';
        }
    }

    /**
     * Validate the name of the bna file
     *
     * @param {string} name name of the bna file
     * @return {*} return true or error message
     */
    static validateBnaName(name) {
        let bnaIndex = name.indexOf('.bna');
        if (bnaIndex === name.length - 4) {
            return true;
        } else {
            return 'bna file name not valid. Must end in .bna';
        }
    }

    /**
     * Validate the generator type
     *
     * @param {string} type type of the generator
     * @return {*} return true or error message
     */
    static validateGeneratorType(type) {
        if(type !== null && type !== undefined) {
            return true;
        } else {
            return 'Generator type must be defined';
        }
    }

    /**
     * Validate the api
     *
     * @param {string} input api choice
     * @return {*} return true or error message
     */
    static validateApi(input) {
        if (input !== null && input !== undefined && input !== '') {
            return true;
        } else {
            return 'Connection Profile cannot be null or empty.';
        }
    }

    /**
     * Simple log method to output to the console
     * @param {string} msg the message to log
     */
    static log(msg){
        // eslint-disable-next-line no-console
        console.log(msg);
    }
}

module.exports = Util;