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
const Engine = require('composer-runtime').Engine;
const Serializer = require('composer-common').Serializer;
const WebContainer = require('..').WebContainer;
const WebContext = require('..').WebContext;
const WebDataService = require('..').WebDataService;
const WebEventService = require('..').WebEventService;
const WebHTTPService = require('..').WebHTTPService;
const WebIdentityService = require('..').WebIdentityService;
const WebQueryService = require('..').WebQueryService;

require('chai').should();
const sinon = require('sinon');

describe('WebContext', () => {

    let mockWebContainer;
    let mockSerializer;
    let mockEngine;

    beforeEach(() => {
        mockWebContainer = sinon.createStubInstance(WebContainer);
        mockWebContainer.getUUID.returns('d8f08eba-2746-4801-8318-3a7611aed45e');
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockWebContainer);
        mockSerializer = sinon.createStubInstance(Serializer);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container logging service', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.getDataService().should.be.an.instanceOf(WebDataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.getIdentityService().should.be.an.instanceOf(WebIdentityService);
            context.getIdentityService().getCurrentUserID().should.equal('bob1');
        });

    });

    describe('#getEventService', () => {

        it('should return the container event service', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.getSerializer = sinon.stub().returns(mockSerializer);
            context.getEventService().should.be.an.instanceOf(WebEventService);
        });

        it('should return this.eventService if it is set', () => {
            const mockWebEventService = sinon.createStubInstance(WebEventService);
            let context = new WebContext(mockEngine, 'bob1');
            context.eventService = mockWebEventService;
            context.getEventService().should.equal(mockWebEventService);
        });
    });

    describe('#getHTTPService', () => {

        it('should return the container http service', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.getHTTPService().should.be.an.instanceOf(WebHTTPService);
        });

        it('should return this.httpService if it is set', () => {
            const mockWebHTTPService = sinon.createStubInstance(WebHTTPService);
            let context = new WebContext(mockEngine, 'bob1');
            context.httpService = mockWebHTTPService;
            context.getHTTPService().should.equal(mockWebHTTPService);
        });
    });

    describe('#getQueryService', () => {

        it('should return the container query service', () => {
            let context = new WebContext(mockEngine, 'bob1');
            context.getQueryService().should.be.an.instanceOf(WebQueryService);
        });

        it('should return this.queryService if it is set', () => {
            const mockWebQueryService = sinon.createStubInstance(WebQueryService);
            let context = new WebContext(mockEngine, 'bob1');
            context.queryService = mockWebQueryService;
            context.getQueryService().should.equal(mockWebQueryService);
        });
    });

});
