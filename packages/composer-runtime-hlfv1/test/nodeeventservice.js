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

const NodeEventService = require('../lib/nodeeventservice');
const EventService = require('composer-runtime').EventService;
const ChaincodeStub = require('fabric-shim/lib/stub');


const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('NodeEventService', () => {

    let eventService;
    let sandbox;
    let mockStub;


    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        eventService = new NodeEventService(mockStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should be a type of EventService', () => {
            eventService.should.be.an.instanceOf(EventService);
        });
    });

    describe('#transactionCommit', () => {
        it ('should emit a list of events', async () => {
            sinon.stub(eventService, 'getEvents').returns([{'event':'event'}]);
            await eventService.transactionCommit();
            sinon.assert.calledOnce(eventService.getEvents);
            sinon.assert.calledOnce(mockStub.setEvent);
            sinon.assert.calledWith(mockStub.setEvent, 'composer', Buffer.from('[{"event":"event"}]'));
        });

        it ('should not emit if events is an empty array', async () => {
            sinon.stub(eventService, 'getEvents').returns([]);
            await eventService.transactionCommit();
            sinon.assert.calledOnce(eventService.getEvents);
            sinon.assert.notCalled(mockStub.setEvent);
        });
    });
});
