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
const WebLoggingService = require('..').WebLoggingService;

require('chai').should();
const sinon = require('sinon');

describe('WebLoggingService', () => {

    let loggingService;
    let sandbox;

    beforeEach(() => {
        loggingService = new WebLoggingService();
        sandbox = sinon.sandbox.create();
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

        it('should call the console logger', () => {
            sandbox.stub(console, 'error');
            loggingService.logCritical('doge');
            sinon.assert.calledOnce(console.error);
            sinon.assert.calledWith(console.error, 'doge');
        });

    });

    describe('#logDebug', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'debug');
            loggingService.logDebug('doge');
            sinon.assert.notCalled(console.debug);
            // sinon.assert.calledOnce(console.debug);
            // sinon.assert.calledWith(console.debug, 'doge');
        });

    });

    describe('#logError', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'error');
            loggingService.logError('doge');
            sinon.assert.calledOnce(console.error);
            sinon.assert.calledWith(console.error, 'doge');
        });

    });

    describe('#logInfo', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'info');
            loggingService.logInfo('doge');
            sinon.assert.calledOnce(console.info);
            sinon.assert.calledWith(console.info, 'doge');
        });

    });

    describe('#logNotice', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'info');
            loggingService.logNotice('doge');
            sinon.assert.calledOnce(console.info);
            sinon.assert.calledWith(console.info, 'doge');
        });

    });

    describe('#logWarning', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'warn');
            loggingService.logWarning('doge');
            sinon.assert.calledOnce(console.warn);
            sinon.assert.calledWith(console.warn, 'doge');
        });

    });

    describe('#getLoggerCfg', () => {

        it('should call the console logger', () => {
            loggingService.getLoggerCfg();
        });

    });


    describe('#mapCfg', () => {

        it('should return what is sent', () => {
            loggingService.mapCfg('wibble').should.equal('wibble');
        });

    });
});
