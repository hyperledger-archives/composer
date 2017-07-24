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

const Logger = require('composer-common').Logger;
const util = require('util');

const LOG = Logger.getLog('EngineResources');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineResources {

    /**
     * Get all resources in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getAllResourcesInRegistry(context, args) {
        const method = 'getAllResourcesInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllResourcesInRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registryManager) => {
                return registryManager.getAll();
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return context.getSerializer().toJSON(resource);
                });
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Get the specified resource in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getResourceInRegistry(context, args) {
        const method = 'getResourceInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getResourceInRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.get(resourceId);
            })
            .then((resource) => {
                return context.getSerializer().toJSON(resource);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Determine whether the specified resource exists in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved with a boolean indicating whether
     * the resource exists in the registry.
     */
    existsResourceInRegistry(context, args) {
        const method = 'existsResourceInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'existsResourceInRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.exists(resourceId);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Add an array of resources to the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addAllResourcesToRegistry(context, args) {
        const method = 'addAllResourcesToRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addAllResourcesToRegistry', ['registryType', 'registryId', 'serializedResources']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResources = JSON.parse(args[2]);
        let resources = serializedResources.map((serializedResource) => {
            return context.getSerializer().fromJSON(serializedResource);
        });
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.addAll(resources);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Add a resource to the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addResourceToRegistry(context, args) {
        const method = 'addResourceToRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addResourceToRegistry', ['registryType', 'registryId', 'serializedResource']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResource = JSON.parse(args[2]);
        let resource = context.getSerializer().fromJSON(serializedResource);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.add(resource);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Update an array of resources in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateAllResourcesInRegistry(context, args) {
        const method = 'updateAllResourcesInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateAllResourcesInRegistry', ['registryType', 'registryId', 'serializedResources']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResources = JSON.parse(args[2]);
        let resources = serializedResources.map((serializedResource) => {
            return context.getSerializer().fromJSON(serializedResource);
        });
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.updateAll(resources);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Update a resource in the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateResourceInRegistry(context, args) {
        const method = 'updateResourceInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'updateResourceInRegistry', ['registryType', 'registryId', 'serializedResource']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let serializedResource = JSON.parse(args[2]);
        let resource = context.getSerializer().fromJSON(serializedResource);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.update(resource);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove an array of resources from the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeAllResourcesFromRegistry(context, args) {
        const method = 'removeAllResourcesFromRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'removeAllResourcesFromRegistry', ['registryType', 'registryId', 'resourceIds']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceIds = JSON.parse(args[2]);
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.removeAll(resourceIds);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove a resource from the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeResourceFromRegistry(context, args) {
        const method = 'removeResourceFromRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'removeResourceFromRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.remove(resourceId);
            })
            .then(() => {
                LOG.exit(method);
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            });
    }

    /**
     * Get all resources in the specified registry, and recursively resolve all
     * their relationships to other resources.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resolveAllResourcesInRegistry(context, args) {
        const method = 'resolveAllResourcesInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'resolveAllResourcesInRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registryManager) => {
                return registryManager.getAll();
            })
            .then((resources) => {
                let resolver = context.getResolver();
                return resources.reduce((result, resource) => {
                    return result.then((resources) => {
                        LOG.debug(method, 'Resolving resource', resource.getFullyQualifiedIdentifier());
                        return resolver.resolve(resource)
                            .then((resolved) => {
                                resources.push(resolved);
                                return resources;
                            });
                    });
                }, Promise.resolve([]));
            })
            .then((resources) => {
                return resources.map((resource) => {
                    return context.getSerializer().toJSON(resource, { permitResourcesForRelationships: true });
                });
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            });
    }

    /**
     * Get the specified resource in the specified registry, and recursively resolve
     * all its relationships to other resources.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    resolveResourceInRegistry(context, args) {
        const method = 'resolveResourceInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'resolveResourceInRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.get(resourceId);
            })
            .then((resource) => {
                let resolver = context.getResolver();
                LOG.debug(method, 'Resolving resource', resource.getFullyQualifiedIdentifier());
                return resolver.resolve(resource);
            })
            .then((resource) => {
                return context.getSerializer().toJSON(resource, { permitResourcesForRelationships: true });
            })
            .then((result) => {
                LOG.exit(method, result);
                return result;
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            });
    }

    /**
     * Query all of the the resources in the specified registry using the given
     * expression, and return all of the resources for which the expression returns
     * a truthy value.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    findResourcesInRegistry(context, args) {
        const method = 'findResourcesInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'findResourcesInRegistry', ['registryType', 'registryId', 'expression']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let expression = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registryManager) => {
                return registryManager.getAll();
            })
            .then((resources) => {
                let queryExecutor = context.getQueryExecutor();
                return queryExecutor.queryAll(expression, resources)
                    .then((queryResults) => {
                        let result = [];
                        queryResults.forEach((queryResult, index) => {
                            let resource = resources[index];
                            LOG.debug(method, 'Checking query results for resource', resource.getFullyQualifiedIdentifier());
                            if (queryResult) {
                                LOG.debug(method, 'Query returned truthy value for resource');
                                result.push(context.getSerializer().toJSON(resource, { convertResourcesToRelationships: true }));
                            } else {
                                LOG.debug(method, 'Query returned falsey value for resource');
                            }
                        });
                        LOG.exit(method, result);
                        return result;
                    });
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            });
    }

    /**
     * Query all of the the resources in the specified registry using the given
     * expression, and return all of the truthy results.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    queryResourcesInRegistry(context, args) {
        const method = 'queryResourcesInRegistry';
        LOG.entry(method, context, args);
        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'queryResourcesInRegistry', ['registryType', 'registryId', 'expression']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let expression = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registryManager) => {
                return registryManager.getAll();
            })
            .then((resources) => {
                let queryExecutor = context.getQueryExecutor();
                return queryExecutor.queryAll(expression, resources)
                    .then((queryResults) => {
                        let result = queryResults.filter((queryResult, index) => {
                            let resource = resources[index];
                            LOG.debug(method, 'Checking query results for resource', resource.getFullyQualifiedIdentifier());
                            if (queryResult) {
                                LOG.debug(method, 'Query returned truthy value for resource');
                                return true;
                            } else {
                                LOG.debug(method, 'Query returned falsey value for resource');
                                return false;
                            }
                        });
                        LOG.exit(method, result);
                        return result;
                    });
            }).catch( (error) => {
                LOG.error(method,'!!!',error);
            });
    }

}

module.exports = EngineResources;
