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

const HTTPService = require('composer-runtime').HTTPService;
const Logger = require('composer-common').Logger;
const request = require('request');
const LOG = Logger.getLog('EmbeddedHTTPService');

/**
 * Base class representing the http service provided by a {@link Container}.
 * @protected
 */
class EmbeddedHTTPService extends HTTPService {

    /**
     * Constructor.
     * @param {EventEmitter} eventSink the event emitter
     */
    constructor() {
        super();
        const method = 'constructor';
        LOG.exit(method);
    }

   /**
     * Post data
     * @abstract
     * @return {Promise} A Promise that return the JSON text for the HTTP POST. It captures the status code, header and body of the HTTP POST. The body must also be returned as embedded JSON text.
     * @throws {Error} throws an error if there is an issue
     */
    _post() {
        const self = this;
        return new Promise(function (resolve, reject) {
            request.post(self.url, self.data,
                function (err, resp, body) {
                    resolve( {
                        statusCode: resp.statusCode,
                        body: (err) ? err : body
                    });
                });
        });
    }
}

module.exports = EmbeddedHTTPService;
