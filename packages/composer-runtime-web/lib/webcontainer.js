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
const uuidv4 = require('uuid');
const version = require('../package.json').version;
const WebDataService = require('./webdataservice');
const WebLoggingService = require('./webloggingservice');
const WebHTTPService = require('./webhttpservice');

/**
 * A class representing the chaincode container hosting the JavaScript engine.
 * @protected
 */
class WebContainer extends Container {

    /**
     * Constructor.
     * @param {string} [uuid] The UUID to use.
     */
    constructor(uuid) {
        super();
        this.uuid = uuid || uuidv4.v4();
        this.dataService = new WebDataService(this.uuid);
        this.loggingService = new WebLoggingService();
        this.httpService = new WebHTTPService();
    }

    /**
     * Get the version of the chaincode container.
     * @return {string} The version of the chaincode container.
     */
    getVersion() {
        return version;
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Get the heep service provided by the chaincode container.
     * @return {HTTPService} The http service provided by the chaincode container.
     */
    getHTTPService() {
        return this.httpService;
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

module.exports = WebContainer;
