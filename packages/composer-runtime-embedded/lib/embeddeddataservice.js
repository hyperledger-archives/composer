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

const LOG = Logger.getLog('EmbeddedDataService');

// Install the PouchDB plugins. The order of the adapters is important!
PouchDBDataService.registerPouchDBPlugin(require('pouchdb-adapter-memory'));

/**
 * Base class representing the data service provided by a {@link Container}.
 * @protected
 */
class EmbeddedDataService extends PouchDBDataService {

    /**
     * Constructor.
     * @param {string} [uuid] The UUID of the container.
     * @param {boolean} [autocommit] Should this data service auto commit?
     * @param {Object} [additionalConnectorOptions] Additional connector specific options for this transaction.
     */
    constructor(uuid, autocommit, additionalConnectorOptions = {}) {
        super(uuid, autocommit, { adapter: 'memory' }, additionalConnectorOptions);
        const method = 'constructor';
        LOG.entry(method, uuid, autocommit);
        LOG.exit(method);
    }

}

module.exports = EmbeddedDataService;
