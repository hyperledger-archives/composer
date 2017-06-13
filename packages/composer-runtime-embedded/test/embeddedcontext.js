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
const Engine = require('composer-runtime').Engine;
const EmbeddedContainer = require('..').EmbeddedContainer;
const EmbeddedContext = require('..').EmbeddedContext;
const EmbeddedDataService = require('..').EmbeddedDataService;
const EmbeddedEventService = require('..').EmbeddedEventService;
const EmbeddedHTTPService = require('..').EmbeddedHTTPService;
const EmbeddedQueryService = require('..').EmbeddedQueryService;
const EmbeddedIdentityService = require('..').EmbeddedIdentityService;
const EmbeddedScriptCompiler = require('..').EmbeddedScriptCompiler;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedContext', () => {

    let mockEmbeddedContainer;
    let mockSerializer;
    let mockEngine;

    beforeEach(() => {
        mockEmbeddedContainer = sinon.createStubInstance(EmbeddedContainer);
        mockEmbeddedContainer.getUUID.returns('d8f08eba-2746-4801-8318-3a7611aed45e');
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockEmbeddedContainer);
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
            context.getDataService().should.be.an.instanceOf(EmbeddedDataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getIdentityService().should.be.an.instanceOf(EmbeddedIdentityService);
            context.getIdentityService().getCurrentUserID().should.equal('bob1');
        });

    });

    describe('#getEventService', () => {

        it('should return the container event service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getSerializer = sinon.stub().returns(mockSerializer);
            context.getEventService().should.be.an.instanceOf(EmbeddedEventService);
        });

        it('should return the container event service if it is set', () => {
            const mockEmbeddedEventService = sinon.createStubInstance(EmbeddedEventService);
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.eventService = mockEmbeddedEventService;
            context.getEventService().should.equal(mockEmbeddedEventService);
        });
    });

    describe('#getQueryService', () => {

        it('should return the container query service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getQueryService().should.be.an.instanceOf(EmbeddedQueryService);
        });

        it('should return this.queryService if it is set', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.queryService = {};
            context.getQueryService().should.deep.equal({});
        });

    });

    describe('#getHTTPService', () => {

        it('should return the container HTTP service', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getHTTPService().should.be.an.instanceOf(EmbeddedHTTPService);
        });

        it('should return the container HTTP service if it is set', () => {
            const mockEmbeddedHTTPService = sinon.createStubInstance(EmbeddedHTTPService);
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.httpService = mockEmbeddedHTTPService;
            context.getHTTPService().should.equal(mockEmbeddedHTTPService);
        });
    });

    describe('#getScriptCompiler', () => {

        it('should return the container script compiler', () => {
            let context = new EmbeddedContext(mockEngine, 'bob1');
            context.getScriptCompiler().should.be.an.instanceOf(EmbeddedScriptCompiler);
        });

        it('should return the container script compiler if it is set', () => {
            const mockEmbeddedScriptCompiler = sinon.createStubInstance(EmbeddedScriptCompiler);
            const context = new EmbeddedContext(mockEngine, 'bob1');
            context.scriptCompiler = mockEmbeddedScriptCompiler;
            context.getScriptCompiler().should.equal(mockEmbeddedScriptCompiler);
        });

    });

});
