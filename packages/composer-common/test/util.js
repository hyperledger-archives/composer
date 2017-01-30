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

const Connection = require('../lib/connection');
const SecurityContext = require('../lib/securitycontext');
const SecurityException = require('../lib/securityexception');
const Util = require('../lib/util');

require('chai').should();
const sinon = require('sinon');

describe('Util', function () {

    let mockConnection;
    let mockSecurityContext;
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        mockConnection = sinon.createStubInstance(Connection);
        mockConnection.invokeChainCode.returns(Promise.resolve());
        mockConnection.queryChainCode.returns(Promise.resolve());
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockSecurityContext.getConnection.returns(mockConnection);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#securityCheck', function () {

        it('should throw for an undefined security context', function () {
            (function () {
                Util.securityCheck(undefined);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for a null security context', function () {
            (function () {
                Util.securityCheck(null);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for an invalid type of security context', function () {
            (function () {
                Util.securityCheck([{}]);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should work for a valid security context', function () {
            Util.securityCheck(mockSecurityContext);
        });

    });

    describe('#queryChainCode', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            return Util
                .queryChainCode(mockSecurityContext, 'init', [])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should throw when functionName is not specified', function () {
            (function () {
                Util.queryChainCode(mockSecurityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw when args is not specified', function () {
            (function () {
                Util.queryChainCode(mockSecurityContext, 'function', null);
            }).should.throw(/args not specified/);
        });

        it('should throw when args contains an invalid value', function () {
            (function () {
                Util.queryChainCode(mockSecurityContext, 'function', [undefined]);
            }).should.throw(/invalid arg specified: undefined/);
        });

        it('should query the chain-code and return the result', function () {
            return Util.queryChainCode(mockSecurityContext, 'function', ['arg1', 'arg2'])
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.queryChainCode);
                    sinon.assert.calledWith(mockConnection.queryChainCode, mockSecurityContext, 'function', ['arg1', 'arg2']);
                });
        });

    });

    describe('#invokeChainCode', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            return Util
                .invokeChainCode(mockSecurityContext, 'init', [])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should throw when functionName is not specified', function () {
            (function () {
                Util.invokeChainCode(mockSecurityContext, null, []);
            }).should.throw(/functionName not specified/);
        });

        it('should throw when args is not specified', function () {
            (function () {
                Util.invokeChainCode(mockSecurityContext, 'function', null);
            }).should.throw(/args not specified/);
        });

        it('should throw when args contains an invalid value', function () {
            (function () {
                Util.invokeChainCode(mockSecurityContext, 'function', [undefined]);
            }).should.throw(/invalid arg specified: undefined/);
        });

        it('should invoke the chain-code and return the result', function () {
            return Util.invokeChainCode(mockSecurityContext, 'function', ['arg1', 'arg2'])
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.invokeChainCode);
                    sinon.assert.calledWith(mockConnection.invokeChainCode, mockSecurityContext, 'function', ['arg1', 'arg2']);
                });
        });

    });

    describe('#isNull', function () {

        it('should return true for undefined', function () {
            Util.isNull(undefined).should.equal(true);
        });

        it('should return true for null', function () {
            Util.isNull(null).should.equal(true);
        });

        it('should return false for anything else', function () {
            Util.isNull('hello').should.equal(false);
        });

    });

});
