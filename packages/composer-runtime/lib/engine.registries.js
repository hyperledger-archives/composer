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

const LOG = Logger.getLog('EngineRegistries');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineRegistries {

    /**
     * Get all registries.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getAllRegistries(context, args) {
        const method = 'getAllRegistries';
        LOG.entry(method, context, args);
        const t0 = Date.now();

        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getAllRegistries', ['registryType','includeSystem']));
        }
        let registryType = args[0];
        let includeSystem = (args[1] === 'true');
        return context.getRegistryManager().getAll(registryType,includeSystem)
            .then((result) => {
                LOG.exit(method, result);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
            });
    }

    /**
     * Get the specified registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getRegistry(context, args) {
        const method = 'getRegistry';
        LOG.entry(method, context, args);
        const t0 = Date.now();

        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().get(registryType, registryId)
            .then((result) => {
                LOG.exit(method, result);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
            });
    }

    /**
     * Determine whether an asset registry exists.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved with a boolean indicating
     * whether the asset registry exists.
     */
    existsRegistry(context, args) {
        const method = 'existsRegistry';
        LOG.entry(method, context, args);
        const t0 = Date.now();

        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'existsRegistry', ['registryType', 'registryId']));
        }
        let registryType = args[0];
        let registryId = args[1];
        return context.getRegistryManager().exists(registryType, registryId)
            .then((result) => {
                LOG.exit(method, result);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return result;
            });
    }

    /**
     * Add a new registry.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addRegistry(context, args) {
        const method = 'addRegistry';
        LOG.entry(method, context, args);
        const t0 = Date.now();

        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'addRegistry', ['registryType', 'registryId', 'registryName']));
        }
        let registryType = args[0];
        let registryId = args[1];
        let registryName = args[2];
        LOG.debug(method,'Adding registry',registryType,registryId,registryName);
        return context.getRegistryManager().add(registryType, registryId, registryName)
            .then(() => {
                LOG.exit(method);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            });
    }

}

module.exports = EngineRegistries;
