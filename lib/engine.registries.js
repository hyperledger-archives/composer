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
class EngineRegistries {

    /**
     * Get all registries.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getAllRegistries(context, args) {
        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllRegistries', ['registryType']));
        }
        let registryType = args[0];
        return context.getRegistryManager().getAll(registryType);
    }

    /**
     * Get the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getRegistry(context, args) {
        if (args.length !== 2) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId);
    }

    /**
     * Add a new registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addRegistry', ['registryType', 'registryId', 'registryName']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let registryName = args[2];
        return context.getRegistryManager().add(registryType, registryId, registryName);
    }

}

module.exports = EngineRegistries;
