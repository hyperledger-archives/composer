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

const jsonata = require('jsonata');
const Logger = require('composer-common').Logger;
const Relationship = require('composer-common').Relationship;
const Resource = require('composer-common').Resource;

const LOG = Logger.getLog('QueryEngine');

/**
 * Design documentation:
 *
 * The aim of this class to execute queries (currently JSONata expressions) on a
 * resource or a set of resources. In order for this query support to be useful,
 * the queries must be able to navigate relationships between resources. For example,
 * I might want to execute a query of "find all the animals which are in a field,
 * where that field is owned by a business, where that business is run by a farmer
 * with the email address alice@farmers.com".
 *
 * We do not want to eagerly resolve all visible relationships, as this is slow.
 * Most business networks are large and complex, with many relationships between
 * resources, and additionally those relationships can be circular.
 *
 * Ideally, we would only resolve relationships that are needed in order to
 * successfully execute the query. We can do this by creating "special" properties
 * on the relationship object for each of the properties that should exist on the
 * target resource. When the "special" property is accessed by the query, a function
 * can be executed to resolve that relationship and replace it with the target
 * resource.
 */

/**
 * A class for executing queries using JSONata expressions against resources.
 * @protected
 */
class QueryExecutor {

    /**
     * Constructor.
     * @param {Resolver} resolver The resolver to use.
     */
    constructor(resolver) {
        const method = 'constructor';
        LOG.entry(method, resolver);
        this.resolver = resolver;
        LOG.exit(method);
    }

    /**
     * Query all of the specified resources using the given JSONata expression.
     * @param {string} expression The JSONata expression.
     * @param {Resource[]} resources The resource to query.
     * @return {Promise} A promise that will be resolved with the results of the
     * query, or rejected with an error.
     */
    queryAll(expression, resources) {
        const method = 'queryAll';
        LOG.entry(method, expression, resources);

        // Compile the expression.
        LOG.debug(method, 'Compiling JSONata expression');
        const compiledExpression = jsonata(expression);
        LOG.debug(method, 'Compiled JSONata expression');

        // Prepare the root resources.
        let cachedResources = new Map();
        resources.forEach((resource) => {
            LOG.debug(method, 'Preparing resource', resource.getFullyQualifiedIdentifier());
            let fqi = resource.getFullyQualifiedIdentifier();
            cachedResources.set(fqi, resource);
            this.prepareResource(resource);
        });

        // Process the query by calling the method that does the bulk of the work.
        let promise = Promise.resolve();
        let result = [];
        resources.forEach((resource) => {
            promise = promise.then(() => {
                LOG.debug(method, 'Executing query on resource', resource.getFullyQualifiedIdentifier());
                return this.queryInternal(compiledExpression, resource, cachedResources)
                    .then((thisResult) => {
                        LOG.debug(method, 'Executed query, adding result to list');
                        result.push(thisResult);
                    });
            });
        });
        return promise
            .then(() => {
                LOG.exit(method, result);
                return result;
            });

    }

