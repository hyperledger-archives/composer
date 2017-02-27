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
const sinon = require('sinon');

const should = require('chai').should();

describe('HFCSecurityContext', function () {

    let mockConnection;
    let sandbox;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(HLFConnection);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should store the username and password', function () {
            let securityContext = new HLFSecurityContext(mockConnection);
            should.equal(securityContext.user, null);
        });

    });

    describe('#getUser', function () {

        it('should return the username', function () {
            let securityContext = new HLFSecurityContext(mockConnection);
            securityContext.user = 'doge';
            securityContext.getUser().should.equal('doge');
        });

    });

    describe('#setUser', function () {

        it('should set the username', function () {
            let securityContext = new HLFSecurityContext(mockConnection);
            securityContext.setUser('doge');
            securityContext.user.should.equal('doge');
        });

    });

});
