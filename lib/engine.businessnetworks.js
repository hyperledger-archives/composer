/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Context = require('./context');
const createHash = require('sha.js');
const Logger = require('@ibm/ibm-concerto-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineBusinessNetworks');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 */
class EngineBusinessNetworks {

    /**
     * Get the business network archive.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getBusinessNetwork(context, args) {
        const method = 'getBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getBusinessNetwork', []));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysdata')
            .then((sysdata) => {
                return sysdata.get('businessnetwork');
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Update the business network archive.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateBusinessNetwork(context, args) {
        const method = 'updateBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateBusinessNetwork', ['businessNetworkArchive']));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysdata')
            .then((sysdata) => {

                // Validate the business network archive and store it.
                let businessNetworkBase64 = args[0];
                let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
                let sha256 = createHash('sha256');
                let businessNetworkHash = sha256.update(businessNetworkBase64, 'utf8').digest('hex');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                    .then((businessNetworkDefinition) => {
                        LOG.debug(method, 'Loaded business network definition, storing in cache');
                        Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);
                        LOG.debug(method, 'Loaded business network definition, storing in $sysdata collection');
                        return sysdata.update('businessnetwork', {
                            data: businessNetworkBase64,
                            hash: businessNetworkHash
                        });
                    });

            })
            .then(() => {

                // Reinitialize the context to reload the business network.
                LOG.debug(method, 'Reinitializing context');
                return context.initialize();

            })
            .then(() => {

                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Reset the business network by clearing all data.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resetBusinessNetwork(context, args) {
        const method = 'resetBusinessNetwork';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'resetBusinessNetwork', []));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysregistries')
            .then((sysregistries) => {
                return sysregistries.getAll()
                .then((registries) => {
                    return registries.reduce((cur, next) => {
                        return cur.then(() => {
                            let registryType = next.type;
                            let registryId = next.id;
                            LOG.debug(method, 'Deleting collection', registryType, registryId);
                            return dataService.deleteCollection(registryType + ':' + registryId)
                                .then(() => {
                                    LOG.debug(method, 'Deleting record of collection from $sysregistries', registryType, registryId);
                                    return sysregistries.remove(registryType + ':' + registryId);
                                });
                        });
                    }, Promise.resolve());
                });
            })
            .then(() => {

                // Create the default transaction registry if it does not exist.
                let registryManager = context.getRegistryManager();
                return registryManager
                    .get('Transaction', 'default')
                    .catch((error) => {
                        LOG.debug(method, 'The default transaction registry does not exist, creating');
                        return registryManager.add('Transaction', 'default', 'Default Transaction Registry');
                    });

            })
            .then(() => {

                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineBusinessNetworks;
