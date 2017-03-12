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

const HLFConnection = require('../lib/hlfconnection');
const HLFSecurityContext = require('../lib/hlfsecuritycontext');
const HLFUtil = require('../lib/hlfutil');
const SecurityException = require('composer-common').SecurityException;

require('chai').should();
const sinon = require('sinon');

describe('HLFUtil', () => {

    let mockConnection;
    let securityContext;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockConnection = sinon.createStubInstance(HLFConnection);
        securityContext = new HLFSecurityContext(mockConnection);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#securityCheck', () => {

        it('should throw for an undefined security context', () => {
            (() => {
                HLFUtil.securityCheck(undefined);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for a null security context', () => {
            (() => {
                HLFUtil.securityCheck(null);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should throw for an invalid type of security context', () => {
            (() => {
                HLFUtil.securityCheck([{}]);
            }).should.throw(SecurityException, 'A valid SecurityContext must be specified.');
        });

        it('should work for a valid security context', () => {
            HLFUtil.securityCheck(securityContext);
        });

    });

});
