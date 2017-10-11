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

const Connection = require('composer-common').Connection;
const SecurityContext = require('composer-common').SecurityContext;
const EmbeddedSecurityContext = require('../lib/embeddedsecuritycontext');

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedSecurityContext', () => {

    const identity = {
        identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
        name: 'bob1',
        issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
        secret: 'suchsecret',
        certificate: ''
    };

    let mockConnection;
    let securityContext;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(Connection);
        securityContext = new EmbeddedSecurityContext(mockConnection, identity);
    });

    describe('#constructor', () => {

        it('should construct a new security context', () => {
            securityContext.should.be.an.instanceOf(SecurityContext);
            securityContext.identity.should.equal(identity);
        });

    });

    describe('#getUser', () => {

        it('should get the current user ID', () => {
            securityContext.getUser().should.equal(identity.name);
        });

    });

    describe('#getIdentity', () => {

        it('should get the current identity', () => {
            securityContext.getIdentity().should.deep.equal(identity);
        });

    });

    describe('#getChaincodeID', () => {

        it('should get the chaincode ID', () => {
            securityContext.chaincodeID = 'ed916d6a-21af-4a2a-a9be-a86f69aa641b';
            securityContext.getChaincodeID().should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

    describe('#setChaincodeID', () => {

        it('should set the chaincode ID', () => {
            securityContext.setChaincodeID('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
            securityContext.chaincodeID.should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

});
