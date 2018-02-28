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

const Certificate = require('../lib/certificate');

require('chai').should();

describe('Certificate', () => {

    const pem = '-----BEGIN CERTIFICATE-----\r\n' +
    'MIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\r\n' +
    'MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\r\n' +
    'cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\r\n' +
    'Lm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\r\n' +
    'WjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\r\n' +
    'U2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\r\n' +
    'MBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\r\n' +
    'WRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\r\n' +
    'A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\r\n' +
    'rRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\r\n' +
    'CEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\r\n' +
    'XVMHPa0iyC497vdNURA=\r\n' +
    '-----END CERTIFICATE-----\r\n';

    const publicKey = '-----BEGIN PUBLIC KEY-----\r\n' +
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEa7wrEFDUaTFJMxWgu/s1eJgpaPm3\r\n' +
    'oOFZFMkEecuRZXuVFR9hooAoVp1KKLkztntmnAPw1Lsiwx09HpngTIaDAg==\r\n' +
    '-----END PUBLIC KEY-----\r\n';

    let certificate;

    beforeEach(() => {
        certificate = new Certificate(pem);
    });

    describe('#getCertificate', () => {

        it('should return the PEM encoded certificate', () => {
            certificate.getCertificate().should.equal(pem);
        });

    });

    describe('#getPublicKey', () => {

        it('should return the PEM encoded public key', () => {
            certificate.getPublicKey().should.equal(publicKey);
        });

    });

    describe('#getIdentifier', () => {

        it('should return the unique identifier', () => {
            certificate.getIdentifier().should.equal('114aab0e76bf0c78308f89efc4b8c9423e31568da0c340ca187a9b17aa9a4457');
        });

    });

    describe('#getIssuer', () => {

        it('should return the issuer', () => {
            certificate.getIssuer().should.equal('ac3dbcbe135ba48b29f97665bb103f8260c38d3872473e584314392797c595f3');
        });

    });

    describe('#getName', () => {

        it('should return the name', () => {
            certificate.getName().should.equal('Admin@org1.example.com');
        });

    });

});