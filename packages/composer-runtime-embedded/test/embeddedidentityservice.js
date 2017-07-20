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

const IdentityService = require('composer-runtime').IdentityService;
const EmbeddedIdentityService = require('..').EmbeddedIdentityService;

const should = require('chai').should();
const sinon = require('sinon');

describe('EmbeddedIdentityService', () => {

    const identity = {
        identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
        name: 'bob1',
        issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
        secret: 'suchsecret',
        certificate: ''
    };

    let identityService;
    let sandbox;

    beforeEach(() => {
        identityService = new EmbeddedIdentityService(identity);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a identity service', () => {
            identityService.should.be.an.instanceOf(IdentityService);
            identityService.identity.should.equal(identity);
        });

    });

    describe('#constructor', () => {

        it('should create a identity service', () => {
            identityService.should.be.an.instanceOf(IdentityService);
            identityService.identity.should.equal(identity);
        });

    });

    describe('#getIdentifier', () => {

        it('should return the identifier', () => {
            should.equal(identityService.getIdentifier(), 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a');
        });

    });

    describe('#getName', () => {

        it('should return the name', () => {
            should.equal(identityService.getName(), 'bob1');
        });

    });

    describe('#getIssuer', () => {

        it('should return the issuer', () => {
            should.equal(identityService.getIssuer(), 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665');
        });

    });

    describe('#getCertificate', () => {

        it('should return the certificate', () => {
            should.equal(identityService.getCertificate(), '');
        });

    });

});
