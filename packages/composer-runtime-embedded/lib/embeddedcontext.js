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

const Context = require('composer-runtime').Context;
const EmbeddedIdentityService = require('./embeddedidentityservice');
const EmbeddedEventService = require('./embeddedeventservice');

/**
 * A class representing the current request being handled by the JavaScript engine.
 * @protected
 */
class EmbeddedContext extends Context {

    /**
     * Constructor.
     * @param {Engine} engine The owning engine.
     * @param {String} userID The current user ID.
     * @param {EventEmitter} eventSink The event emitter
     */
    constructor(engine, userID, eventSink) {
        super(engine);
        this.dataService = engine.getContainer().getDataService();
        this.identityService = new EmbeddedIdentityService(userID);
        this.eventSink = eventSink;
    }

    /**
     * Get the data service provided by the chaincode container.
     * @return {DataService} The data service provided by the chaincode container.
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Get the identity service provided by the chaincode container.
     * @return {IdentityService} The identity service provided by the chaincode container.
     */
    getIdentityService() {
        return this.identityService;
    }


    /**
     * Get the event service provided by the chaincode container.
     * @return {EventService} The event service provided by the chaincode container.
     */
    getEventService() {
        if (!this.eventService) {
            this.eventService = new EmbeddedEventService(this.eventSink);
        }
        return this.eventService;
    }
}

module.exports = EmbeddedContext;
