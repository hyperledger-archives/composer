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

const Context = require('@ibm/concerto-runtime').Context;
const DataService = require('@ibm/concerto-runtime').DataService;
const Engine = require('@ibm/concerto-runtime').Engine;
const IdentityService = require('@ibm/concerto-runtime').IdentityService;
const WebContainer = require('..').WebContainer;
const WebContext = require('..').WebContext;

require('chai').should();
const sinon = require('sinon');

describe('WebContext', () => {

    let mockWebContainer;
    let mockDataService;
    let mockEngine;

    beforeEach(() => {
        mockWebContainer = sinon.createStubInstance(WebContainer);
        mockDataService = sinon.createStubInstance(DataService);
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockWebContainer);
        mockWebContainer.getDataService.returns(mockDataService);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            let context = new WebContext(mockEngine);
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container logging service', () => {
            let context = new WebContext(mockEngine);
            context.getDataService().should.be.an.instanceOf(DataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new WebContext(mockEngine);
            context.getIdentityService().should.be.an.instanceOf(IdentityService);
        });

    });

});
