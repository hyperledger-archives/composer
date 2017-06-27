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

const LoggingService = require('../lib/loggingservice');

require('chai').should();

describe('LoggingService', () => {

    let loggingService = new LoggingService();

    describe('#logCritical', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logCritical('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logDebug', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logDebug('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logError', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logError('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logInfo', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logInfo('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logNotice', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logNotice('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logWarning', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logWarning('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#setLogLevel', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.setLogLevel('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getLogLevel', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.getLogLevel();
            }).should.throw(/abstract function called/);
        });

    });


});
