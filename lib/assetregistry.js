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

const Registry = require('./registry');
const Util = require('@ibm/ibm-concerto-common').Util;

const REGISTRY_TYPE = 'Asset';

/**
 * The AssetRegistry is used to manage a set of assets stored on the blockchain.
 * <p><a href="diagrams/assetregistry.svg"><img src="diagrams/assetregistry.svg" style="width:100%;"/></a></p>
 * @extends Registry
 * @class
 * @memberof module:ibm-concerto-client
 */
class AssetRegistry extends Registry {

    /**
     * Get a list of all existing asset registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     * @return {Promise} A promise that will be resolved with a list of {@link AssetRegistry}
     * instances representing the asset registries.
     */
    static getAllAssetRegistries(securityContext, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getAllRegistries(securityContext, REGISTRY_TYPE)
            .then((assetRegistries) => {
                return assetRegistries.map((assetRegistry) => {
                    return new AssetRegistry(assetRegistry.id, assetRegistry.name, securityContext, modelManager, factory, serializer);
                });
            });
    }

    /**
     * Get an existing asset registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     * @return {Promise} A promise that will be resolved with a {@link AssetRegistry}
     * instance representing the asset registry.
     */
    static getAssetRegistry(securityContext, id, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.getRegistry(securityContext, REGISTRY_TYPE, id)
            .then((registry) => {
                return new AssetRegistry(registry.id, registry.name, securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Add a new asset registry.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset registry.
     * @param {string} name The name of the asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     * @return {Promise} A promise that will be resolved with a {@link AssetRegistry}
     * instance representing the new asset registry.
     */
    static addAssetRegistry(securityContext, id, name, modelManager, factory, serializer) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        return Registry.addRegistry(securityContext, REGISTRY_TYPE, id, name)
            .then(() => {
                return new AssetRegistry(id, name, securityContext, modelManager, factory, serializer);
            });
    }

    /**
     * Create an asset registry.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     * @protected
     * @param {string} id The unique identifier of the asset registry.
     * @param {string} name The display name for the asset registry.
     * @param {SecurityContext} securityContext The security context to use for this asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     */
    constructor(id, name, securityContext, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name, securityContext, modelManager, factory, serializer);
    }

}

module.exports = AssetRegistry;
