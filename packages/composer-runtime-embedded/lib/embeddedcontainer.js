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
const EmbeddedLoggingService = require('./embeddedloggingservice');
const uuid = require('uuid');
const version = require('../package.json').version;

/**
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 */
class EmbeddedContainer extends Container {

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.uuid = uuid.v4();
        this.loggingService = new EmbeddedLoggingService();
    }

    /**
     * Get the version of the chaincode container.
     * @return {string} The version of the chaincode container.
     */
    getVersion() {
        return version;
    }

    /**
     * Get the logging service provided by the chaincode container.
     * @return {LoggingService} The logging service provided by the chaincode container.
     */
    getLoggingService() {
        return this.loggingService;
    }

    /**
     * Get the UUID of the chaincode container.
     * @return {string} The UUID of the chaincode container.
     */
    getUUID() {
        return this.uuid;
    }

}

module.exports = EmbeddedContainer;
