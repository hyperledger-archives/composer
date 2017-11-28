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

//const Serializer = require('composer-common').Serializer;
const Context = require('composer-runtime').Context;
const Engine = require('composer-runtime').Engine;
const NodeContainer = require('../lib/nodecontainer');
const NodeContext = require('../lib/nodecontext');
const NodeDataService = require('../lib/nodedataservice');
const NodeEventService = require('../lib/nodeeventservice');
const NodeHTTPService = require('../lib/nodehttpservice');
const NodeIdentityService = require('../lib/nodeidentityservice');

require('chai').should();
const sinon = require('sinon');

describe('NodeContext', () => {

    let mockNodeContainer;
//    let mockSerializer;
    let mockEngine;
    let context;

    let cert = '-----BEGIN CERTIFICATE-----\
MIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\
WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\
U2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\
MBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\
WRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\
rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\
CEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\
XVMHPa0iyC497vdNURA=\
-----END CERTIFICATE-----';
    let mockStub = {
        creator : cert,
        getCreator: () => {
            return mockStub.creator;
        }
    };


    beforeEach(() => {
        mockNodeContainer = sinon.createStubInstance(NodeContainer);
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockNodeContainer);
 //       mockSerializer = sinon.createStubInstance(Serializer);
        context = new NodeContext(mockEngine, mockStub);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container data service', () => {
            context.getDataService().should.be.an.instanceOf(NodeDataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            context.getIdentityService().should.be.an.instanceOf(NodeIdentityService);
            //context.getIdentityService().getIdentifier().should.equal('ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
        });

    });

    describe('#getEventService', () => {

        it('should return the container event service', () => {
            //context.getSerializer = sinon.stub().returns(mockSerializer);
            context.getEventService().should.be.an.instanceOf(NodeEventService);
        });

        it('should return the container event service if it is set', () => {
            const mockNodeEventService = sinon.createStubInstance(NodeEventService);
            context.eventService = mockNodeEventService;
            context.getEventService().should.equal(mockNodeEventService);
        });
    });

    describe('#getHTTPService', () => {

        it('should return the container HTTP service', () => {
            context.getHTTPService().should.be.an.instanceOf(NodeHTTPService);
        });

        it('should return the container HTTP service if it is set', () => {
            const mockNodeHTTPService = sinon.createStubInstance(NodeHTTPService);
            context.httpService = mockNodeHTTPService;
            context.getHTTPService().should.equal(mockNodeHTTPService);
        });
    });

});
