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
const IllegalAclException = require('../../lib/acl/illegalaclexception');
const AclFile = require('../../lib/acl/aclfile');

const should = require('chai').should();
const sinon = require('sinon');


describe('IllegalAclException', function () {

    let aclFile;
    let fileLocation = {start: {column: 1, line: 1}, end: {column: 1, line: 1}};

    beforeEach(function () {
        aclFile = sinon.createStubInstance(AclFile);
        aclFile.getIdentifier.returns('permissions.acl');
    });

    describe('#constructor', function () {

        it('should return an instance of BaseFileException', function () {
            let exc = new IllegalAclException('message', aclFile);
            exc.should.be.an.instanceOf(BaseFileException);
        });

        it('should have a message', function () {
            let exc = new IllegalAclException('message');
            exc.message.should.equal('message');
        });

        it('should have a message including the file location', function () {
            let exc = new IllegalAclException('message', aclFile, fileLocation);
            exc.message.should.match(/message File \'permissions.acl\': line 1 column 1, to line 1 column 1./);
        });

        it('should have a aclFile', function () {
            let exc = new IllegalAclException('message', aclFile);
            exc.getAclFile().should.equal(aclFile);
        });

        it('should not have an aclFile', function () {
            let exc = new IllegalAclException('message');
            should.not.exist(exc.getAclFile());
        });

        it('should have a stack trace', function () {
            let exc = new IllegalAclException('message', aclFile, fileLocation);
            exc.stack.should.be.a('string');
        });

        it('should handle a lack of support for stack traces', function () {
            let captureStackTrace = Error.captureStackTrace;
            Error.captureStackTrace = null;
            try {
                new IllegalAclException('message', aclFile, fileLocation);
            } finally {
                Error.captureStackTrace = captureStackTrace;
            }
        });

    });

});
