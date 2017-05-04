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

const WebEventService = require('..').WebEventService;
const EventEmitter = require('events').EventEmitter;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebEventService', () => {

    let eventService;
    let mockSerializer;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSerializer = sinon.createStubInstance(Serializer);
        eventService = new WebEventService(mockSerializer);
        sinon.stub(EventEmitter);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should assign a default event emitter', () => {
            eventService = new WebEventService(mockSerializer);
            (eventService.emitter instanceof EventEmitter).should.be.true;
        });
    });

    describe('#commit', () => {
        it ('should emit a list of events', () => {
            eventService.serializeBuffer = sinon.stub();
            eventService.serializeBuffer.returns(['serialized JS']);
            eventService.commit();
            sinon.assert.calledOnce(eventService.serializeBuffer);
            sinon.assert.calledOnce(EventEmitter.emit);
            sinon.assert.calledWith(EventEmitter.emit, 'composer', ['serialized JS']);
        });
    });
});
