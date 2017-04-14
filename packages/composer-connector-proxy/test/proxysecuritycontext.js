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

const ProxyConnection = require('../lib/proxyconnection');
const ProxySecurityContext = require('../lib/proxysecuritycontext');
const SecurityContext = require('composer-common').SecurityContext;

require('chai').should();
const sinon = require('sinon');

describe('ProxySecurityContext', () => {

    let mockProxyConnection;
    let proxySecurityContext;

    beforeEach(() => {
        mockProxyConnection = sinon.createStubInstance(ProxyConnection);
        proxySecurityContext = new ProxySecurityContext(mockProxyConnection, 'alice1', 'aea015ec-3428-45cb-a481-900eadd0ba33');
    });

    describe('#constructor', () => {

        it('should construct a new security context', () => {
            proxySecurityContext.should.be.an.instanceOf(SecurityContext);
        });

    });

    describe('#getUser', () => {

        it('should return the enrollment ID', () => {
            proxySecurityContext.getUser().should.equal('alice1');
        });

    });

    describe('#getSecurityContextID', () => {

        it('should return the security context ID', () => {
            proxySecurityContext.getSecurityContextID().should.equal('aea015ec-3428-45cb-a481-900eadd0ba33');
        });

    });

});
