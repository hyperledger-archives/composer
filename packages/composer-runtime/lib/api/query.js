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
 * The Query class represents a built query.
 *
 * Do not attempt to create an instance of this class.
 * You must use the {@link runtime-api#buildQuery buildQuery}
 * method instead.
 *
 * @class Query
 * @summary A query represents a built query.
 * @memberof module:composer-runtime
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

        /**
         * Get the identifier for this built query.
         * @private
         * @method module:composer-runtime.Query#getIdentifier
         * @return {string} The identifier for this built query.
         */
        this.getIdentifier = function getIdentifier() {
            return identifier;
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = Query;