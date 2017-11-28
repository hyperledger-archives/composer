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

const Resource = require('composer-common').Resource;
const Util = require('composer-common').Util;

/**
 * Class representing an Abstract Registry.
 *
 * ** Applications should retrieve instances from {@link BusinessNetworkConnection}**
 * @abstract
 * @class
 * @memberof module:composer-client
 */
class Registry {

    /**
     * Get a list of all existing registries.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {boolean} [includeSystem] True if system registries should be included (optional default is false)
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the registries.
     */
    static getAllRegistries(securityContext, registryType, includeSystem) {
        Util.securityCheck(securityContext);
        includeSystem = includeSystem || false;
        if (!registryType) {
            throw new Error('registryType not specified');
        }
        return Util.queryChainCode(securityContext, 'getAllRegistries', [registryType,includeSystem])
            .then((buffer) => {
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
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Determines whether a registry exists.
     *
     * @protected
     * @param {SecurityContext} securityContext The user's security context.
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @return {Promise} A promise that will be resolved with true/false depending on whether the registry exists
     */
    static existsRegistry(securityContext, registryType, id) {
        Util.securityCheck(securityContext);
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(securityContext, 'existsRegistry', [registryType, id])
        .then((buffer) => {
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
            .then(() => {
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
     * retrieve instances from {@link BusinessNetworkConnection}</strong>
     * </p>
     *
     * @protected
     * @param {string} registryType The type of this registry.
     * @param {string} id The unique identifier of the registry.
     * @param {string} name The display name for the registry.
     * @param {SecurityContext} securityContext The users security context.
     * @param {ModelManager} modelManager The ModelManager to use for this registry.
     * @param {Factory} factory The factory to use for this registry.
     * @param {Serializer} serializer The Serializer to use for this registry.
     * @param {BusinessNetworkConnection} bnc Instance of the BusinessNetworkConnection
     * TODO: Rationalize the bnc with the other objects - as the bnc contains these other arguments
     */
    constructor(registryType, id, name, securityContext, modelManager, factory, serializer,bnc) {
        if (!registryType) {
            throw new Error('registryType not specified');
        } else if (!id) {
            throw new Error('id not specified');
        } else if (!name) {
            throw new Error('name not specified');
        } else if (!securityContext) {
            throw new Error('securityContext not specified');
        } else if (!modelManager) {
            throw new Error('modelManager not specified');
        } else if (!factory) {
            throw new Error('factory not specified');
        } else if (!serializer) {
            throw new Error('serializer not specified');
        }
        this.registryType = registryType;
        this.id = id;
        this.name = name;
        this.securityContext = securityContext;
        this.modelManager = modelManager;
        this.factory = factory;
        this.serializer = serializer;
        this.bnc = bnc;
    }

    /**
     * Adds a list of new resources to the registry.
     *
     * @param {Resource[]} resources The resources to be added to the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    addAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }

        let txName = 'Add'+this.registryType;

        // create the new system transaction to add the resources
        const transaction = this.factory.newTransaction('org.hyperledger.composer.system',txName);

        // target registry is the registry that this the client 'shadow' of
        transaction.targetRegistry = this.factory.newRelationship('org.hyperledger.composer.system',this.registryType+'Registry', this.id);
        transaction.resources = resources;
        return this.bnc.submitTransaction(transaction);
    }

    /**
     * Adds a new resource to the registry.
     *
     * @param {Resource} resource The resource to be added to the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    add(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        return this.addAll([resource]);
    }

    /**
     * Updates a list of resources in the registry.
     *
     * @param {Resource[]} resources The resources to be updated in the asset registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    updateAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        let txName = 'Update'+this.registryType;
        const transaction = this.factory.newTransaction('org.hyperledger.composer.system',txName);
        // target registry is the registry that this the client 'shadow' of
        transaction.targetRegistry = this.factory.newRelationship('org.hyperledger.composer.system',this.registryType+'Registry', this.id);
        transaction.resources = resources;
        return this.bnc.submitTransaction(transaction);
    }

    /**
     * Updates a resource in the registry.
     *
     * @param {Resource} resource The resource to be updated in the registry.
     * @return {Promise} A promise that will be resolved when the resource is
     * updated in the registry.
     */
    update(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        return this.updateAll([resource]);
    }

    /**
     * Removes a list of resources from the registry.
     *
     * @param {(Resource[]|string[])} resources The resources, or the unique identifiers of the resources.
     * @return {Promise} A promise that will be resolved when the resource is
     * added to the registry.
     */
    removeAll(resources) {
        Util.securityCheck(this.securityContext);
        if (!resources) {
            throw new Error('resources not specified');
        }
        let txName = 'Remove'+this.registryType;
        const transaction = this.factory.newTransaction('org.hyperledger.composer.system',txName);
        transaction.resources = [];
        // target registry is the registry that this the client 'shadow' of
        transaction.targetRegistry = this.factory.newRelationship('org.hyperledger.composer.system',this.registryType+'Registry', this.id);

        transaction.resourceIds = resources.map((resource) => {
            if (resource instanceof Resource) {
                return resource.getIdentifier();
            } else {
                return resource;
            }
        });
        return this.bnc.submitTransaction(transaction);
    }

    /**
     * Remove an asset with a given type and id from the registry.
     *
     * @param {(Resource|string)} resource The resource, or the unique identifier of the resource.
     * @return {Promise} A promise that will be resolved when the resource is
     * removed from the registry.
     */
    remove(resource) {
        Util.securityCheck(this.securityContext);
        if (!resource) {
            throw new Error('resource not specified');
        }
        return this.removeAll([resource]);
    }

    /**
     * Get all of the resources in the registry.
     *
     * @return {Promise} A promise that will be resolved with an array of JSON
     * objects representing the resources.
     */
    getAll() {

        Util.securityCheck(this.securityContext);
        return Util.queryChainCode(this.securityContext, 'getAllResourcesInRegistry', [this.registryType, this.id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return this.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Get a specific resource in the registry.
     *
     * @param {string} id The unique identifier of the resource.
     * @return {Promise} A promise that will be resolved with a JSON object
     * representing the resource.
     */
    get(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'getResourceInRegistry', [this.registryType, this.id, id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            })
            .then((resource) => {
                return this.serializer.fromJSON(resource);
            });
    }

    /**
     * Determines whether a specific resource exists in the registry.
     *
     * @param {string} id The unique identifier of the resource.
     * @return {Promise} A promise that will be resolved with true/false depending on whether the resource exists.
     */
    exists(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'existsResourceInRegistry', [this.registryType, this.id, id])
        .then((buffer) => {
            return JSON.parse(buffer.toString());
        });
    }

    /**
     * Get all of the resources in the registry, and resolve all of their relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the {@link #add add} or {@link #update update} functions with a resolved resource.
     *
     * @return {Promise} A promise that will be resolved with an array of JavaScript
     * objects representing the resources and all of their resolved relationships.
     */
    resolveAll() {
        Util.securityCheck(this.securityContext);
        return Util.queryChainCode(this.securityContext, 'resolveAllResourcesInRegistry', [this.registryType, this.id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

    /**
     * Get a specific resource in the registry, and resolve all of its relationships
     * to other assets, participants, and transactions. The result is a JavaScript
     * object, and should only be used for visualization purposes. You cannot use
     * the  {@link #add add} or {@link #update update} functions with a resolved resource.
     *
     * @param {string} id The unique identifier of the asset.
     * @return {Promise} A promise that will be resolved with a JavaScript object
     * representing the resource and all of its resolved relationships.
     */
    resolve(id) {
        Util.securityCheck(this.securityContext);
        if (!id) {
            throw new Error('id not specified');
        }
        return Util.queryChainCode(this.securityContext, 'resolveResourceInRegistry', [this.registryType, this.id, id])
            .then((buffer) => {
                return JSON.parse(buffer.toString());
            });
    }

}

module.exports = Registry;
