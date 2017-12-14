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

const LoggingService = require('composer-runtime').LoggingService;
const NodeLoggingService = require('../lib/nodeloggingservice');
const ChaincodeStub = require('fabric-shim/lib/stub');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('NodeLoggingService', () => {

    let loggingService;
    let sandbox, mockStub;


    beforeEach(() => {
        loggingService = new NodeLoggingService();
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        mockStub.getTxID.returns('1548a95f57863bce4566');
        loggingService.stub = mockStub;
        mockStub.putState.resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a logging service', () => {
            loggingService.should.be.an.instanceOf(LoggingService);
        });

    });

});
