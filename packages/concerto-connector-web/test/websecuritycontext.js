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

const Connection = require('@ibm/concerto-common').Connection;
const SecurityContext = require('@ibm/concerto-common').SecurityContext;
const WebSecurityContext = require('../lib/websecuritycontext');

require('chai').should();
const sinon = require('sinon');

describe('WebSecurityContext', () => {

    let mockConnection;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(Connection);
    });

    describe('#constructor', () => {

        it('should construct a new security context', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.should.be.an.instanceOf(SecurityContext);
        });

    });

    describe('#getChaincodeID', () => {

        it('should get the chaincode ID', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.chaincodeID = 'ed916d6a-21af-4a2a-a9be-a86f69aa641b';
            securityContext.getChaincodeID().should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

    describe('#setChaincodeID', () => {

        it('should set the chaincode ID', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.setChaincodeID('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
            securityContext.chaincodeID.should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

});
