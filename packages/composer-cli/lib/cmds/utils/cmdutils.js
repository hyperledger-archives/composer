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
const Logger = require('composer-common').Logger;
const prompt = require('prompt');

const LOG = Logger.getLog('CmdUtil');

/**
 * Internal Utility Class
 * <p><a href="diagrams/util.svg"><img src="diagrams/util.svg" style="width:100%;"/></a></p>
 * @private
 */
class CmdUtil {

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
                console.log('WARNING: options file ' + argv.optionsFile + ' specified, but wasn\'t found');
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
     * @param {string[]} networkAdminCertificateFiles Certificate files for the business network administrators.
     * @return {Object[]} The business network administrators.
     */
    static parseNetworkAdminsWithCertificateFiles(networkAdmins, networkAdminCertificateFiles) {

        // Go through each network admin.
        return networkAdmins.map((networkAdmin, index) => {

            // Load the specified certificate for the network admin.
            const certificateFile = networkAdminCertificateFiles[index];
            const certificate = fs.readFileSync(certificateFile, { encoding: 'utf8' });
            return {
                name: networkAdmin,
                certificate
            };

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
            const secret = networkAdminEnrollSecrets[index];
            return {
                name: networkAdmin,
                secret
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
        const networkAdminEnrollSecrets = CmdUtil.arrayify(argv.networkAdminEnrollSecret);

        // It's valid not to specify any network administrators.
        if (networkAdmins.length === 0) {
            return [];
        }

        // Check that both certificate files and enrollment secrets have not been specified.
        if (networkAdminCertificateFiles.length && networkAdminEnrollSecrets.length) {
            throw new Error('You cannot specify both certificate files and enrollment secrets for network administrators');
        }

        // Check that enough certificate files have been specified.
        if (networkAdmins.length === networkAdminCertificateFiles.length) {
            return CmdUtil.parseNetworkAdminsWithCertificateFiles(networkAdmins, networkAdminCertificateFiles);
        }

        // Check that enough enrollment secrets have been specified.
        if (networkAdmins.length === networkAdminEnrollSecrets.length) {
            return CmdUtil.parseNetworkAdminsWithEnrollSecrets(networkAdmins, networkAdminEnrollSecrets);
        }

        // Not enough certificate files or enrollment secrets!
        throw new Error('You must specify certificate files or enrollment secrets for all network administrators');

    }

    /**
     * Build the bootstrap transactions for any business network administrators specified on the command line.
     * @param {BusinessNetworkDefinition} businessNetworkDefinitinon The business network definition.
     * @param {Object} argv The command line arguments as parsed by yargs.
     * @return {Object[]} The bootstrap transactions.
     */
    static buildBootstrapTransactions(businessNetworkDefinitinon, argv) {
        const method = 'buildBootstrapTransactions';
        LOG.entry(method, businessNetworkDefinitinon, argv);

        // Grab the useful things from the business network definition.
        const factory = businessNetworkDefinitinon.getFactory();
        const serializer = businessNetworkDefinitinon.getSerializer();

        // Parse the network administrators.
        const networkAdmins = CmdUtil.parseNetworkAdmins(argv);

        // Convert the network administrators into add participant transactions.
        const addParticipantTransactions = networkAdmins.map((networkAdmin) => {
            const participant = factory.newResource('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.name);
            const targetRegistry = factory.newRelationship('org.hyperledger.composer.system', 'ParticipantRegistry', participant.getFullyQualifiedType());
            const addParticipantTransaction = factory.newTransaction('org.hyperledger.composer.system', 'AddParticipant');
            Object.assign(addParticipantTransaction, {
                resources: [ participant ],
                targetRegistry
            });
            LOG.debug(method, 'Created bootstrap transaction to add participant', addParticipantTransaction);
            return addParticipantTransaction;
        });

        // Convert the network administrators into issue or bind identity transactions.
        const identityTransactions = networkAdmins.map((networkAdmin) => {

            // Handle a certificate which requires a bind identity transaction.
            let identityTransaction;
            if (networkAdmin.certificate) {
                identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
                Object.assign(identityTransaction, {
                    participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.name),
                    certificate: networkAdmin.certificate
                });
                LOG.debug(method, 'Created bootstrap transaction to bind identity', identityTransaction);
            }

            // Handle an enrollment secret which requires an issue identity transactiom.
            if (networkAdmin.secret) {
                identityTransaction = factory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
                Object.assign(identityTransaction, {
                    participant: factory.newRelationship('org.hyperledger.composer.system', 'NetworkAdmin', networkAdmin.name),
                    identityName: networkAdmin.name
                });
                LOG.debug(method, 'Created bootstrap transaction to issue identity', identityTransaction);
            }
            return identityTransaction;

        });

        // Serialize all of the transactions into a single array.
        const transactions = addParticipantTransactions.concat(identityTransactions);
        const json = transactions.map((transaction) => {
            return serializer.toJSON(transaction);
        });

        LOG.exit(method, json);
        return json;
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
}

module.exports = CmdUtil;
