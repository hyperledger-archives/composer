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

const LOG = Logger.getLog('EngineBusinessNetworks');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineBusinessNetworks {

    /**
     * Get the business network archive.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async getBusinessNetwork(context, args) {
        const method = 'getBusinessNetwork';
        LOG.entry(method, context, args);

        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'getBusinessNetwork', []));
        }

        await this._assertAccessForOperation(context, 'READ');

        const result = {
            data: context.getBusinessNetworkArchive()
        };
        LOG.exit(method, result);
        return result;
    }

    /**
     * Assert access for operation
     * @param {*} context the context
     * @param {*} operation the operation
     */
    async _assertAccessForOperation(context, operation) {
        const dataService = context.getDataService();
        const sysdata = await dataService.getCollection('$sysdata');
        const metanetwork = await sysdata.get('metanetwork');
        const resource = context.getSerializer().fromJSON(metanetwork);
        await context.getAccessController().check(resource, operation);
    }

}

module.exports = EngineBusinessNetworks;
