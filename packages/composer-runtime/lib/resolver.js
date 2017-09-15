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

const AssetDeclaration = require('composer-common').AssetDeclaration;
const CallbackRelationship = require('./callbackrelationship');
const Concept = require('composer-common').Concept;
const InvalidRelationship = require('./invalidrelationship');
const Logger = require('composer-common').Logger;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;

const LOG = Logger.getLog('Resolver');

/**
 * A class for resolving resources and their relationships to other resources.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class Resolver {

    /**
     * Constructor.
     * @param {Factory} factory The factory to use.
     * @param {Introspector} introspector The introspector to use.
     * @param {RegistryManager} registryManager The registry manager to use.
     */
    constructor(factory, introspector, registryManager) {
        const method = 'constructor';
        LOG.entry(method, registryManager);
        this.factory = factory;
        this.introspector = introspector;
        this.registryManager = registryManager;
        LOG.exit(method);
    }

    /**
     * @callback prepareCallback
     * @protected
     * @param {Promise} promise A promise that is resolved when resolving is complete.
     */

    /**
     * Prepare the specified resource and all of its relationships. This means that all
     * relationships will be replaced with wrappers that lazily trigger the resolving process.
     * @param {Resource|Relationship} identifiable The identifiable to resolve.
     * @param {prepareCallback} callback The callback to call if and when resolving occurs.
     * @return {Promise} A promise that is resolved immediately.
     */
    prepare(identifiable, callback) {
        const method = 'prepare';
        LOG.entry(method, identifiable.toString());
        let resolveState = {
            cachedResources: new Map(),
            prepare: true,
            prepareCallback: callback,
            preparePromise: Promise.resolve()
        };
        if (identifiable instanceof Resource) {
            return this.resolveResourceOrConcept(identifiable, resolveState)
                .then((result) => {
                    LOG.exit(method, result.toString());
                    return result;
                });
        } else {
            LOG.error(method, 'unsupported type for identifiable');
            throw new Error('unsupported type for identifiable');
        }
    }

    /**
     * Resolve the specified resource or relationship and all of its relationships.
     * @param {Resource|Relationship} identifiable The identifiable to resolve.
     * @return {Promise} A promise that is resolved with the resolved {@link Resource}
     * object when the resource is resolved, or rejected with an error.
     */
    resolve(identifiable) {
        const method = 'resolve';
        LOG.entry(method, identifiable.toString());
        let resolveState = {
            cachedResources: new Map()
        };
        if (identifiable instanceof Resource) {
            return this.resolveResourceOrConcept(identifiable, resolveState)
                .then((result) => {
                    LOG.exit(method, result.toString());
                    return result;
                });
        } else if (identifiable instanceof Relationship) {
            return this.resolveRelationship(identifiable, resolveState)
                .then((result) => {
                    LOG.exit(method, result.toString());
                    return result;
                });
        } else {
            LOG.error(method, 'unsupported type for identifiable');
            throw new Error('unsupported type for identifiable');
        }
    }

    /**
     * Resolve the specified resource.
     * @private
     * @param {Resource} resource The resource to resolve.
     * @param {Object} resolveState The current resolve state.
     * @param {Map} resolveState.cachedResources The cache of resolved resources.
     * @return {Promise} A promise that is resolved with a {@link Resource} object,
     * or rejected with an error.
     */
    resolveResourceOrConcept(resource, resolveState) {
        const method = 'resolveResourceOrConcept';
        LOG.entry(method, resource.toString(), resolveState);

        // Create a new resource, we don't want to modify the original.
        let newResource;
        if (resource instanceof Resource) {

            // Check we haven't cached this resource already.
            let fqi = resource.getFullyQualifiedIdentifier();
            if (resolveState.cachedResources.has(fqi)) {
                LOG.debug(method, 'Target resource is already present in cache', fqi);
                let resource = resolveState.cachedResources.get(fqi);
                LOG.exit(method, resource.toString());
                return Promise.resolve(resource);
            }

            // Create a new resource and cache that.
            newResource = this.factory.newResource(resource.getNamespace(), resource.getType(), resource.getIdentifier());
            resolveState.cachedResources.set(fqi, newResource);

        } else {
            newResource = this.factory.newConcept(resource.getNamespace(), resource.getType());
        }

        // Iterate over all the properties of the resource.
        let classDeclaration = resource.getClassDeclaration();
        return classDeclaration.getProperties().reduce((result, property) => {

            // Get the property value.
            LOG.debug(method, 'Looking at property', property.getName());
            let value = resource[property.getName()];

            // Shortcut if the value is not set.
            if (value === undefined) {
                return result;
            }

            // Process the value accordingly based on its type.
            if (value instanceof Resource) {

                // Replace the property value with the resolved resource.
                LOG.debug(method, 'Property value is a resource, resolving', value.toString());
                return result.then(() => {
                    return this.resolveResourceOrConcept(value, resolveState);
                }).then((newValue) => {
                    newResource[property.getName()] = newValue;
                });

            } else if (value instanceof Concept) {

                // Replace the property value with the resolved resource.
                LOG.debug(method, 'Property value is a concept, resolving', value.toString());
                return result.then(() => {
                    return this.resolveResourceOrConcept(value, resolveState);
                }).then((newValue) => {
                    newResource[property.getName()] = newValue;
                });

            } else if (value instanceof Relationship) {

                // If we are called as part of prepare, we set up a lazy relationship.
                if (resolveState.prepare) {
                    const newValue = new CallbackRelationship(value, (propertyName) => {
                        LOG.debug(method, 'Relationship callback, resolving', newValue, propertyName);
                        const result = resolveState.preparePromise.then(() => {
                            return this.resolveRelationship(newValue, resolveState);
                        }).then((resolvedValue) => {
                            LOG.debug(method, 'Relationship callback, resolved', resolvedValue, propertyName);
                            newResource[property.getName()] = resolvedValue;
                            return resolvedValue[propertyName];
                        });
                        resolveState.preparePromise = result;
                        resolveState.prepareCallback(result);
                        return result;
                    });
                    newResource[property.getName()] = newValue;
                    return result;
                }

                // Replace the property value with the resolved relationship.
                LOG.debug(method, 'Property value is a relationship, resolving', value.toString());
                return result.then(() => {
                    return this.resolveRelationship(value, resolveState);
                }).then((newValue) => {
                    newResource[property.getName()] = newValue;
                });

            } else if (Array.isArray(value)) {

                // Go through each item in the array.
                LOG.debug(method, 'Property value is an array, iterating over values', value.length);
                return result.then(() => {
                    return this.resolveArray(value, resolveState);
                })
                .then((newValue) => {
                    newResource[property.getName()] = newValue;
                });

            } else {

                // Copy the original value across.
                LOG.debug(method, 'Property value is neither a resource or a relationship, ignoring', value);
                newResource[property.getName()] = value;
                return result;

            }

        }, Promise.resolve())
            .then(() => {
                LOG.exit(method, resource.toString());
                return newResource;
            });
    }

    /**
     * Resolve all of the elements in the specified array.
     * @private
     * @param {*} array The array to resolve.
     * @param {Object} resolveState The current resolve state.
     * @param {Map} resolveState.cachedResources The cache of resolved resources.
     * @return {Promise} A promise that is resolved with an array of resolved objects,
     * or rejected with an error.
     */
    resolveArray(array, resolveState) {
        const method = 'resolveArray';
        LOG.entry(method, array, resolveState);
        return array.reduce((promise, item, index) => {

            // Check the type of the item in the array.
            if (item instanceof Resource) {

                // Replace the property value with the resolved resource.
                LOG.debug(method, 'Array item is a resource, resolving', item.toString());
                return promise.then((newArray) => {
                    return this.resolveResourceOrConcept(item, resolveState)
                        .then((newItem) => {
                            newArray.push(newItem);
                            return newArray;
                        });
                });

            } else if (item instanceof Concept) {

                // Replace the property value with the resolved concept.
                LOG.debug(method, 'Array item is a concept, resolving', item.toString());
                return promise.then((newArray) => {
                    return this.resolveResourceOrConcept(item, resolveState)
                        .then((newItem) => {
                            newArray.push(newItem);
                            return newArray;
                        });
                });

            } else if (item instanceof Relationship) {

                // Replace the property value with the resolved relationship.
                LOG.debug(method, 'Property value is a relationship, resolving', item.toString());
                return promise.then((newArray) => {

                    // If we are called as part of prepare, we set up a lazy relationship.
                    if (resolveState.prepare) {
                        const newIndex = newArray.length;
                        const newItem = new CallbackRelationship(item, (propertyName) => {
                            LOG.debug(method, 'Relationship callback, resolving', newItem, propertyName);
                            const result = resolveState.preparePromise.then(() => {
                                return this.resolveRelationship(newItem, resolveState);
                            }).then((resolvedItem) => {
                                newArray[newIndex] = resolvedItem;
                                return resolvedItem[propertyName];
                            });
                            resolveState.preparePromise = result;
                            resolveState.prepareCallback(result);
                            return result;
                        });
                        newArray.push(newItem);
                        return newArray;
                    }

                    return this.resolveRelationship(item, resolveState)
                        .then((newItem) => {
                            newArray.push(newItem);
                            return newArray;
                        });
                });

            } else {

                // Copy the original value across.
                LOG.debug(method, 'Array item is neither a resource or a relationship, ignoring', item);
                return promise.then((newArray) => {
                    newArray.push(item);
                    return newArray;
                });

            }

        }, Promise.resolve([]))
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Get the registry for the specified relationship.
     * @private
     * @param {Relationship} relationship The relationship to resolve.
     * @return {Promise} A promise that is resolved with a {@link Registry} object,
     * or rejected with an error.
     */
    getRegistryForRelationship(relationship) {
        const method = 'getRegistryForRelationship';
        LOG.entry(method, relationship.toString());
        let registryId = relationship.getFullyQualifiedType();
        let classDeclaration = this.introspector.getClassDeclaration(registryId);
        LOG.debug(method, 'Got class declaration', classDeclaration);
        let classType;
        if (classDeclaration instanceof AssetDeclaration) {
            classType = 'Asset';
        } else if (classDeclaration instanceof ParticipantDeclaration) {
            classType = 'Participant';
        } else if (classDeclaration instanceof TransactionDeclaration) {
            classType = 'Transaction';
        } else {
            throw new Error('Unsupported class declaration type ' + classDeclaration.toString());
        }
        LOG.debug(method, 'Getting registry', registryId);
        return this.registryManager.get(classType, registryId)
            .then((registry) => {
                LOG.exit(method, registry);
                return registry;
            });
    }

    /**
     * Resolve the specified relationship.
     * @private
     * @param {Relationship} relationship The relationship to resolve.
     * @param {Object} resolveState The current resolve state.
     * @param {Map} resolveState.cachedResources The cache of resolved resources.
     * @param {boolean} [resolveState.skipRecursion] Set to true to skip resolving the resolved resource.
     * @return {Promise} A promise that is resolved with a {@link Resource} object,
     * or rejected with an error.
     */
    resolveRelationship(relationship, resolveState) {
        const method = 'resolveRelationship';
        LOG.entry(method, relationship.toString(), resolveState);

        // Check the cache for an existing resolved relationship.
        let fqi = relationship.getFullyQualifiedIdentifier();
        if (resolveState.cachedResources.has(fqi)) {
            LOG.debug(method, 'Target resource is already present in cache', fqi);
            let resource = resolveState.cachedResources.get(fqi);
            LOG.exit(method, resource.toString());
            return Promise.resolve(resource);
        }

        // Nope, need to resolve it!
        return this.getRegistryForRelationship(relationship)
            .then((registry) => {
                let resourceId = relationship.getIdentifier();
                LOG.debug(method, 'Getting resource in registry', resourceId);
                return registry.get(resourceId);
            })
            .then((resource) => {
                if (resolveState.skipRecursion) {
                    LOG.debug(method, 'Got resource from registry, but skipping resolve');
                    resolveState.cachedResources.set(fqi, resource);
                    return resource;
                } else {
                    LOG.debug(method, 'Got resource from registry, resolving');
                    return this.resolveResourceOrConcept(resource, resolveState);
                }
            })
            .then((resource) => {
                LOG.exit(method, resource.toString());
                return resource;
            })
            .catch((error) => {
                LOG.error(method, 'Failed to resolve relationship', error);
                const invalid = new InvalidRelationship(relationship, error);
                LOG.exit(method, invalid);
                return invalid;
            });

    }

}

module.exports = Resolver;
