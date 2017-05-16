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
const LOG = Logger.getLog('HTTPService');

/**
 * Base class representing the http service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class HTTPService {

    /**
     * Constructor.
     */
    constructor() {
    }

    /**
     * HTTP POST of a typed instance to a URL. The instance is serialized to JSON
     * and the JSON text is in the body of the HTTP POST.
     * @param {string} url - the URL to post data to
     * @param {Object} data - the data to POST
     * @return {Promise} A promise that will be resolved with a {@link HttpResponse}
     */
    post(url,data) {
        const method = 'post';
        LOG.entry(method, data);

        this.url = url;
        this.data = data;

        return new Promise((resolve, reject) => {
            this._post((response) => {
                if(response.statusCode !== 200) {
                    return reject(response);
                }
                else {
                    // TODO (DCS) hack, hack
                    if(response.body && typeof response.body === 'string') {
                        try {
                            response.body = JSON.parse(response.body);
                        }
                        catch(err) {LOG.warning('Not JSON ' + err);}
                    }
                    return resolve(response);
                }
            });
            LOG.exit(method);
        });
    }

    /**
     * Post data
     * @abstract
     * @param {commitCallback} callback The callback function to call when complete.
     */
    _post(callback) {
        throw new Error('abstract function called');
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = HTTPService;
