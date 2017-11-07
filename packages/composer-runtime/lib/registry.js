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

const EventEmitter = require('events');
const Resource = require('composer-common').Resource;

/**
 * A class for managing and persisting resources.
 * @protected
 */
class Registry extends EventEmitter {

    /**
     * Remove any internal properties to the specified JSON object before
     * reinflating it back into a resource.
     * @param {Object} json The JSON object.
     * @return {Object} The JSON object.
     */
    static removeInternalProperties(json) {
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new Error('Can only add properties to JSON objects');
        }
        delete json.$registryType;
        delete json.$registryId;
        return json;
    }

    /**
     * Constructor.
     * @param {string} dataCollection The data collection to use.
     * @param {Serializer} serializer The serializer to use.
     * @param {AccessController} accessController The access controller to use.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @param {boolean} system True if the registry is for a system type, false otherwise.
     */
    constructor(dataCollection, serializer, accessController, type, id, name, system) {
        super();
        this.dataCollection = dataCollection;
        this.serializer = serializer;
        this.accessController = accessController;
        this.type = type;
        this.id = id;
        this.name = name;
        this.system = system;
    }

    /**
     * Get all the resources in this registry.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} objects when complete, or rejected with an error.
     */
    getAll() {
        return this.dataCollection.getAll()
            .then((objects) => {
                return objects.reduce((promiseChain, resource) => {
                    return promiseChain.then((newResources) => {
                        let object = Registry.removeInternalProperties(resource);
                        try {
                            let resourceToCheckAccess = this.serializer.fromJSON(object);
                            return this.accessController.check(resourceToCheckAccess, 'READ')
                            .then(() => {
                                newResources.push(resourceToCheckAccess);
                                return newResources;
                            }).catch((e) => {
                                return newResources;
                            });
                        } catch (err) {
                            return newResources;
                        }

                    });
                }, Promise.resolve([]));
            });
    }

    /**
     * Get the specified resource in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * object when complete, or rejected with an error.
     */
    get(id) {
        return this.dataCollection.get(id)
            .then((object) => {
                object = Registry.removeInternalProperties(object);
                let result = this.serializer.fromJSON(object);
                return this.accessController.check(result, 'READ')
                    .then(() => {
                        return result;
                    })
                    .catch((error) => {
                        throw new Error(`Object with ID '${id}' in collection with ID '${this.type}:${this.id}' does not exist`);
                    });
            });
    }

    /**
     * Determine whether the specified resource exists in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the asset exists.
     */
    exists(id) {
        return this.dataCollection.exists(id)
            .then((exists) => {
                if (!exists) {
                    return false;
                }
                return this.dataCollection.get(id)
                    .then((object) => {
                        object = Registry.removeInternalProperties(object);
                        let result = this.serializer.fromJSON(object);
                        return this.accessController.check(result, 'READ');
                    })
                    .then(() => {
                        return true;
                    })
                    .catch((error) => {
                        return false;
                    });
            });
    }

    /**
     * An event signalling that a resource has been added to this registry.
     * @event Registry#resourceadded
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} resource The resource.
     */

    /**
     * Add all of the specified resources to this registry.
     * @param {Resource[]} resources The resources to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     *  @param {boolean} [options.forceAdd] Forces adding the object even if it present (default to false)
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addAll(resources, options) {
        options = options || { forceAdd: false };
        return resources.reduce((result, resource) => {
            return result.then(() => {
                return this.add(resource, options);
            });
        }, Promise.resolve());
    }

    /**
     * Add the specified resource to this registry.
     * @param {Resource} resource The resource to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @param {boolean} [options.forceAdd] Forces adding the object even if it present (default to false)
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    add(resource, options) {

        return Promise.resolve().then(() => {
            if (!(resource instanceof Resource)) {
                throw new Error('Expected a Resource or Concept.');                }
            else if (this.type !== resource.getClassDeclaration().getSystemType()){
                throw new Error('Cannot add type: ' + resource.getClassDeclaration().getSystemType() + ' to ' + this.type);
            }
        })
            .then(() => {
                return this.accessController.check(resource, 'CREATE');
            })
            .then(() => {
                options = options || { forceAdd: false };
                let id = resource.getIdentifier();
                let object = this.serializer.toJSON(resource, {
                    convertResourcesToRelationships: options.convertResourcesToRelationships
                });
                object = this.addInternalProperties(object);
                return this.dataCollection.add(id, object, options.forceAdd);
            })
            .then(() => {
                this.emit('resourceadded', {
                    registry: this,
                    resource: resource
                });
            });
    }

    /**
     * An event signalling that a resource has been updated in this registry.
     * @event Registry#resourceupdated
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} oldResource The old version of the resource.
     * @param {Resource} newResource The new version of the resource.
     */

    /**
     * Update all of the specified resources in this registry.
     * @param {Resource[]} resources The resources to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateAll(resources, options) {
        options = options || {};
        return resources.reduce((result, resource) => {
            return result.then(() => {
                return this.update(resource, options);
            });
        }, Promise.resolve());
    }

    /**
     * Update the specified resource in this registry.
     * @param {Resource} resource The resource to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    update(resource, options) {
        let id;
        let object;

        return Promise.resolve().then(() => {
            if (!(resource instanceof Resource)) {
                throw new Error('Expected a Resource or Concept.');                }
            else if (this.type !== resource.getClassDeclaration().getSystemType()){
                throw new Error('Cannot update type: ' + resource.getClassDeclaration().getSystemType() + ' to ' + this.type);
            }
            options = options || {};
            id = resource.getIdentifier();
            object = this.serializer.toJSON(resource, {
                convertResourcesToRelationships: options.convertResourcesToRelationships                });                object = this.addInternalProperties(object);

            return this.dataCollection.get(id);
        })
            .then((oldResource) => {
                return this.serializer.fromJSON(oldResource);
            })
            .then((oldResource) => {
                // We must perform access control checks on the old version of the resource!
                return this.accessController.check(oldResource, 'UPDATE')
                    .then(() => {
                        return this.dataCollection.update(id, object);
                    })
                    .then(() => {
                        this.emit('resourceupdated', {
                            registry: this,
                            oldResource: oldResource,
                            newResource: resource
                        });
                    });
            });
    }

    /**
     * An event signalling that a resource has been removed from this registry.
     * @event Registry#resourceremoved
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {string} resourceID The ID of the resource.
     */

    /**
     * Remove all of the specified resources from this registry.
     * @param {string[]|Resource[]} resources The resources to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeAll(resources) {
        return resources.reduce((result, resource) => {
            return result.then(() => {
                return this.remove(resource);
            });
        }, Promise.resolve());
    }

    /**
     * Remove the specified resource from this registry.
     * @param {string|Resource} resource The resource to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    remove(resource) {
        return Promise.resolve()
            .then(() => {
                // If the resource is a string, then we need to retrieve
                // the resource using its ID from the registry. We need to
                // do this to figure out the type of the resource for
                // access control.
                if (resource instanceof Resource) {
                    return resource;
                } else {
                    return this.dataCollection.get(resource)
                        .then((object) => {
                            object = Registry.removeInternalProperties(object);
                            return this.serializer.fromJSON(object);
                        });
                }
            })
            .then((resource) => {
                let id = resource.getIdentifier();
                return this.accessController.check(resource, 'DELETE')
                    .then(() => {
                        return this.dataCollection.remove(id);
                    })
                    .then(() => {
                        this.emit('resourceremoved', {
                            registry: this,
                            resourceID: id
                        });
                    });
            });
    }

    /**
     * Add any internal properties to the specified JSON object before
     * persisting it into a data collection.
     * @param {Object} json The JSON object.
     * @return {Object} The JSON object.
     */
    addInternalProperties(json) {
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new Error('Can only add properties to JSON objects');
        }
        json.$registryType = this.type;
        json.$registryId = this.id;
        return json;
    }

    /**
     * Return an object suitable for serialization.
     * @return {Object} An object suitable for serialization.
     */
    toJSON() {
        return {
            type: this.type,
            id: this.id,
            name: this.name
        };
    }

}

module.exports = Registry;
