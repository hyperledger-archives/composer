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
const WebSecurityContext = require('../lib/websecuritycontext');

const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();
const sinon = require('sinon');

describe('WebSecurityContext', () => {

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
        securityContext = new WebSecurityContext(mockConnection, identity);
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

        it('should get the current user ID', () => {
            securityContext.getIdentity().should.deep.equal(identity);
        });

    });

    describe('#getNetworkName', () => {

        it('should initially be unset', () => {
            should.not.exist(securityContext.getNetworkName());
        });

    });

    describe('#setNetworkName', () => {

        it('should set the networkName', () => {
            const networkName = 'conga';
            securityContext.setNetworkName(networkName);
            securityContext.getNetworkName().should.equal(networkName);
        });

    });

});
