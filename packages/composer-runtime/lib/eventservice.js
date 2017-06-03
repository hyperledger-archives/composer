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

const LOG = Logger.getLog('EventService');

/**
 * Base class representing the event service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class EventService extends Service {

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.eventBuffer = [];
    }

    /**
     * Add an event to the buffer
     * @param {Resource} event The event to be emitted
     * when complete, or rejected with an error.
     */
    emit(event) {
        const method = 'emit';
        LOG.entry(method, event);
        this.eventBuffer.push(event);
        LOG.debug(method, this.eventBuffer);
        LOG.exit(method);
    }

    /**
     * Emit all buffered events
     * @abstract
     * @return {Promise} A promise that will be resolved with a {@link DataCollection}
     */
    commit() {
        return new Promise((resolve, reject) => {
            this._commit((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * Emit all buffered events
     * @abstract
     *
     * @param {commitCallback} callback The callback function to call when complete.
     */
    _commit(callback) {
        throw new Error('abstract function called');
    }

    /**
     *  Get an array of events as a string
     * @return {String} - An array of serialized events
     */
    serializeBuffer() {
        const method = 'serializeBuffer';
        LOG.entry(method);
        LOG.exit(method, this.eventBuffer);
        return JSON.stringify(this.eventBuffer);
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

module.exports = EventService;
