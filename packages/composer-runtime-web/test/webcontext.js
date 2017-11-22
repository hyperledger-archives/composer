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

require('chai').should();
const sinon = require('sinon');

describe('WebContext', () => {

    const identity = {
        identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
        name: 'bob1',
        issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
        secret: 'suchsecret',
        certificate: ''
    };

    let mockWebContainer;
    let mockSerializer;
    let mockEngine;
    let context;

    beforeEach(() => {
        mockWebContainer = sinon.createStubInstance(WebContainer);
        mockWebContainer.getName.returns('d8f08eba-2746-4801-8318-3a7611aed45e');
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockWebContainer);
        mockSerializer = sinon.createStubInstance(Serializer);
        context = new WebContext(mockEngine, identity);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container logging service', () => {
            context.getDataService().should.be.an.instanceOf(WebDataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            context.getIdentityService().should.be.an.instanceOf(WebIdentityService);
            context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
        });

    });

    describe('#getEventService', () => {

        it('should return the container event service', () => {
            context.getSerializer = sinon.stub().returns(mockSerializer);
            context.getEventService().should.be.an.instanceOf(WebEventService);
        });

        it('should return this.eventService if it is set', () => {
            const mockWebEventService = sinon.createStubInstance(WebEventService);
            context.eventService = mockWebEventService;
            context.getEventService().should.equal(mockWebEventService);
        });
    });

    describe('#getHTTPService', () => {

        it('should return the container http service', () => {
            context.getHTTPService().should.be.an.instanceOf(WebHTTPService);
        });

        it('should return this.httpService if it is set', () => {
            const mockWebHTTPService = sinon.createStubInstance(WebHTTPService);
            context.httpService = mockWebHTTPService;
            context.getHTTPService().should.equal(mockWebHTTPService);
        });
    });

});
