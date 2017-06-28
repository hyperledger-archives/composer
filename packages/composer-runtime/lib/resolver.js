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
const Logger = require('composer-common').Logger;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;

const LOG = Logger.getLog('Context');

/**
 * A class for resolving resources and their relationships to other resources.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class Resolver {

    /**
     * Constructor.
     * @param {Introspector} introspector The introspector to use.
     * @param {RegistryManager} registryManager The registry manager to use.
     */
    constructor(introspector, registryManager) {
        const method = 'constructor';
        LOG.entry(method, registryManager);
        this.introspector = introspector;
        this.registryManager = registryManager;
        LOG.exit(method);
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
            resolveState.cachedResources.set(identifiable.getFullyQualifiedIdentifier(), identifiable);
            return this.resolveResource(identifiable, resolveState)
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
    resolveResource(resource, resolveState) {
        const method = 'resolveResource';
        LOG.entry(method, resource.toString(), resolveState);
        let classDeclaration = resource.getClassDeclaration();
        return classDeclaration.getProperties().reduce((result, property) => {

            // Get the property value.
            LOG.debug(method, 'Looking at property', property.getName());
            let value = resource[property.getName()];
            if (value instanceof Resource) {

                // Replace the property value with the resolved resource.
                LOG.debug(method, 'Property value is a resource, resolving', value.toString());
                return result.then(() => {
                    return this.resolveResource(value, resolveState);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else if (value instanceof Relationship) {

                // Replace the property value with the resolved relationship.
                LOG.debug(method, 'Property value is a relationship, resolving', value.toString());
                return result.then(() => {
                    return this.resolveRelationship(value, resolveState);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else if (Array.isArray(value)) {

                // Go through each item in the array.
                LOG.debug(method, 'Property value is an array, iterating over values', value.length);
                return value.reduce((arrayReduceResult, item, index) => {

                    // Handle the array item.
                    if (item instanceof Resource) {

                        // Replace the property value with the resolved resource.
                        LOG.debug(method, 'Array item is a resource, resolving', item.toString());
                        return arrayReduceResult.then(() => {
                            return this.resolveResource(item, resolveState);
                        }).then((newItem) => {
                            value[index] = newItem;
                        });

                    } else if (item instanceof Relationship) {

                        // Replace the property value with the resolved relationship.
                        LOG.debug(method, 'Property value is a relationship, resolving', item.toString());
                        return arrayReduceResult.then(() => {
                            return this.resolveRelationship(item, resolveState);
                        }).then((newItem) => {
                            value[index] = newItem;
                        });

                    } else {
                        LOG.debug(method, 'Array item is neither a resource or a relationship, ignoring', item);
                        return arrayReduceResult;
                    }

                }, result);

            } else {
                LOG.debug(method, 'Property value is neither a resource or a relationship, ignoring', value);
                return result;
            }

        }, Promise.resolve())
            .then(() => {
                LOG.exit(method, resource.toString());
                return resource;
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
            // Special case for this one!
            registryId = 'default';
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
        let fqi = relationship.getFullyQualifiedIdentifier();
        if (resolveState.cachedResources.has(fqi)) {
            LOG.debug(method, 'Target resource is already present in cache', fqi);
            let resource = resolveState.cachedResources.get(fqi);
            LOG.exit(method, resource.toString());
            return Promise.resolve(resource);
        }
        return this.getRegistryForRelationship(relationship)
            .then((registry) => {
                let resourceId = relationship.getIdentifier();
                LOG.debug(method, 'Getting resource in registry', resourceId);
                return registry.get(resourceId);
            })
            .then((resource) => {
                LOG.debug(method, 'Got resource from registry, adding to cache');
                resolveState.cachedResources.set(fqi, resource);
                if (resolveState.skipRecursion) {
                    LOG.debug(method, 'Got resource from registry, but skipping resolve');
                    return resource;
                } else {
                    LOG.debug(method, 'Got resource from registry, resolving');
                    return this.resolveResource(resource, resolveState);
                }
            })
            .then((resource) => {
                LOG.exit(method, resource.toString());
                return resource;
            });
    }

}

module.exports = Resolver;
