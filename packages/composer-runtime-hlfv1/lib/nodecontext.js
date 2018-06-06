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
const NodeDataService = require('./nodedataservice');
const NodeIdentityService = require('./nodeidentityservice');
const NodeEventService = require('./nodeeventservice');
const NodeHTTPService = require('./nodehttpservice');
//const NodeScriptCompiler = require('./nodescriptcompiler');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeContext');


/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 */
class NodeContext extends Context {
    /**
     * Constructor.
     * @param {Engine} engine The owning engine.
     * @param {any} stub the shim instance for this invocation
     * @param {InstalledBusinessNetwork} installedBusinessNetwork installed business network information
     */
    constructor(engine, stub, installedBusinessNetwork) {
        const method = 'constructor';
        LOG.entry(method, engine, stub, installedBusinessNetwork);
        super(engine, installedBusinessNetwork);
        this.stub = stub;
        this.dataService = new NodeDataService(this.stub);
        this.identityService = new NodeIdentityService(this.stub);
        LOG.exit(method);
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        const method = 'getDataService';
        LOG.entry(method);
        LOG.exit(method, this.dataService);
        return this.dataService;
    }

    /**
     * Get the identity service provided by the chaincode container.
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        const method = 'getDataService';
        LOG.entry(method);
        LOG.exit(method, this.identityService);
        return this.identityService;
    }


    /**
     * Get the event service provided by the chaincode container.
     * @return {EventService} The event service provided by the chaincode container.
     */
    getEventService() {
        const method = 'getEventService';
        LOG.entry(method);

        if (!this.eventService) {
            this.eventService = new NodeEventService(this.stub);
        }

        LOG.exit(method, this.eventService);
        return this.eventService;
    }

    /**
     * Get the event service provided by the chaincode container.
     * @return {EventService} The event service provided by the chaincode container.
     */
    getHTTPService() {
        const method = 'getHTTPService';
        LOG.entry(method);

        if (!this.httpService) {
            this.httpService = new NodeHTTPService(this.stub);
        }

        LOG.exit(method, this.httpService);
        return this.httpService;
    }

    /**
     * Get the native fabric api
     * @returns {FabricChainCodeStub} The chain code stub to access the fabric api
     */
    getNativeAPI() {
        const method = 'getNativeAPI';
        LOG.entry(method);
        LOG.exit(method, this.stub);
        return this.stub;
    }
}

module.exports = NodeContext;
