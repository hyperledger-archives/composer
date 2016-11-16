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
class EngineResources {

    /**
     * Get all resources in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getAllResourcesInRegistry(context, args) {
        if (args.length !== 2) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllResourcesInRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registryManager) => {
                return registryManager.getAll();
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return context.getSerializer().toJSON(resource);
                });
            });
    }

    /**
     * Get the specified resource in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getResourceInRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getResourceInRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.get(resourceId);
            })
            .then((resource) => {
                return context.getSerializer().toJSON(resource);
            });
    }

    /**
     * Add an array of resources to the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addAllResourcesToRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addAllResourcesToRegistry', ['registryType', 'registryId', 'resources']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResources = JSON.parse(args[2]);
        let resources = serializedResources.map((serializedResource) => {
            // TODO: should revisit this interface.
            // let resourceId = serializedResource.id;
            let resourceData = JSON.parse(serializedResource.data);
            return context.getSerializer().fromJSON(resourceData);
        });
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.addAll(resources);
            });
    }

    /**
     * Add a resource to the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addResourceToRegistry(context, args) {
        if (args.length !== 4) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addResourceToRegistry', ['registryType', 'registryId', 'resourceId', 'resourceData']));
        }
        let registryType = args[0];
        let registryId = args[1];
        // TODO: should revisit this interface.
        // let resourceId = args[2];
        let resourceData = JSON.parse(args[3]);
        let resource = context.getSerializer().fromJSON(resourceData);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.add(resource);
            });
    }

    /**
     * Update an array of resources in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateAllResourcesInRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateAllResourcesInRegistry', ['registryType', 'registryId', 'resources']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResources = JSON.parse(args[2]);
        let resources = serializedResources.map((serializedResource) => {
            // TODO: should revisit this interface.
            // let resourceId = serializedResource.id;
            let resourceData = JSON.parse(serializedResource.data);
            return context.getSerializer().fromJSON(resourceData);
        });
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.updateAll(resources);
            });
    }

    /**
     * Update a resource in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateResourceInRegistry(context, args) {
        if (args.length !== 4) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateResourceInRegistry', ['registryType', 'registryId', 'resourceId', 'resourceData']));
        }
        let registryType = args[0];
        let registryId = args[1];
        // TODO: should revisit this interface.
        // let resourceId = args[2];
        let resourceData = JSON.parse(args[3]);
        let resource = context.getSerializer().fromJSON(resourceData);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.update(resource);
            });
    }

    /**
     * Remove an array of resources from the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeAllResourcesFromRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'removeAllResourcesFromRegistry', ['registryType', 'registryId', 'resourceIds']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceIds = JSON.parse(args[2]);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.removeAll(resourceIds);
            });
    }

    /**
     * Remove a resource from the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeResourceFromRegistry(context, args) {
        if (args.length !== 3) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'removeResourceFromRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.remove(resourceId);
            });
    }

}

module.exports = EngineResources;
