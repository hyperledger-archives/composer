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

const Relationship = require('@ibm/ibm-concerto-common').Relationship;
const Resource = require('@ibm/ibm-concerto-common').Resource;

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
        this.registryManager = registryManager;
    }

    /**
     * Resolve the specified resource or relationship and all of its relationships.
     * @param {Resource|Relationship} identifiable The identifiable to resolve.
     * @return {Promise} A promise that is resolved with the resolved {@link Resource}
     * object when the resource is resolved, or rejected with an error.
     */
    resolve(identifiable) {
        if (identifiable instanceof Resource) {
            return this.resolveResource(identifiable);
        } else if (identifiable instanceof Relationship) {
            return this.resolveRelationship(identifiable);
        } else {
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
        let classDeclaration = resource.getClassDeclaration();
        return classDeclaration.getProperties().reduce((result, property) => {

            // Get the property value.
            let value = resource[property.getName()];
            if (value instanceof Resource) {

                // Replace the property value with the resolved resource.
                return result.then(() => {
                    return this.resolveResource(value);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else if (value instanceof Relationship) {

                // Replace the property value with the resolved relationship.
                return result.then(() => {
                    return this.resolveRelationship(value);
                }).then((newValue) => {
                    resource[property.getName()] = newValue;
                });

            } else {
                return result;
            }

        }, Promise.resolve()).then(() => { return resource; });
    }

    /**
     * Resolve the specified relationship.
     * @private
     * @param {Relationship} relationship The relationship to resolve.
     * @return {Promise} A promise that is resolved with a {@link Resource} object,
     * or rejected with an error.
     */
    resolveRelationship(relationship) {
        let registryId = relationship.getFullyQualifiedType();
        return this.registryManager.get('Asset', registryId)
            .then((registry) => {
                let resourceId = relationship.getIdentifier();
                return registry.get(resourceId);
            })
            .then((resource) => {
                return this.resolveResource(resource);
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
