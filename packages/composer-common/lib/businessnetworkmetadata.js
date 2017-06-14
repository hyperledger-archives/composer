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
 *   <li>package.json</li>
 *   <li>README.md (optional)</li>
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
     * @param {object} packageJson  - the JS object for package.json (required)
     * @param {String} readme  - the README.md for the business network (may be null)
     */
    constructor(packageJson, readme) {
        const method = 'constructor';
        LOG.entry(method, readme);

        if(!packageJson || typeof(packageJson) !== 'object') {
            throw new Error('package.json is required and must be an object');
        }

        const regex = /^[a-z0-9_-]+$/;
        if (!packageJson.name || !regex.test(packageJson.name)) {
            throw new Error ('business network name can only contain lowercase alphanumerics, _ or -');
        }

        this.packageJson = packageJson;

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

    /**
     * Returns the package.json for this business network.
     * @return {object} the Javascript object for package.json
     */
    getPackageJson() {
        return this.packageJson;
    }

    /**
     * Returns the name for this business network.
     * @return {string} the name of the business network
     */
    getName() {
        return this.packageJson.name;
    }

    /**
     * Returns the description for this business network.
     * @return {string} the description of the business network
     */
    getDescription() {
        return this.packageJson.description;
    }

    /**
     * Returns the version for this business network.
     * @return {string} the description of the business network
     */
    getVersion() {
        return this.packageJson.version;
    }

    /**
     * Returns the identifier for this business network, formed from name@version.
     * @return {string} the identifier of the business network
     */
    getIdentifier() {
        return this.packageJson.name + '@' + this.packageJson.version;
    }
}

module.exports = BusinessNetworkMetadata;
