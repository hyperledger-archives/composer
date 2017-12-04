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

const Container = require('composer-runtime').Container;
const NodeLoggingService = require('./nodeloggingservice');
const version = require('../package.json').version;
const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeContainer');

/**
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 */
class NodeContainer extends Container {

    /**
     * Constructor.
     */
    constructor() {
        super();
        const method = 'constructor';
        LOG.entry(method);
        this.loggingService = new NodeLoggingService();
        LOG.exit(method);
    }

    /**
     * Get the version of the chaincode container.
     * @return {string} The version of the chaincode container.
     */
    getVersion() {
        const method = 'getVersion';
        LOG.entry(method);
        LOG.exit(method, version);
        return version;

    }

    /**
     * Get the logging service provided by the chaincode container.
     * @return {LoggingService} The logging service provided by the chaincode container.
     */
    getLoggingService() {
        const method = 'getLoggingService';
        LOG.entry(method);
        LOG.exit(method, this.loggingService);
        return this.loggingService;
    }

    /**
     * initialises the logging for this invocation
     * and returns a promise which is resolved once this action is complete
     *
     * @param {any} stub the current stub invocation
     * @returns {Promise} which is resolved when logging has been enabled
     * or rejected if a problem occurs.
     */
    initLogging(stub) {
        const method = 'initLogging';
        LOG.entry(method);
        LOG.exit(method);
        return this.loggingService.initLogging(stub);
    }
}

module.exports = NodeContainer;
