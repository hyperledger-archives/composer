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
const util = require('util');

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
        if (args.length !== 0) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getBusinessNetwork', []));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysdata')
            .then((sysdata) => {
                return sysdata.get('businessnetwork');
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
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateBusinessNetwork', ['businessNetworkArchive']));
        }
        let dataService = context.getDataService();
        return dataService.getCollection('$sysdata')
            .then((sysdata) => {

                // Validate the business network archive and store it.
                let businessNetworkArchive = Buffer.from(args[0], 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                    .then((businessNetworkDefinition) => {
                        return sysdata.update('businessnetwork', {
                            data: args[0]
                        });
                    });

            })
            .then(() => {

                // Reinitialize the context to reload the business network.
                return context.initialize();

            })
            .then(() => {

                // Create all other default registries.
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

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
        if (args.length !== 0) {
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
                            return dataService.deleteCollection(registryType + ':' + registryId)
                                .then(() => {
                                    return sysregistries.remove(registryType + ':' + registryId);
                                });
                        });
                    }, Promise.resolve());
                });
            })
            .then(() => {

                // Create all other default registries.
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            });
    }

}

module.exports = EngineBusinessNetworks;
