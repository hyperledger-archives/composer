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

const LOG = Logger.getLog('EmbeddedQueryService');

/**
 * Implementation of QueryService for Node.js  {@link Container}.
 * @protected
 */
class EmbeddedQueryService extends QueryService {

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
     * @param {string} queryString - the native query string
     * @return {Promise} A promise that will be resolved with a JS object containing the results of the query
     */
    queryNative(queryString) {
        const method = 'queryNative';
        LOG.entry(method, queryString);
        this.queryString = queryString;
        LOG.debug(method, queryString);
        // TODO (DCS) - we need an implementation!
        return Promise.resolve({data: 'not implemented'});
    }
}

module.exports = EmbeddedQueryService;
