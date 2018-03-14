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
const LOG = Logger.getLog('NodeEventService');


/**
 * Base class representing the event service provided by a {@link Container}.
 * @protected
 */
class NodeEventService extends EventService {

    /**
     * Creates an instance of NodeEventService.
     * @param {any} stub the stub for this invocation
     */
    constructor(stub) {
        super();
        const method = 'constructor';
        LOG.entry(method, stub);
        this.stub = stub;
        LOG.exit(method);
    }

    /**
     * set the events stored in eventBuffer
     */
    async transactionCommit() {
        const method = 'transactionCommit';
        LOG.entry(method);

        await super.transactionCommit();
        const jsonEvent = this.getEvents();
        if (jsonEvent && jsonEvent.length > 0) {
            this.stub.setEvent('composer', Buffer.from(JSON.stringify(jsonEvent)));
        }
        LOG.exit(method);
    }
}

module.exports = NodeEventService;
