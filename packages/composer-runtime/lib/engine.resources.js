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
        const t0 = Date.now();

        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
        const t0 = Date.now();

        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
            })
            .then((result) => {
                LOG.exit(method, result);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
        const t0 = Date.now();

        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'existsResourceInRegistry', ['registryType', 'registryId', 'resourceId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let resourceId = args[2];
        return context.getRegistryManager().get(registryType, registryId)
            .then((registry) => {
                return registry.exists(resourceId);
            })
            .then((result) => {
                LOG.exit(method, result);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
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
        const t0 = Date.now();

        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
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
        const t0 = Date.now();

        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
            });
    }

}

module.exports = EngineResources;
