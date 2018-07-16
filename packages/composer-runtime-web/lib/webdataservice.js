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

const PouchDBDataService = require('composer-runtime-pouchdb').PouchDBDataService;
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('WebDataService');

// Install the PouchDB plugins. The order of the adapters is important!
PouchDBDataService.registerPouchDBPlugin(require('pouchdb-adapter-idb'));
PouchDBDataService.registerPouchDBPlugin(require('pouchdb-adapter-websql'));

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class WebDataService extends PouchDBDataService {
    /**
     * Get a new data service for storing network (blockchain) data.
     * @param {String} containerName Name of the runtime container.
     * @param {boolean} [autocommit] true if the data service should be auto-commit; otherwise false.
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     * @return {DataService} the data service.
     */
    static newNetworkDataService(containerName, autocommit = false, additionalConnectorOptions = {}) {
        return new WebDataService(containerName, autocommit, additionalConnectorOptions);
    }

    /**
     * Get the top-level Composer data service.
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     * @return {DataService} the data service.
     */
    static newComposerDataService(additionalConnectorOptions = {}) {
        return new WebDataService(null, true, additionalConnectorOptions);
    }

    /**
     * Constructor.
     * @param {string} [uuid] The UUID of the container.
     * @param {boolean} [autocommit] Should this data service auto commit?
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     */
    constructor(uuid, autocommit, additionalConnectorOptions = {}) {
        super(uuid, autocommit, null, additionalConnectorOptions);
        const method = 'constructor';
        LOG.entry(method, uuid, autocommit);
        LOG.exit(method);
    }

}

module.exports = WebDataService;
