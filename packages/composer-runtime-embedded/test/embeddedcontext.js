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

const Serializer = require('composer-common').Serializer;
const Context = require('composer-runtime').Context;
const DataService = require('composer-runtime').DataService;
const Engine = require('composer-runtime').Engine;
const EmbeddedContainer = require('..').EmbeddedContainer;
const EmbeddedContext = require('..').EmbeddedContext;
const IdentityService = require('composer-runtime').IdentityService;
const EventService = require('composer-runtime').EventService;
const HTTPService = require('composer-runtime').HTTPService;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedContext', () => {

    let mockEmbeddedContainer;
    let mockDataService;
    let mockSerializer;
    let mockEngine;

    beforeEach(() => {
        mockEmbeddedContainer = sinon.createStubInstance(EmbeddedContainer);
        mockDataService = sinon.createStubInstance(DataService);
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockEmbeddedContainer);
        mockEmbeddedContainer.getDataService.returns(mockDataService);
        mockSerializer = sinon.createStubInstance(Serializer);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container data service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getDataService().should.be.an.instanceOf(DataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getIdentityService().should.be.an.instanceOf(IdentityService);
            context.getIdentityService().getCurrentUserID().should.equal('bob1');
        });

    });

    describe('#getEventService', () => {

        it('should return the container event service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getSerializer = sinon.stub().returns(mockSerializer);
            context.getEventService().should.be.an.instanceOf(EventService);
        });

        it('should return this.eventService if it is set', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.eventService = {};
            context.getEventService().should.deep.equal({});
        });
    });

    describe('#getHTTPService', () => {

        it('should return the container http service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getHTTPService().should.be.an.instanceOf(HTTPService);
        });

        it('should return this.httpService if it is set', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.httpService = {};
            context.getHTTPService().should.deep.equal({});
        });
    });

});
