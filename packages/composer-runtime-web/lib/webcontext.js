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

const Context = require('composer-runtime').Context;
const WebDataService = require('./webdataservice');
const WebIdentityService = require('./webidentityservice');
const WebHTTPService = require('./webhttpservice');
const WebEventService = require('./webeventservice');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 */
class WebContext extends Context {

    /**
     * Constructor.
     * @param {Engine} engine The owning engine.
     * @param {InstalledBusinessNetwork} installedBusinessNetwork Information on the installed business network.
     * @param {Object} identity The current identity.
     * @param {EventEmitter} eventSink The event emitter
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     */
    constructor(engine, installedBusinessNetwork, identity, eventSink, additionalConnectorOptions = {}) {
        super(engine, installedBusinessNetwork);
        this.dataService = WebDataService.newNetworkDataService(engine.getContainer().getName(), false, additionalConnectorOptions);
        this.identityService = new WebIdentityService(identity);
        this.eventSink = eventSink;
        this.additionalConnectorOptions = additionalConnectorOptions;
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Get the identity service provided by the chaincode container.
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        return this.identityService;
    }

    /**
     * Get the event service provided by the chaincode container.
     * @return {EventService} The event service provided by the chaincode container.
     */
    getEventService() {
        if (!this.eventService) {
            this.eventService = new WebEventService(this.eventSink);
        }
        return this.eventService;
    }

    /**
     * Get the http service provided by the chaincode container.
     * @return {HTTPService} The http service provided by the chaincode container.
     */
    getHTTPService() {
        if (!this.httpService) {
            this.httpService = new WebHTTPService();
        }
        return this.httpService;
    }

    /**
     * Get the native api
     */
    getNativeAPI() {
        throw new Error('Native API not available in web runtime');
    }

}

module.exports = WebContext;
