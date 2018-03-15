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


const LOG = Logger.getLog('EngineLogging');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineLogging {

    /**
     * Get the current log level of the runtime.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    getLogLevel(context, args) {
        const method = 'getLogLevel';
        LOG.entry(method, context, args);

        let dataService = context.getDataService();
        let sysdata;
        let resource;
        return dataService.getCollection('$sysdata')
            .then((result) => {
                sysdata = result;
                return sysdata.get('metanetwork');
            })
            .then((result) => {
                resource = context.getSerializer().fromJSON(result);
                return context.getAccessController().check(resource, 'READ');
            })
            .then(() => {
                let ll = Logger.getLoggerCfg();
                LOG.exit(method,'loglevel',ll);
                return ll;
            });

    }
}

module.exports = EngineLogging;
