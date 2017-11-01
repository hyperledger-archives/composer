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

const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('Query');

/**
 * The Query class represents a built query. A built query has been parsed and validated.
 * Do not attempt to create an instance of this class.<br>
 * You must use the {@link client-BusinessNetworkConnection#buildQuery buildQuery}
 * method instead.
 *
 * @class Query
 * @classdesc A query represents a built query.
 * @memberof module:composer-client
 * @public
 */
class Query {

    /**
     * Constructor.
     * @param {string} identifier The identifier of the built query.
     * @private
     */
    constructor(identifier) {
        const method = 'constructor';
        LOG.entry(method, identifier);
        this.identifier = identifier;
        LOG.exit(method);
    }

    /**
     * Get the identifier for this built query.
     * @private
     * @return {string} The identifier for this built query.
     */
    getIdentifier() {
        return this.identifier;
    }

}

module.exports = Query;
