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

const Container = require('composer-runtime').Container;
const LoggingService = require('composer-runtime').LoggingService;
const NodeContainer = require('../lib/nodecontainer');
const version = require('../package.json').version;
const ChaincodeStub = require('fabric-shim/lib/stub');
require('chai').should();
const sinon = require('sinon');

describe('NodeContainer', () => {

    let sandbox, container,mockStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        container = new NodeContainer();
        mockStub = sinon.createStubInstance(ChaincodeStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should construct a new container', () => {
            container.should.be.an.instanceOf(Container);
        });

    });

    describe('#getVersion', () => {

        it('should return the container version', () => {
            container.getVersion().should.equal(version);
        });

    });

    describe('#getLoggingService', () => {

        it('should return the container logging service', () => {
            container.getLoggingService().should.be.an.instanceOf(LoggingService);
        });
    });


    describe('#getLoggingService', () => {

        it('should return the container logging service',async () => {
            mockStub.getState.returns([]);
            container.loggingService = { initLogging: sinon.stub() };
            await container.initLogging(mockStub);

        });
    });

});
