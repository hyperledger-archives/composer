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

const QueryService = require('composer-runtime').QueryService;
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('WebQueryService');

/**
 * Implementation of QueryService for the web browser  {@link Container}.
 * @protected
 */
class WebQueryService extends QueryService {

    /**
     * Constructor.
     *
     */
    constructor() {
        super();
        const method = 'constructor';
        LOG.exit(method);
    }

    /**
     * Query the underlying world-state store using a store native query string.
     * @abstract
     * @param {string} queryString - the native query string
     * @return {Promise} A promise that will be resolved with a JS object containing the results of the query
     */
    queryNative(queryString) {
        throw new Error('The native query functionality is not available on this Blockchain platform');
    }
}

module.exports = WebQueryService;
