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

const axios = require('axios');
const LOG = require('../../log/logger').getLog('ModelFileLoader');
const ModelFile = require('../modelfile');
const url = require('url');

/**
 * Loads ModelFiles from an HTTP(S) URL using the axios library.
 * @class
 * @private
 * @memberof module:composer-common
 */
class HTTPModelFileLoader {
    /**
     * Create the ModelLoader.
     * @param {ModelManager} modelManager - the modelManager for the modelFile
     * @private
     */
    constructor(modelManager) {
        LOG.entry('constructor');
        this.modelManager = modelManager;
        LOG.exit('constructor');
    }

    /**
     * Returns true if this ModelLoader can process the URL
     * @param {string} url - the URL
     * @return {boolean} true if this ModelLoader accepts the URL
     * @abstract
     */
    accepts(url) {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    /**
     * Load a ModelFile from a URL and return it
     * @param {string} requestUrl - the url to get
     * @param {object} options - additional options
     * @return {Promise} a promise to the ModelFile
     */
    load(requestUrl, options) {

        if(!options) {
            options = {};
        }

        const request = JSON.parse(JSON.stringify(options));
        request.url = requestUrl;
        request.method = 'get';
        request.responseType = 'text';

        return axios(request)
            .then((response) => {
                let parsedUrl = url.parse(requestUrl);
                // external ModelFiles have a name that starts with '@'
                // (so that they are identified as external when an archive is read back in)
                const name = (parsedUrl.host + parsedUrl.pathname).replace(/\//g, '.');
                return new ModelFile(this.modelManager, response.data, '@' + name);
            });
    }
}

module.exports = HTTPModelFileLoader;
