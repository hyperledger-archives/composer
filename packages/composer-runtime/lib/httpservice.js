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
const Service = require('./service');

const LOG = Logger.getLog('HTTPService');

/**
 * Base class representing the http service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class HTTPService extends Service {

    /**
     * HTTP POST of a typed instance to a URL. The instance is serialized to JSON
     * and the JSON text is in the body of the HTTP POST.
     * @param {string} url - the URL to post data to
     * @param {Object} data - the data to POST. Data must be an object capable of being converted to a JSON string.
     * @return {Promise} A JS object that captures the statusCode and body of the HTTP POST response. An HTTP status code that is not 200 will cause the Promise to be rejected. The runtime will attempt to convert
     * the body to a JS object using JSON.parse.
     */
    post(url,data) {
        const method = 'post';
        LOG.entry(method, url, data);

        this.url = url;
        this.data = data;

        return this._post()
            .then((responseThing) => {

                let response = null;

                if(typeof responseThing === 'string' ) {
                    response = JSON.parse(responseThing);
                }
                else {
                    response = responseThing;
                }
                LOG.info(method, 'Reponse from URL ' + url, JSON.stringify(response));

                if(response.statusCode >= 200 && response.statusCode < 300) {
                    if(response.body && typeof response.body === 'string') {
                        try {
                            response.body = JSON.parse(response.body);
                        }
                        catch(err) {
                            LOG.warn(method, 'Body data could not be converted to JS object', response.body);
                        }
                    }
                    return Promise.resolve(response);
                }
                else {
                    LOG.error(method, 'Error statusCode ', response.statusCode);
                    return Promise.reject(JSON.stringify(response));
                }
            })
            .then((response) => {
                LOG.exit(method);
                return Promise.resolve(response);
            });
    }

    /**
     * Post data
     * @abstract
     * @return {Promise} A Promise that return the JSON text for the HTTP POST. It captures the status code, header and body of the HTTP POST. The body must also be returned as embedded JSON text.
     * @throws {Error} throws an error if there is an issue
     */
    _post() {
        throw new Error('abstract function called');
    }

}

module.exports = HTTPService;
