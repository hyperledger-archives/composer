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

const LOG = require('../../log/logger').getLog('GitHubModelFileLoader');
const HTTPModelFileLoader = require('./httpmodelfileloader');

/**
 * Loads ModelFiles from an external source, such as a URL.
 *
 * @class
 * @private
 * @memberof module:composer-common
 */
class GitHubModelFileLoader extends HTTPModelFileLoader {
    /**
     * Create the ModelLoader.
     * @param {ModelManager} modelManager - the modelManager for the modelFile
     * @private
     */
    constructor(modelManager) {
        LOG.entry('constructor');
        super(modelManager);
        LOG.exit('constructor');
    }

    /**
     * Returns true if this ModelLoader can process the URL
     * @param {string} url - the URL
     * @return {boolean} true if this ModelLoader accepts the URL
     * @abstract
     */
    accepts(url) {
        return url.startsWith('github://');
    }

    /**
     * Load a ModelFile from a URL and return it
     * @param {string} url - the url to get
     * @param {object} options - additional options
     * @return {Promise} a promise to the ModelFile
     */
    load(url, options) {
        const rewrittenUrl = 'https://raw.githubusercontent.com/' + url.substring(9);
        const result = super.load(rewrittenUrl, options);
        return result;
    }
}

module.exports = GitHubModelFileLoader;
