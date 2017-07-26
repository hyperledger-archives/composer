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
const IllegalModelException = require('../../lib/introspect/illegalmodelexception');
const ModelFile = require('../../lib/introspect/modelfile');

require('chai').should();
const sinon = require('sinon');


describe('IllegalModelException', function () {

    let modelFile;
    let fileLocation = {start: {column: 1, line: 1}, end: {column: 1, line: 1}};

    beforeEach(function () {
        modelFile = sinon.createStubInstance(ModelFile);
        modelFile.getName.returns('model.cto');
    });

    describe('#constructor', function () {

        it('should return an instance of BaseFileException', function () {
            let exc = new IllegalModelException('message', modelFile, fileLocation);
            exc.should.be.an.instanceOf(BaseFileException);
        });

        it('should have a message', function () {
            let exc = new IllegalModelException('message', modelFile, fileLocation);
            exc.message.should.match(/message File \'model.cto\': line 1 column 1, to line 1 column 1./);
        });

        it('should have a modelfile', function () {
            let exc = new IllegalModelException('message', modelFile, fileLocation);
            exc.getModelFile().should.equal(modelFile);
        });

        it('should have a stack trace', function () {
            let exc = new IllegalModelException('message', modelFile, fileLocation);
            exc.stack.should.be.a('string');
        });

        it('should handle a lack of support for stack traces', function () {
            let captureStackTrace = Error.captureStackTrace;
            Error.captureStackTrace = null;
            try {
                new IllegalModelException('message', modelFile, fileLocation);
            } finally {
                Error.captureStackTrace = captureStackTrace;
            }
        });

    });

});
