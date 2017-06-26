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
const sinon = require('sinon');

require('chai').should();

describe('SecurityContext', function () {

    let mockConnection;
    let sandbox;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(Connection);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should store the connection', function () {
            let securityContext = new SecurityContext(mockConnection);
            securityContext.connection.should.equal(mockConnection);
        });

    });

    describe('#getConnection', function () {

        it('should return the connection', function () {
            let securityContext = new SecurityContext(mockConnection);
            securityContext.getConnection().should.equal(mockConnection);
        });

    });

    describe('#getUser', function () {

        it('should throw as abstract method', function () {
            (() => {
                let securityContext = new SecurityContext(mockConnection);
                securityContext.getUser();
            }).should.throw(/abstract function called/);
        });

    });

});
