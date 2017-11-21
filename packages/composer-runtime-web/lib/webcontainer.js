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
const version = require('../package.json').version;
const WebLoggingService = require('./webloggingservice');

/**
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 */
class WebContainer extends Container {

    /**
     * Constructor.
     * @param {string} [name] The name to use.
     */
    constructor(name) {
        super();
        this.name = name;
        this.loggingService = new WebLoggingService();
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
     * Get the name of the chaincode container.
     * @return {string} The name of the chaincode container.
     */
    getName() {
        return this.name;
    }

}

module.exports = WebContainer;
