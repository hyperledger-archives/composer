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
const NodeIdentityService = require('../lib/nodeidentityservice');

const should = require('chai').should();
const sinon = require('sinon');

describe('NodeIdentityService', () => {


    // creator looks like
    // { mspid: 'Org1MSP',
    //   id_bytes: ByteBuffer object}
    let identityService;
    let sandbox;
    let cert = '-----BEGIN CERTIFICATE-----\
MIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\
WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\
U2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\
MBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\
WRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\
rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\
CEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\
XVMHPa0iyC497vdNURA=\
-----END CERTIFICATE-----';

    let stub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        stub = {
            _badCert: false,
            creator: {
                getIdBytes: () => {
                    if (stub._badCert) {
                        return 'This is not a cert';
                    }
                    return cert;
                }
            },
            getCreator: () => {
                return stub.creator;
            }
        };
        identityService = new NodeIdentityService(stub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a identity service', () => {
            identityService.should.be.an.instanceOf(IdentityService);
        });

    });

    describe('#getIdentifier', () => {

        it('should return the identifier', () => {
            should.equal(identityService.getIdentifier(), '2be26f6d4757b49fbae46f9fbb0c225b2f77508a882e4dd899700b56f62ad639');
            // test it again to see if we still get the same results
            should.equal(identityService.getIdentifier(), '2be26f6d4757b49fbae46f9fbb0c225b2f77508a882e4dd899700b56f62ad639');
        });

    });

    describe('#getName', () => {

        it('should return the name', () => {
            should.equal(identityService.getName(), 'Admin@org1.example.com');
            // test it again to see if we still get the same results
            should.equal(identityService.getName(), 'Admin@org1.example.com');
        });

    });

    describe('#getIssuer', () => {

        it('should return the issuer', () => {
            should.equal(identityService.getIssuer(), '5c190e9b33a76439b267695599e4af13011540535cf7560b68f323f7fc3bd24e');
            // test it again to see if we still get the same results
            should.equal(identityService.getIssuer(), '5c190e9b33a76439b267695599e4af13011540535cf7560b68f323f7fc3bd24e');
        });

    });

    describe('#getCertificate', () => {

        it('should return the certificate', () => {
            should.equal(identityService.getCertificate(), cert);
            // test it again to see if we still get the same results
            should.equal(identityService.getCertificate(), cert);
        });

        it('should throw an error if not a cert', () => {
            stub._badCert = true;
            (() => {
                identityService.getCertificate();
            })
            .should.throw(/not a valid/);
        });

    });

});
