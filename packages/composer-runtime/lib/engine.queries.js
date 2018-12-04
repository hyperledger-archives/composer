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
const Registry = require('./registry');
const util = require('util');

const LOG = Logger.getLog('EngineQueries');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineQueries {

    /**
     * Execute a query.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    executeQuery(context, args) {
        const method = 'executeQuery';
        LOG.entry(method, context, args);
        const t0 = Date.now();

        if (args.length !== 3) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'executeQuery', ['queryType', 'query', 'parameters']));
        }

        // Process the parameters.
        const queryType = args[0], query = args[1], parametersAsJSON = args[2];
        LOG.debug(method, 'queryType', queryType);

        // Validate the query type.
        if (queryType !== 'build' && queryType !== 'named') {
            throw new Error(util.format('Invalid argument "queryType" with value "%s", expecting "build" or "named"', [queryType]));
        }

        // Build the query if necessary.
        let identifier;
        if (queryType === 'build') {
            identifier = context.getCompiledQueryBundle().buildQuery(query);
        } else {
            identifier = query;
        }

        // Parse the parameters.
        const parameters = JSON.parse(parametersAsJSON);

        // Execute the query.
        const dataService = context.getDataService();
        const serializer = context.getSerializer();
        const accessController = context.getAccessController();
        return context.getCompiledQueryBundle().execute(dataService, identifier, parameters)
            .then((objects) => {
                objects.forEach((object) => {
                    Registry.removeInternalProperties(object);
                });

                if (!context.getAclManager().getAclFile()) {
                    LOG.debug(method, 'No ACL file');
                    return Promise.resolve(objects);
                } else {
                    return objects.reduce((promiseChain, object) => {
                        return promiseChain.then((objects) => {
                            return accessController.check(serializer.fromJSON(object), 'READ')
                                .then(() => {
                                    objects.push(object);
                                    return objects;
                                })
                                .catch((error) => {
                                    return objects;
                                });
                        });
                    }, Promise.resolve([]));
                }
            })
            .then((objects) => {
                LOG.exit(method, objects);
                LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
                return objects;
            });

    }

}

module.exports = EngineQueries;
