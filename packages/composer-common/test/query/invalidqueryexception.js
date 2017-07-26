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

const BaseException = require('../../lib/baseexception');
const InvalidQueryException = require('../../lib/query/invalidqueryexception');
const QueryFile = require('../../lib/query/queryfile');

require('chai').should();
const sinon = require('sinon');


describe('InvalidQueryException', function () {

    let queryFile;
    let fileLocation = {start: {column: 1, line: 1}, end: {column: 1, line: 1}};

    beforeEach(function () {
        queryFile = sinon.createStubInstance(QueryFile);
        queryFile.getIdentifier.returns('queries.qry');
    });

    describe('#constructor', function () {

        it('should return an instance of BaseException', function () {
            let exc = new InvalidQueryException('message', queryFile, fileLocation);
            exc.should.be.an.instanceOf(BaseException);
        });

        it('should have a message', function () {
            let exc = new InvalidQueryException('message', queryFile, fileLocation);
            console.log(exc.message);
            exc.message.should.match(/message File \'queries.qry\': line 1 column 1, to line 1 column 1./);
        });

        it('should have a queryfule', function () {
            let exc = new InvalidQueryException('message', queryFile, fileLocation);
            exc.getQueryFile().should.equal(queryFile);
        });

        it('should have a stack trace', function () {
            let exc = new InvalidQueryException('message', queryFile, fileLocation);
            exc.stack.should.be.a('string');
        });

        it('should handle a lack of support for stack traces', function () {
            let captureStackTrace = Error.captureStackTrace;
            Error.captureStackTrace = null;
            try {
                new InvalidQueryException('message', queryFile, fileLocation);
            } finally {
                Error.captureStackTrace = captureStackTrace;
            }
        });

    });

});
