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
const EventService = require('../lib/eventservice');
const Serializer = require('composer-common').Serializer;

const should = require('chai').should();
require('chai-as-promised');
const sinon = require('sinon');

describe('EventService', () => {

    let mockSerializer;
    let eventService;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(Serializer);
        eventService = new EventService(mockSerializer);
    });

    describe('#constructor', () => {
        it('should have a property for buffering events', () => {
            should.exist(eventService.eventBuffer);
        });
    });

    describe('#emit', () => {
        it('should add the event to the data buffer', () => {
            eventService.emit({});
            eventService.eventBuffer[0].should.deep.equal({});
        });
    });

    describe('#getEvents', () => {
        it('should return the list of events that are to be comitted', () => {
            let event = {'$class': 'much.wow'};
            eventService.eventBuffer = [ event ];

            eventService.getEvents().should.deep.equal([{'$class':'much.wow'}]);
        });
    });

    describe('#transactionStart', () => {
        it ('should clear the list of events', () => {
            eventService.eventBuffer = [ 1, 2, 3 ];
            return eventService.transactionStart(true)
                .then(() => {
                    eventService.eventBuffer.should.deep.equal([]);
                });
        });
    });

});