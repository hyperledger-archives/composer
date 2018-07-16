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

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const fs = require('fs');
const prompt = require('prompt');

/**
 * Internal Utility Class
 * <p><a href="diagrams/util.svg"><img src="diagrams/util.svg" style="width:100%;"/></a></p>
 * @private
 */
class CmdUtil {


    /** Simple log method to output to the console
     * Used to put a single console.log() here, so eslinting is easier.
     * And if this needs to written to a file at some point it is also eaiser
     */
    static log(){
        Array.from(arguments).forEach((s)=>{
            // eslint-disable-next-line no-console
            console.log(s);
        });
    }

    /**
     * Parse connector specific options.
     * @static
     * @param {any} argv cli arguments
     * @returns {Object} an object representing the options from optionsFile & option properties given
     * @memberof Deploy
     */
    static parseOptions(argv) {
        // command line will override file
        // all options are merged
        let mergedOptions = {};
        let cliOptions;

        if (argv.optionsFile) {
            if (fs.existsSync(argv.optionsFile)) {
                mergedOptions = JSON.parse(fs.readFileSync(argv.optionsFile));
            } else {
                CmdUtil.log('WARNING: options file ' + argv.optionsFile + ' specified, but wasn\'t found');
            }
        }

        if (argv.option) {
            if (!Array.isArray(argv.option)) {
                cliOptions = [argv.option];
            } else {
                cliOptions = argv.option;
            }
            cliOptions.forEach((cliOpt) => {
                let pair = cliOpt.split('=');
                mergedOptions[pair[0]] = pair[1];
            });
        }
        return mergedOptions;
    }

    /**
     * Ensure the specified value is an array; if it is not an array, then wrap it into an array.
     * @param {*} thing The value to ensure is an array.
     * @return {*[]} The array.
     */
    static arrayify(thing) {

        // Null/undefined thing is empty array.
        if (thing === undefined || thing === null) {
            return [];
        }

        // Leave existing array as-is.
        if (Array.isArray(thing)) {
            return thing;
        }

        // Wrap everything else in an array.
        return [ thing ];

    }

    /**
     * Parse the business network administrators which have been specified using certificate files.
     * @param {string[]} networkAdmins Identity names for the business network administrators.
     * @param {string[]} certificateFiles Certificate files for the business network administrators.
     * @param {string[]} privateKeyFiles Private key files for the business network administrators.
     * @return {Object[]} The business network administrators.
     */
    static parseNetworkAdminsWithCertificateFiles(networkAdmins, certificateFiles, privateKeyFiles) {

        // Go through each network admin.
        return networkAdmins.map((networkAdmin, index) => {

            // Load the specified certificate for the network admin.
            const certificate = fs.readFileSync(certificateFiles[index], { encoding: 'utf8' });
            const networkAdminInfo = {
                userName: networkAdmin,
                certificate: certificate
            };

            const privateKeyFile = privateKeyFiles[index];
            if (privateKeyFile) {
                networkAdminInfo.privateKey = fs.readFileSync(privateKeyFile, { encoding: 'utf8' });
            }

            return networkAdminInfo;
        });

    }

    /**
     * Parse the business network administrators which have been specified using enrollment secrets.
     * @param {string[]} networkAdmins Identity names for the business network administrators.
     * @param {string[]} networkAdminEnrollSecrets Enrollment secrets the business network administrators.
     * @return {Object[]} The business network administrators.
     */
    static parseNetworkAdminsWithEnrollSecrets(networkAdmins, networkAdminEnrollSecrets) {

        // Go through each network admin.
        return networkAdmins.map((networkAdmin, index) => {

            // Grab the secret for the network admin.
            const enrollmentSecret = networkAdminEnrollSecrets[index];
            return {
                userName: networkAdmin,
                enrollmentSecret
            };

        });

    }

