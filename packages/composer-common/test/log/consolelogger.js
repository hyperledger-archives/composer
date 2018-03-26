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

const ConsoleLogger = require('../../lib/log/consolelogger');


require('chai').should();
const sinon = require('sinon');

describe('ConsoleLogger', () => {

    let sandbox;
    let logger;

    describe('#format', () => {
        let stdout;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            logger = ConsoleLogger.getLogger();
            stdout = sandbox.spy(console, 'log');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should handle no arguments', () => {
            logger.log('debug','func1', 'some msg');
            sinon.assert.calledWith(stdout,'func1 some msg');
        });

        it('should handle basic arguments', () => {
            logger.log('debug','func1', 'some msg', [ 'arg1', 3.142, true, null, undefined ]);
            sinon.assert.calledWith(stdout,'func1 some msg arg1, 3.142, true, null, undefined');
        });

        it('should handle object arguments', () => {
            logger.log('debug','func1', 'some msg', [ { prop1: 'value1' } ]);
            sinon.assert.calledWith(stdout,'func1 some msg {"prop1":"value1"}');
        });

        it('should handle array arguments', () => {
            logger.log('debug','func1', 'some msg', [ [ 'value1', 'value2' ] ]);
            sinon.assert.calledWith(stdout,'func1 some msg ["value1","value2"]');
        });

        it('should handle function arguments', () => {
            const cb = () => { };
            logger.log('debug','func1', 'some msg', [ cb ]);
            sinon.assert.calledWith(stdout,'func1 some msg <function>');
        });

        it('should handle JSON serialization errors', () => {
            const badObject = {
                prop1: 'value1',
                toJSON: () => {
                    throw new Error('mwahahaha');
                }
            };
            logger.log('debug','func1', 'some msg', [ badObject ]);
            sinon.assert.calledWith(stdout,'func1 some msg [object Object]');
        });


    });

    describe('#log', () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            logger = ConsoleLogger.getLogger();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should log debug level', () => {
            const spy = sandbox.spy(console, 'log');
            logger.log('debug', 'func1', 'some msg', [ 'arg1', 'arg2' ]);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'func1 some msg arg1, arg2');
        });

        it('should log warn level', () => {
            const spy = sandbox.spy(console, 'warn');
            logger.log('warn', 'func1', 'some msg', [ 'arg1', 'arg2' ]);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'func1 some msg arg1, arg2');

        });

        it('should log info level', () => {
            const spy = sandbox.spy(console, 'info');
            logger.log('info', 'func1', 'some msg', [ 'arg1', 'arg2' ]);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'func1 some msg arg1, arg2');

        });

        it('should log verbose level', () => {
            const spy = sandbox.spy(console, 'log');
            logger.log('verbose', 'func1', 'some msg', [ 'arg1', 'arg2' ]);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'func1 some msg arg1, arg2');

        });

        it('should log error level', () => {
            const spy = sandbox.spy(console, 'error');
            logger.log('error', 'func1', 'some msg', [ 'arg1', 'arg2' ]);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'func1 some msg arg1, arg2');

        });

    });

});
