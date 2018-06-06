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

    describe('#getLoggerCfg', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.getLoggerCfg();
            }).should.throw(/abstract function called/);
        });

    });
    describe('#setLoggerCfg', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.setLoggerCfg();
            }).should.throw(/abstract function called/);
        });

    });
    describe('#initLogging', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.initLogging();
            }).should.throw(/abstract function called/);
        });

    });
    describe('#callback', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.callback();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#mapCfg', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.mapCfg();
            }).should.throw(/abstract function called/);
        });

    });

});
