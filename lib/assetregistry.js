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

const Resource = require('@ibm/ibm-concerto-common').Resource;
const Registry = require('./registry');
const Util = require('@ibm/ibm-concerto-common').Util;

const REGISTRY_TYPE = 'Asset';

/**
 * The AssetRegistry is used to manage a set of assets stored on the blockchain.
 * <p><a href="diagrams/assetregistry.svg"><img src="diagrams/assetregistry.svg" style="width:100%;"/></a></p>
 * @extends Registry
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
            .then(function (assetRegistries) {
                return assetRegistries.map(function (assetRegistry) {
                    return new AssetRegistry(assetRegistry.id, assetRegistry.name, modelManager, factory, serializer);
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
            .then(function (registry) {
                return new AssetRegistry(registry.id, registry.name, modelManager, factory, serializer);
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
            .then(function () {
                return new AssetRegistry(id, name, modelManager, factory, serializer);
            });
    }

    /**
     * Create an asset registry.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Concerto}</strong>
     * </p>
     * @protected
     * @param {string} id The unique identifier of the asset registry.
     * @param {string} name The display name for the asset registry.
     * @param {ModelManager} modelManager The ModelManager to use for this asset registry.
     * @param {Factory} factory The factory to use for this asset registry.
     * @param {Serializer} serializer The Serializer to use for this asset registry.
     */
    constructor(id, name, modelManager, factory, serializer) {
        super(REGISTRY_TYPE, id, name);
        if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        this.modelManager = modelManager;
        this.factory = factory;
        this.serializer = serializer;
    }

    /**
     * Adds an asset to the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Resource} asset The asset to be added to the asset registry.
     * @return {Promise} A promise that is resolved when the asset is added to
     * the asset registry.
     */
    add(securityContext, asset) {
        Util.securityCheck(securityContext);
        if (!asset) {
            throw new Error('asset not specified');
        }
        let data = this.serializer.toJSON(asset);
        return super.add(securityContext, asset.getIdentifier(), JSON.stringify(data));
    }

    /**
     * Adds a list of assets to the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Resource[]} assets The assets to be added to the asset registry.
     * @return {Promise} A promise that is resolved when the assets are added to
     * the asset registry.
     */
    addAll(securityContext, assets) {
        Util.securityCheck(securityContext);
        if (!assets) {
            throw new Error('assets not specified');
        }
        let data = assets.map((asset) => {
            return {
                id: asset.getIdentifier(),
                data: JSON.stringify(this.serializer.toJSON(asset))
            };
        });
        return super.addAll(securityContext, data);
    }

    /**
     * Updates an asset in the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Resource} asset The asset to be updated in the asset registry.
     * @return {Promise} A promise that is resolved when the asset is updated
     * in the asset registry.
     */
    update(securityContext, asset) {
        Util.securityCheck(securityContext);
        if (!asset) {
            throw new Error('asset not specified');
        }
        let data = this.serializer.toJSON(asset);
        return super.update(securityContext, asset.getIdentifier(), JSON.stringify(data));
    }

    /**
     * Updates a list of assets in the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {Resource[]} assets The assets to be updated in the asset registry.
     * @return {Promise} A promise that is resolved when the assets are updated in
     * the asset registry.
     */
    updateAll(securityContext, assets) {
        Util.securityCheck(securityContext);
        if (!assets) {
            throw new Error('assets not specified');
        }
        let data = assets.map((asset) => {
            return {
                id: asset.getIdentifier(),
                data: JSON.stringify(this.serializer.toJSON(asset))
            };
        });
        return super.updateAll(securityContext, data);
    }

    /**
     * Remove an asset with a given type and id from the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {(Resource|string)} asset The asset, or the unique identifier of the asset.
     * @return {Promise} A promise that is resolved when the asset is removed
     * from the registry.
     */
    remove(securityContext, asset) {
        Util.securityCheck(securityContext);
        if (!asset) {
            throw new Error('asset not specified');
        }
        let id;
        if (asset instanceof Resource) {
            id = asset.getIdentifier();
        } else {
            id = asset;
        }
        return super.remove(securityContext, id);
    }

    /**
     * Remove a list of assets with a given type and id from the asset registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {(Resource[]|string[])} assets The assets, or the unique identifiers of the assets.
     * @return {Promise} A promise that is resolved when the assets are removed
     * from the registry.
     */
    removeAll(securityContext, assets) {
        Util.securityCheck(securityContext);
        if (!assets) {
            throw new Error('assets not specified');
        }
        let data = assets.map((asset) => {
            if (asset instanceof Resource) {
                return asset.getIdentifier();
            } else {
                return asset;
            }
        });
        return super.removeAll(securityContext, data);
    }

    /**
     * Get all of the assets in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} instances representing the assets.
     */
    getAll(securityContext) {
        Util.securityCheck(securityContext);
        let self = this;
        return super.getAll(securityContext)
            .then(function (resources) {
                return resources.map(function (resource) {
                    return self.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Find assets in the asset registry that match the specified JSONata expression.
     * The JSONata expression is applied to each asset in the asset registry, and
     * assets are returned if the JSONata expression returns a truthy value for that
     * asset.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} expression The JSONata expression.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} instances representing the assets that match the query.
     */
    find(securityContext, expression) {
        Util.securityCheck(securityContext);
        if (!expression) {
            throw new Error('expression not specified');
        }
        let self = this;
        return Util.queryChainCode(securityContext, 'findAssetsInAssetRegistry', [this.id, expression])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            })
            .then(function (resources) {
                return resources.map(function (resource) {
                    return self.serializer.fromJSON(JSON.parse(resource.data));
                });
            });
    }

    /**
     * Execute a query against all assets in the asset registry. The JSONata
     * expression is applied to each asset in the asset registry, and the result
     * of the JSONata expression is returned if the result is truthy. The result
     * is a JavaScript object, and should only be used for visualization
     * purposes. You cannot use the {@link add} or {@link update} functions with
     * data returned by this function.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} expression The JSONata expression.
     * @return {Promise} A promise that will be resolved with an array of JavaScript
     * objects representing the assets and all of their resolved relationships.
     */
    query(securityContext, expression) {
        Util.securityCheck(securityContext);
        if (!expression) {
            throw new Error('expression not specified');
        }
        return Util.queryChainCode(securityContext, 'queryAssetsInAssetRegistry', [this.id, expression])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            })
            .then(function (resources) {
                return resources.map(function (resource) {
                    return JSON.parse(resource.data);
                });
            });
    }

    /**
     * Get all of the assets in the registry, and resolve all of their relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the {@link add} or {@link update} functions with a resolved asset.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @return {Promise} A promise that will be resolved with an array of JavaScript
     * objects representing the assets and all of their resolved relationships.
     */
    resolveAll(securityContext) {
        Util.securityCheck(securityContext);
        return Util.queryChainCode(securityContext, 'resolveAllAssetsInAssetRegistry', [this.id])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            })
            .then(function (resources) {
                return resources.map(function (resource) {
                    return JSON.parse(resource.data);
                });
            });
    }

    /**
     * Get a specific asset in the registry.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset.
     * @param {boolean} [options.resolve] Resolve all of the assets relationships.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * instance representing the asset.
     */
    get(securityContext, id) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        let self = this;
        return super.get(securityContext, id)
            .then(function (resource) {
                return self.serializer.fromJSON(resource);
            });
    }

    /**
     * Get a specific asset in the registry, and resolve all of its relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the {@link add} or {@link update} functions with a resolved asset.
     *
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} id The unique identifier of the asset.
     * @return {Promise} A promise that will be resolved with a JavaScript object
     * representing the asset and all of its resolved relationships.
     */
    resolve(securityContext, id) {
        Util.securityCheck(securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'resolveAssetInAssetRegistry', [this.id, id])
            .then(function (buffer) {
                return JSON.parse(buffer.toString());
            })
            .then(function (resource) {
                return JSON.parse(resource.data);
            });
    }

}

module.exports = AssetRegistry;
