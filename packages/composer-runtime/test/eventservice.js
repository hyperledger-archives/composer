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

    describe('#eventService', () => {

        it('should call _commit and handle no error', () => {
            sinon.stub(eventService, '_commit').yields(null, {});
            return eventService.commit()
                .then(() => {
                    sinon.assert.calledWith(eventService._commit);
                });
        });


        it('should call _commit and handle an error', () => {
            sinon.stub(eventService, '_commit').yields(new Error('error'));
            return eventService.commit()
                .then((result) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(eventService._commit);
                    error.should.match(/error/);
                });
        });

    });

    describe('#_commit', () => {

        it('should throw as abstract method', () => {
            (() => {
                eventService._commit();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#serializeBuffer', () => {
        it('should return the list of events that are to be comitted', () => {
            let event = {'$class': 'much.wow'};
            eventService.eventBuffer = [ event ];

            eventService.serializeBuffer().should.equal('[{"$class":"much.wow"}]');
        });
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            eventService.toJSON().should.deep.equal({});
        });

    });

});
