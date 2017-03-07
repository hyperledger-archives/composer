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

const Logger = require('./log/logger');
const LOG = Logger.getLog('BusinessNetworkMetadata');

/**
 * <p>
 * Defines the metadata for a BusinessNeworkDefinition. This includes:
 * <ul>
 *   <li>README.md</li>
 * </ul>
 * </p>
 * @class
 * @memberof module:composer-common
 */
class BusinessNetworkMetadata {

    /**
     * Create the BusinessNetworkMetadata.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link BusinessNetworkDefinition}</strong>
     * </p>
     * @param {String} readme  - the README.md for the business network
     */
    constructor(readme) {
        const method = 'constructor';
        LOG.entry(method, readme);

        if(readme && typeof(readme) !== 'string') {
            throw new Error('README must be a string');
        }

        this.readme = readme;
        LOG.exit(method);
    }

    /**
     * Returns the README.md for this business network. This may be null if the business network does not have a README.md
     * @return {String} the README.md file for the business network or null
     */
    getREADME() {
        return this.readme;
    }
}

module.exports = BusinessNetworkMetadata;
