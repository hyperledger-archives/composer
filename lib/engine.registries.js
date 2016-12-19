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

const Logger = require('@ibm/ibm-concerto-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineRegistries');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:ibm-concerto-runtime
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
        const method = 'getAllRegistries';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllRegistries', ['registryType']));
        }
        let registryType = args[0];
        return context.getRegistryManager().getAll(registryType)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Get the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getRegistry(context, args) {
        const method = 'getRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Determine whether an asset registry exists.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved with a boolean indicating
     * whether the asset registry exists.
     */
    existsRegistry(context, args) {
        const method = 'existsRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().exists(registryType, registryId)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Add a new registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addRegistry(context, args) {
        const method = 'addRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addRegistry', ['registryType', 'registryId', 'registryName']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let registryName = args[2];
        return context.getRegistryManager().add(registryType, registryId, registryName)
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = EngineRegistries;
