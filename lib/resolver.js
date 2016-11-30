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
const Relationship = require('@ibm/ibm-concerto-common').Relationship;
const Resource = require('@ibm/ibm-concerto-common').Resource;

const LOG = Logger.getLog('Context');

/**
 * A class for resolving resources and their relationships to other resources.
 * @protected
 * @abstract
 */
class Resolver {

    /**
     * Constructor.
     * @param {RegistryManager} registryManager The registry manager to use.
     */
    constructor(registryManager) {
        const method = 'constructor';
        LOG.entry(method, registryManager);
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
        if (identifiable instanceof Resource) {
            return this.resolveResource(identifiable)
                .then((result) => {
                    LOG.exit(method, result.toString());
                    return result;
                });
        } else if (identifiable instanceof Relationship) {
            return this.resolveRelationship(identifiable)
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
     * @return {Promise} A promise that is resolved with a {@link Resource} object,
     * or rejected with an error.
     */
    resolveResource(resource) {
        const method = 'resolveResource';
        LOG.entry(method, resource.toString());
        let classDeclaration = resource.getClassDeclaration();
        return classDeclaration.getProperties().reduce((result, property) => {

            // Get the property value.
            LOG.debug(method, 'Looking at property', property.getName());
            let value = resource[property.getName()];
            if (value instanceof Resource) {

                // Replace the property value with the resolved resource.
                LOG.debug(method, 'Property value is a resource, resolving', value.toString());
                return result.then(() => {
                    return this.resolveResource(value);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else if (value instanceof Relationship) {

                // Replace the property value with the resolved relationship.
                LOG.debug(method, 'Property value is a relationship, resolving', value.toString());
                return result.then(() => {
                    return this.resolveRelationship(value);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else if (Array.isArray(value)) {

                // Go through each item in the array.
                LOG.debug(method, 'Property value is an array, iterating over values', value.length);
                return value.reduce((result, item, index) => {

                    // Handle the array item.
                    if (item instanceof Resource) {

                        // Replace the property value with the resolved resource.
                        LOG.debug(method, 'Array item is a resource, resolving', item.toString());
                        return result.then(() => {
                            return this.resolveResource(item);
                        }).then((newItem) => {
                            value[index] = newItem;
                        });

                    } else if (item instanceof Relationship) {

                        // Replace the property value with the resolved relationship.
                        LOG.debug(method, 'Property value is a relationship, resolving', item.toString());
                        return result.then(() => {
                            return this.resolveRelationship(item);
                        }).then((newItem) => {
                            value[index] = newItem;
                        });

                    } else {
                        LOG.debug(method, 'Array item is neither a resource or a relationship, ignoring', item);
                        return result;
                    }

                }, Promise.resolve());

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
     * Resolve the specified relationship.
     * @private
     * @param {Relationship} relationship The relationship to resolve.
     * @return {Promise} A promise that is resolved with a {@link Resource} object,
     * or rejected with an error.
     */
    resolveRelationship(relationship) {
        const method = 'resolveRelationship';
        LOG.entry(method, relationship.toString());
        let registryId = relationship.getFullyQualifiedType();
        LOG.debug(method, 'Getting registry', registryId);
        return this.registryManager.get('Asset', registryId)
            .then((registry) => {
                let resourceId = relationship.getIdentifier();
                LOG.debug(method, 'Getting resource in registry', resourceId);
                return registry.get(resourceId);
            })
            .then((resource) => {
                LOG.debug(method, 'Got resource from registry, resolving');
                return this.resolveResource(resource);
            })
            .then((resource) => {
                LOG.exit(method, resource.toString());
                return resource;
            });
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = Resolver;
