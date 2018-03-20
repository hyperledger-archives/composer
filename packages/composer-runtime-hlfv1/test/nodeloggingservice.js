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
const Logger = require('composer-common').Logger;
const NodeLoggingService = require('../lib/nodeloggingservice');
const ChaincodeStub = require('fabric-shim/lib/stub');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
let chaiSubset = require('chai-subset');
chai.use(chaiSubset);

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


    describe('#getDefaultCfg', () => {

        it('should return the default values', () => {
            let value = loggingService.getDefaultCfg();
            value.debug.should.equal('composer[error]:*');
        });

        it('should return the default value if the enviroment variable is invalid', () => {
            process.env.CORE_CHAINCODE_LOGGING_LEVEL='wibble';
            let value = loggingService.getDefaultCfg();
            value.debug.should.equal('composer[error]:*');
        });

        it('should map fabric container values to valid composer debug strings', () => {
            process.env.CORE_CHAINCODE_LOGGING_LEVEL='CRITICAL';
            loggingService.getDefaultCfg().debug.should.equal('composer[error]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='ERROR';
            loggingService.getDefaultCfg().debug.should.equal('composer[error]:*');


            process.env.CORE_CHAINCODE_LOGGING_LEVEL='WARNING';
            loggingService.getDefaultCfg().debug.should.equal('composer[warning]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='NOTICE';
            loggingService.getDefaultCfg().debug.should.equal('composer[info]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='INFO';
            loggingService.getDefaultCfg().debug.should.equal('composer[verbose]:*');

            process.env.CORE_CHAINCODE_LOGGING_LEVEL='DEBUG';
            loggingService.getDefaultCfg().debug.should.equal('composer[debug]:*');
        });

    });

    describe('#callback',  () => {

        it('should return warning if no stub',  () => {
            loggingService.stub = undefined;
            loggingService.callback().should.equal('Warning - No stub');
        });

        it('should return the fake tx id', () => {
            loggingService.callback().should.equal('[1548a95f]');
        });

    });


    describe('#getLoggerCfg',async  () => {

        it('should default if nothing in state', async () => {
            loggingService.stub.getState.returns([]);
            let result = await loggingService.getLoggerCfg();
            chai.expect(result).to.containSubset({'origin':'default-runtime-hlfv1'});
        });

        it('should return what was in state',async () => {
            loggingService.stub.getState.returns(JSON.stringify({batman:'hero'}));
            let result = await loggingService.getLoggerCfg();
            chai.expect(result).to.containSubset({batman:'hero'});
        });
        mockStub.getState.returns(JSON.stringify({origin:'default-logger-module'}));
    });

    describe('#initLogging', async  () => {

        it('should default if nothing in state', async () => {
            mockStub.getState.returns(JSON.stringify({batman:'hero'}));
            await loggingService.initLogging(mockStub);

        });

        it('should return what was in state',async () => {
            mockStub.getState.returns(JSON.stringify({origin:'default-logger-module'}));
            await loggingService.initLogging(mockStub);
            (Logger.getCallBack())();
        });

    });
});
