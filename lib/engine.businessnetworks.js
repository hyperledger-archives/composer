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
                return sysregistries.getAll();
            })
            .then((registries) => {
                return registries.reduce((cur, next) => {
                    return cur.then(() => {
                        let registryType = next.type;
                        let registryId = next.id;
                        return dataService.deleteCollection(registryType + ':' + registryId);
                    });
                }, Promise.resolve());
            })
            .then(() => {
                return dataService.deleteCollection('$sysregistries');
            })
            .then(() => {
                return this.init(context, 'init', []);
            });
    }

}

module.exports = EngineBusinessNetworks;
