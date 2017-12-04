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

const BaseFileException = require('../../lib/basefileexception');
const ParseException = require('../../lib/introspect/parseexception');

require('chai').should();


describe('ParseException', function () {

    let fileLocation = {start: {column: 1, line: 1}, end: {column: 1, line: 1}};

    describe('#constructor', function () {

        it('should return an instance of BaseFileException', function () {
            let exc = new ParseException('message', fileLocation);
            exc.should.be.an.instanceOf(BaseFileException);
        });

        it('should cope without an file location or file name', function () {
            let exc = new ParseException('message', null);
            exc.message.should.not.be.null;
        });

        it('should have a message with a file location', function () {
            let exc = new ParseException('message', fileLocation);
            exc.message.should.match(/message Line 1 column 1/);
        });

        it('should have a message with a file name', function () {
            let exc = new ParseException('message', null, 'foo.cto');
            exc.message.should.match(/message File foo.cto/);
        });

        it('should have a message with a file location and file name', function () {
            let exc = new ParseException('message', fileLocation, 'foo.cto');
            exc.message.should.match(/message File foo.cto line 1 column 1/);
        });

        it('should have a stack trace', function () {
            let exc = new ParseException('message', fileLocation);
            exc.stack.should.be.a('string');
        });

        it('should handle a lack of support for stack traces', function () {
            let captureStackTrace = Error.captureStackTrace;
            Error.captureStackTrace = null;
            try {
                new ParseException('message', fileLocation);
            } finally {
                Error.captureStackTrace = captureStackTrace;
            }
        });

    });

});
