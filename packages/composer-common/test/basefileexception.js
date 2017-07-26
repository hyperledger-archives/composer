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

const BaseException = require('../lib/baseexception');
const BaseFileException = require('../lib/basefileexception');

require('chai').should();

describe('BaseFileException', function () {

    describe('#constructor', function () {

        it('should return an instance of BaseFileException', function () {
            let exc = new BaseFileException('message', {start: 1, end: 2}, 'full message');
            exc.should.be.an.instanceOf(BaseException);
        });

        it('should have a fileLocation', function () {
            let exc = new BaseFileException('message', {start: 1, end: 2}, 'full message');
            exc.getFileLocation().should.deep.equal({start: 1, end: 2});
        });

        it('should have a short message', function () {
            let exc = new BaseFileException('message', {start: 1, end: 2}, 'full message');
            exc.getShortMessage().should.equal('message');
        });

        it('should have a stack trace', function () {
            let exc = new BaseFileException('message', {start: 1, end: 2}, 'full message');
            exc.stack.should.be.a('string');
        });

        it('should use message over fullMessage', () => {
            let exc = new BaseFileException('message', {start: 1, end: 2});
            exc.message.should.equal('message');
        });

        it('should handle a lack of support for stack traces', function () {
            let captureStackTrace = Error.captureStackTrace;
            Error.captureStackTrace = null;
            try {
                new BaseFileException('message', {start: 1, end: 2}, 'full message');
            } finally {
                Error.captureStackTrace = captureStackTrace;
            }
        });

    });

});
