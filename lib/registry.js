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

const Util = require('@ibm/ibm-concerto-common').Util;

/**
 * Class representing an Abstract Registry.
 * <p><a href="diagrams/registry.svg"><img src="diagrams/registry.svg" style="width:100%;"/></a></p>
 * @abstract
 */
class Registry {

    /**
     * Get a list of all existing registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the registries.
     */
    static getAllRegistries(securityContext, registryType) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        }
        return Util.queryChainCode(securityContext, 'getAllRegistries', [registryType])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get an existing registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the registry.
     */
    static getRegistry(securityContext, registryType, id) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'getRegistry', [registryType, id])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Add a new asset registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @param {string} name The name of the registry.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the registry.
     */
    static addRegistry(securityContext, registryType, id, name) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        }
        return Util.invokeChainCode(securityContext, 'addRegistry', [registryType, id, name])
            .then(function () {
                return {
                    id: id,
                    name: name
                };
            });
    }

    /**
     * Create a registry.
     *
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Concerto}</strong>
     * </p>
     *
     * @protected
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @param {string} name The display name for the registry.
     */
    constructor(registryType, id, name) {
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        }
        this.registryType = registryType;
        this.id = id;
        this.name = name;
    }

    /**
     * Adds a new resource to the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @param {string} data The data for the resource.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    add(securityContext, id, data, functionName) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!data) {
            throw new Error('data not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'addResourceToRegistry', [this.registryType, this.id, id, data]);
    }

    /**
     * Adds a list of new resources to the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Object[]} resources The list of resources.
     * @param {string} resources[].id The unique identifier of the resource.
     * @param {string} resources[].data The data for the resource.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    addAll(securityContext, resources, functionName) {
        Util.securityCheck(securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'addAllResourcesToRegistry', [this.registryType, this.id, JSON.stringify(resources)]);
    }

    /**
     * Updates a resource in the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @param {string} data The data for the resource.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * updated in the registry.
     */
    update(securityContext, id, data, functionName) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!data) {
            throw new Error('data not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'updateResourceInRegistry', [this.registryType, this.id, id, data]);
    }

    /**
     * Updates a list of resources in the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Object[]} resources The list of resources.
     * @param {string} resources[].id The unique identifier of the resource.
     * @param {string} resources[].data The data for the resource.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    updateAll(securityContext, resources, functionName) {
        Util.securityCheck(securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'updateAllResourcesInRegistry', [this.registryType, this.id, JSON.stringify(resources)]);
    }

    /**
     * Remove an asset with a given type and id from the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * removed from the registry.
     */
    remove(securityContext, id, functionName) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'removeResourceFromRegistry', [this.registryType, this.id, id]);
    }

    /**
     * Removes a list of resources from the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string[]} ids The list of unique identifiers of the resources.
     * @param {string} [functionName] The optional chain-code function name to call.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    removeAll(securityContext, ids, functionName) {
        Util.securityCheck(securityContext);
        if (!ids) {
            throw new Error('ids not specified');
        }
        return Util.invokeChainCode(securityContext, functionName ? functionName : 'removeAllResourcesFromRegistry', [this.registryType, this.id, JSON.stringify(ids)]);
    }

    /**
     * Get all of the resources in the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the resources.
     */
    getAll(securityContext) {
        Util.securityCheck(securityContext);
        return Util.queryChainCode(securityContext, 'getAllResourcesInRegistry', [this.registryType, this.id])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get a specific resource in the registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the resource.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the resource.
     */
    get(securityContext, id) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'getResourceInRegistry', [this.registryType, this.id, id])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            });
    }

}

module.exports = Registry;