    /**
     * Query the specified resource using the given JSONata expression.
     * @param {string} expression The JSONata expression.
     * @param {Resource} resource The resource to query.
     * @return {Promise} A promise that will be resolved with the results of the
     * query, or rejected with an error.
     */
    query(expression, resource) {
        const method = 'query';
        LOG.entry(method, expression, resource.toString());

        // Compile the expression.
        LOG.debug(method, 'Compiling JSONata expression');
        const compiledExpression = jsonata(expression);
        LOG.debug(method, 'Compiled JSONata expression');

        // Prepare the root resource.
        let cachedResources = new Map();
        let fqi = resource.getFullyQualifiedIdentifier();
        cachedResources.set(fqi, resource);
        this.prepareResource(resource);

        // Process the query by calling the method that does the bulk of the work.
        return this.queryInternal(compiledExpression, resource, cachedResources)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });

    }

    /**
     * @private
     * @typedef {Object} FoundRelationship
     * @property {Relationship} relationship The relationship.
     * @property {function} resolve The function to set the resolved value.
     */

    /**
     * Query the specified resource using the given JSONata expression.
     * @private
     * @param {Object} compiledExpression The compiled JSONata expression.
     * @param {Resource} resource The resource to query.
     * @param {Map} cachedResources The cache of resources.
     * @return {Promise} A promise that will be resolved with the results of the
     * query, or rejected with an error.
     */
    queryInternal(compiledExpression, resource, cachedResources) {
        const method = 'queryInternal';
        LOG.entry(method, compiledExpression, resource, cachedResources);

        // Evaluate the expression.
        LOG.debug(method, 'Evaluating JSONata expression');
        return new Promise((resolve, reject) => {
            compiledExpression.evaluate(resource, null, (error, result) => {
                if (error) {
                    return reject(error);
                }
                LOG.exit(method);
                resolve(result);
            });
        });

    }

    /**
     * Find all of the relationships in the specified resource.
     * @private
     * @param {Resource} resource The resource to resolve.
     * @return {FoundRelationship[]} The relationships in the specified resource.
     */
    findRelationships(resource) {
        const method = 'findRelationships';
        LOG.entry(method, resource.toString());
        let classDeclaration = resource.getClassDeclaration();
        let result = [];
        classDeclaration.getProperties().forEach((property) => {
            LOG.debug(method, 'Looking at property', property.getName());
            let value = resource[property.getName()];
            if (value instanceof Resource) {
                LOG.debug(method, 'Found resource property, recursing');
                result.concat(this.findRelationships(value));
            } else if (value instanceof Relationship) {
                LOG.debug(method, 'Found relationship property');
                result.push({
                    relationship: value,
                    resolve: (newValue) => {
                        LOG.debug(
                            method,
                            'Replacing relationship property with resolved resource',
                            resource.getFullyQualifiedIdentifier(),
                            property.getName(),
                            newValue.getFullyQualifiedIdentifier()
                        );
                        resource[property.getName()] = newValue;
                    }
                });
            } else if (Array.isArray(value)) {
                LOG.debug(method, 'Found array property, iterating');
                value.forEach((item, index) => {
                    if (item instanceof Resource) {
                        LOG.debug(method, 'Found array resource property, recursing');
                        result.concat(this.findRelationships(item));
                    } else if (item instanceof Relationship) {
                        LOG.debug(method, 'Found array relationship property');
                        result.push({
                            relationship: item,
                            resolve: (newValue) => {
                                LOG.debug(
                                    method,
                                    'Replacing array relationship property with resolved resource',
                                    resource.getFullyQualifiedIdentifier(),
                                    property.getName(),
                                    index,
                                    newValue.getFullyQualifiedIdentifier()
                                );
                                resource[property.getName()][index] = newValue;
                            }
                        });
                    } else {
                        LOG.debug(method, 'Found array primitive value, ignoring');
                    }
                });
            } else {
                LOG.debug(method, 'Found primitive value, ignoring');
            }
        });
        LOG.exit(method, result);
        return result;
    }

    /**
     * Modify the specified relationship so that for every property on the target
     * resource, a "special" property is added to the relationship with the same
     * name, which when accessed calls the specified callback.
     * @private
     * @param {Relationship} relationship The relationship to modify.
     * @param {function} callback The function to call when the "special" properties
     * are accessed.
     */
    modifyRelationship(relationship, callback) {
        const method = 'modifyRelationship';
        LOG.entry(method, relationship.toString());
        LOG.debug(method, 'Adding hidden $resolved property');
        Object.defineProperty(relationship, '$resolved', {
            enumerable: false,
            configurable: false,
            value: false,
            writable: true
        });
        let classDeclaration = relationship.getClassDeclaration();
        classDeclaration.getProperties().forEach((property) => {
            LOG.debug(method, 'Adding special property', property.getName());
            Object.defineProperty(relationship, property.getName(), {
                enumerable: true,
                configurable: false,
                get: () => {
                    LOG.debug(method, 'Special property accessed', relationship.getFullyQualifiedIdentifier(), property.getName());
                    return callback()
                        .then((resource) => {
                            LOG.debug(method, 'Special property resolved, returning property value', resource.getFullyQualifiedIdentifier(), property.getName());
                            return resource[property.getName()];
                        });
                }
            });
        });
        LOG.exit(method);
    }

    /**
     * Prepare the specified resource so that every relationship in the resource
     * is modified so that if the relationship is accessed, it adds itself to the
     * list of accessed relationships.
     * @private
     * @param {Resource} resource The resource to prepare.
     */
    prepareResource(resource) {
        const method = 'prepareResource';
        LOG.entry(method, resource.toString());

        // Don't prepare an already prepared resource.
        if (resource.hasOwnProperty('$prepared')) {
            LOG.exit(method);
            return;
        }
        Object.defineProperty(resource, '$prepared', {
            enumerable: false,
            configurable: false,
            value: true,
            writable: true
        });

        // Find all the relationships in this resource.
        const foundRelationships = this.findRelationships(resource);

        // Add properties to each relationship.
        foundRelationships.forEach((foundRelationship) => {
            LOG.debug(method, 'Found relationship object', foundRelationship.relationship.toString());
            this.modifyRelationship(foundRelationship.relationship, (name) => {
                LOG.debug('Relationship accessed', foundRelationship.relationship.toString());
                return this.resolver.resolveRelationship(foundRelationship.relationship, {
                    cachedResources: new Map(),
                    skipRecursion: true
                })
                .then((resolvedResource) => {
                    LOG.debug(method, 'Resolved accessed relationship', foundRelationship.relationship.toString());
                    this.prepareResource(resolvedResource);
                    foundRelationship.resolve(resolvedResource);
                    return resolvedResource;
                });
            });
        });

        LOG.exit(method);
    }

}

module.exports = QueryExecutor;
