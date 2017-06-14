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

const LOG = Logger.getLog('EmbeddedEventService');

/**
 * Base class representing the event service provided by a {@link Container}.
 * @protected
 */
class EmbeddedEventService extends EventService {

    /**
     * Constructor.
     * @param {EventEmitter} eventSink the event emitter
     */
    constructor(eventSink) {
        super();
        const method = 'constructor';
        this.eventSink = eventSink;
        LOG.exit(method);
    }

    /**
     * Emit the events stored in eventBuffer
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    transactionCommit() {
        return super.transactionCommit()
            .then(() => {
                const jsonEvent = this.getEvents();
                this.eventSink.emit('events', jsonEvent);
            });
    }

}

module.exports = EmbeddedEventService;
