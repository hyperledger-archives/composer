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
const MockStub = require('./mockstub');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('NodeLoggingService', () => {

    let loggingService;
    let sandbox, mockStub;
    let outputStub;

    beforeEach(() => {
        loggingService = new NodeLoggingService();
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(MockStub);
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

    describe('#logCritical', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger and log', () => {
            loggingService.currentLogLevel = 500;  //debug level
            loggingService.logCritical('doge1');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge1');

            loggingService.currentLogLevel = 0;  //critical
            loggingService.logCritical('doge');
            sinon.assert.calledTwice(outputStub);
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = -1;  //off
            loggingService.logCritical('doge');
            sinon.assert.notCalled(outputStub);
        });

    });

    describe('#logDebug', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger', () => {
            loggingService.currentLogLevel = 500;  // debug
            loggingService.logDebug('doge2');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge2');
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = 400; // info
            loggingService.logDebug('doge');
            sinon.assert.notCalled(outputStub);
        });


    });

    describe('#logError', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger', () => {
            loggingService.currentLogLevel = 500; //debug
            loggingService.logError('doge3');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge3');

            loggingService.currentLogLevel = 100; //error
            loggingService.logError('doge');
            sinon.assert.calledTwice(outputStub);
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = 0; // critical
            loggingService.logError('doge');
            sinon.assert.notCalled(outputStub);
        });

    });

    describe('#logInfo', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger', () => {
            loggingService.currentLogLevel = 500; //debug
            loggingService.logInfo('doge4');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge4');

            loggingService.currentLogLevel = 400; //info
            loggingService.logInfo('doge');
            sinon.assert.calledTwice(outputStub);
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = 300; //notice
            loggingService.logInfo('doge');
            sinon.assert.notCalled(outputStub);
        });

    });

    describe('#logNotice', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger', () => {
            loggingService.currentLogLevel = 500;  //debug
            loggingService.logNotice('doge5');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge5');

            loggingService.currentLogLevel = 300;  //notice
            loggingService.logNotice('doge');
            sinon.assert.calledTwice(outputStub);
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = 200;  // warning
            loggingService.logNotice('doge');
            sinon.assert.notCalled(outputStub);
        });

    });

    describe('#logWarning', () => {
        beforeEach(() => {
            outputStub = sinon.stub(loggingService, '_outputMessage');
        });

        it('should call the console logger', () => {
            loggingService.currentLogLevel = 500;  //debug
            loggingService.logWarning('doge6');
            sinon.assert.calledOnce(outputStub);
            sinon.assert.calledWith(outputStub, 'doge6');

            loggingService.currentLogLevel = 200;  //warning
            loggingService.logWarning('doge');
            sinon.assert.calledTwice(outputStub);
        });

        it('should call the console logger but not log', () => {
            loggingService.currentLogLevel = 100; //error
            loggingService.logInfo('doge');
            sinon.assert.notCalled(outputStub);
        });


    });

    describe('#initLogging', () => {

        it('should init logging if not init', () => {
            let enableStub = sinon.stub(loggingService, '_enableLogging').resolves();
            return loggingService.initLogging(mockStub)
                .then(() => {
                    sinon.assert.calledOnce(enableStub);
                });
        });

        it('should no-op if logging already enabled', () => {
            let enableStub = sinon.stub(loggingService, '_enableLogging').resolves();
            loggingService.currentLogLevel = 100;
            return loggingService.initLogging(mockStub)
                .then(() => {
                    sinon.assert.notCalled(enableStub);
                });
        });

    });


    describe('#_enableLogging', () => {

        it('should get logging level from world state', () => {
            mockStub.getState.resolves('WARNING');
            return loggingService._enableLogging()
                .then(() => {
                    loggingService.currentLogLevel.should.equal(200);
                });
        });

        it('should get logging level from env', () => {
            mockStub.getState.resolves('');
            process.env.CORE_CHAINCODE_LOGGING_LEVEL = 'DEBUG';
            return loggingService._enableLogging()
            .then(() => {
                loggingService.currentLogLevel.should.equal(500);
                delete process.env.CORE_CHAINCODE_LOGGING_LEVEL;
            });
        });

        it('should default to INFO if no other source', () => {
            mockStub.getState.resolves('');
            return loggingService._enableLogging()
                .then(() => {
                    loggingService.currentLogLevel.should.equal(400);
                });
        });

        it('should default to INFO if getState returns unknown log level', () => {
            mockStub.getState.resolves('ALEVEL');
            return loggingService._enableLogging()
                .then(() => {
                    loggingService.currentLogLevel.should.equal(400);
                });
        });

        it('should default to INFO if env returns unknown log level', () => {
            mockStub.getState.resolves('');
            process.env.CORE_CHAINCODE_LOGGING_LEVEL = 'ALEVEL';
            return loggingService._enableLogging()
            .then(() => {
                loggingService.currentLogLevel.should.equal(400);
                delete process.env.CORE_CHAINCODE_LOGGING_LEVEL;
            });
        });

        it('should default to INFO if getState returns an error', () => {
            mockStub.getState.rejects(new Error('an error'));
            return loggingService._enableLogging()
            .then(() => {
                loggingService.currentLogLevel.should.equal(400);
            });
        });

    });

    describe('#setLogLevel', () => {
        it('should set the log level', () => {
            mockStub.putState.resolves();
            loggingService.setLogLevel('notice')
                .then(() => {
                    loggingService.currentLogLevel.should.equal(300);
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'ComposerLogLevel', 'NOTICE');
                });
        });

        it('should throw error if putState fails', () => {
            mockStub.putState.rejects(new Error('put failed'));
            loggingService.setLogLevel('notice')
                .should.be.rejectedWith(/put failed/);
        });

        it('should throw error if not a valid log level', () => {
            loggingService.setLogLevel('rubbish')
                .should.be.rejectedWith(/not a valid/);
        });



    });

    describe('#getLogLevel', () => {

        it('should return correct log level string', () => {

            loggingService.currentLogLevel = -1;
            loggingService.getLogLevel().should.equal('NOT_ENABLED');
            loggingService.currentLogLevel = 0;
            loggingService.getLogLevel().should.equal('CRITICAL');
            loggingService.currentLogLevel = 100;
            loggingService.getLogLevel().should.equal('ERROR');
            loggingService.currentLogLevel = 200;
            loggingService.getLogLevel().should.equal('WARNING');
            loggingService.currentLogLevel = 300;
            loggingService.getLogLevel().should.equal('NOTICE');
            loggingService.currentLogLevel = 400;
            loggingService.getLogLevel().should.equal('INFO');
            loggingService.currentLogLevel = 500;
            loggingService.getLogLevel().should.equal('DEBUG');

        });

    });

    describe('#_outputMessage', () => {

        it('should output a message', () => {
            loggingService._outputMessage();
        });
    });
});
