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
     * @param {commitCallback} callback The callback function to call when complete.
     */
    _post(callback) {
        request.post( this.url, this.data,
           function (error, response, body) {
               if (!error) {
                   callback( { statusCode : response.statusCode, body: body});
               }
               else {
                   LOG.error('Error performing HTTP POST to ' + this.url, error);
               }
           }
        );
    }
}

module.exports = EmbeddedHTTPService;