    /**
     * Parse the business network administrators.
     * @param {Object} argv The command line arguments as parsed by yargs.
     * @return {Object[]} The business network administrators.
     */
    static parseNetworkAdmins(argv) {

        // Convert the arguments into arrays.
        const networkAdmins = CmdUtil.arrayify(argv.networkAdmin);
        const networkAdminCertificateFiles = CmdUtil.arrayify(argv.networkAdminCertificateFile);
        const networkAdminPrivateKeyFiles = CmdUtil.arrayify(argv.networkAdminPrivateKeyFile);
        const networkAdminEnrollSecrets = CmdUtil.arrayify(argv.networkAdminEnrollSecret);
        const files = CmdUtil.arrayify(argv.file);

        // It's valid not to specify any network administrators.
        if (networkAdmins.length === 0) {
            return [];
        }

        // Check that both certificate files and enrollment secrets have not been specified.
        if (networkAdminCertificateFiles.length && networkAdminEnrollSecrets.length) {
            throw new Error('You cannot specify both certificate files and enrollment secrets for network administrators');
        }

        // Check that enough certificate files have been specified.
        let result;
        if (networkAdmins.length === networkAdminCertificateFiles.length) {
            result = CmdUtil.parseNetworkAdminsWithCertificateFiles(networkAdmins, networkAdminCertificateFiles, networkAdminPrivateKeyFiles);
        }

        // Check that enough enrollment secrets have been specified.
        else if (networkAdmins.length === networkAdminEnrollSecrets.length) {
            result = CmdUtil.parseNetworkAdminsWithEnrollSecrets(networkAdmins, networkAdminEnrollSecrets);
        }

        // Not enough certificate files or enrollment secrets!
        else {
            CmdUtil.log(JSON.stringify(argv, null, 4));
            throw new Error('You must specify certificate files or enrollment secrets for all network administrators');
        }

        // If any files specified, check we have enough, and merge them into the result.
        if (files.length && files.length !== result.length) {
            throw new Error('If you specify a network administrators card file name, you must specify one for all network administrators');
        } else if (files.length) {
            files.forEach((file, index) => {
                result[index].file = file;
            });
        }
        return result;

    }

    /**
     * Promise based wrapper for a call to the prompt module.
     * @param {Object} options The options for the prompt module.
     * @return {Promise} A promise that will be resolved with the value returned
     * from the call to the prompt module.
     */
    static prompt(options) {
        return new Promise((resolve, reject) => {
            prompt.get([options], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Creates an admin connection. Included in deploy class to facilitate unit testing
     * @returns {AdminConnection} adminConnection
     */
    static createAdminConnection() {
        let adminConnection = new AdminConnection();
        return adminConnection;
    }

    /**
     * Creates an Business Network connection.
     * @returns {BusinessNetworkConnection} businessNetworkConnection
     */
    static createBusinessNetworkConnection() {
        let businessNetworkConnection = new BusinessNetworkConnection();
        return businessNetworkConnection;
    }

    /**
     * Get a default name for a given business network card.
     * @param {IdCard} card A business network card
     * @returns {String} A card name
     */
    static getDefaultCardName(card) {
        return BusinessNetworkCardStore.getDefaultCardName(card);
    }

    /**
      * Get contents from archive file
      * @param {string} archiveFile connection profile name
      * @return {String} archiveFileContents archive file contents
      */
    static getArchiveFileContents(archiveFile) {
        let archiveFileContents;
        if (fs.existsSync(archiveFile)) {
            archiveFileContents = fs.readFileSync(archiveFile);
        } else {
            throw new Error('Archive file '+archiveFile+' does not exist.');
        }
        return archiveFileContents;
    }

    /**
     * Generate a suitable card file name based on a proposed file name.
     * This implementation simply appends '.card' if it is missing.
     * @param {String} fileName Proposed card file name
     * @return {String} A card file name
     */
    static sanitizeCardFileName(fileName) {
        if (!/\.card$/i.test(fileName)) {
            fileName = fileName + '.card';
        }
        return fileName;
    }
}

module.exports = CmdUtil;
