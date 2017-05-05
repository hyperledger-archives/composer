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

const EventService = require('composer-runtime').EventService;
const Logger = require('composer-common').Logger;
const EventEmitter = require('events').EventEmitter;

const LOG = Logger.getLog('WebDataService');

/**
 * Base class representing the event service provided by a {@link Container}.
 * @protected
 */
class WebEventService extends EventService {

    /**
     * Constructor.
     * @param {Serializer} serializer Serializer instance.
     */
    constructor(serializer) {
        super(serializer);
        const method = 'constructor';

        this.emitter = this.getEventEmitter();

        LOG.exit(method);
    }

    /**
     * Emit the events stored in eventBuffer
     */
    commit() {
        this.getEventEmitter().emit('composer', this.serializeBuffer());
    }

    /**
     * Gets an eventEmitter instance
     * @return {EventEmitter} EventEmitter instance
     */
    getEventEmitter() {
        if (!this.emitter) {
            return new EventEmitter();
        }
        return this.emitter;
    }
}

module.exports = WebEventService;
