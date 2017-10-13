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
const EmbeddedLoggingService = require('..').EmbeddedLoggingService;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedLoggingService', () => {

    let loggingService;
    let sandbox;

    beforeEach(() => {
        loggingService = new EmbeddedLoggingService();
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
            loggingService.logCritical('doge');
        });

    });

    describe('#logDebug', () => {

        it('should call the console logger', () => {
            loggingService.logDebug('doge');
        });

    });

    describe('#logError', () => {

        it('should call the console logger', () => {
            loggingService.logError('doge');
        });

    });

    describe('#logInfo', () => {

        it('should call the console logger', () => {
            loggingService.logInfo('doge');
        });

    });

    describe('#logNotice', () => {

        it('should call the console logger', () => {
            loggingService.logNotice('doge');
        });

    });

    describe('#logWarning', () => {

        it('should call the console logger', () => {
            loggingService.logWarning('doge');
        });

    });
    describe('#loglevel', () => {

        it('setLogLevel', () => {
            loggingService.setLogLevel('doge');
            loggingService.getLogLevel().should.equal('doge');
        });
        it('getLogLevel returns default value when no log level set', () => {
            loggingService.getLogLevel().should.equal('UnsetLogLevel');
        });

    });
});
