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

const LOG = Logger.getLog('EngineLogging');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineLogging {

    /**
     * Set the log level for the runtime.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    setLogLevel(context, args) {
        const method = 'setLogLevel';
        LOG.entry(method, context, args);
        if (!args || args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'setLogLevel', ['newLogLevel']));
        }
        if (context.getParticipant() === null) {
            let promise = this.getContainer().getLoggingService().setLogLevel(args[0]);
            return promise ? promise : Promise.resolve();
        }
        throw new Error('Authorization failure');
    }

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
        if (args && args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting no arguments', args, 'getLogLevel'));
        }
        if (context.getParticipant() === null) {
            const curLogLevel = this.getContainer().getLoggingService().getLogLevel();
            LOG.debug(method, 'current log level=' + curLogLevel);
            return Promise.resolve(curLogLevel);
        }
        throw new Error('Authorization failure');
    }
}

module.exports = EngineLogging;
