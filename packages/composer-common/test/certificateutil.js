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

const CertificateUtil = require('../lib/certificateutil');
const { KEYUTIL, KJUR, X509 } = require('jsrsasign');
const uuid = require('uuid');

require('chai').should();

describe('CertificateUtil', () => {

    describe('#generate', () => {

        it('should generate a certificate for the specified common name', () => {
            const commonName = 'doge:' + uuid.v4();
            let { privateKey, publicKey, certificate } = CertificateUtil.generate({ commonName });
            const privateKeyObj = KEYUTIL.getKey(privateKey);
            KEYUTIL.getPEM(privateKeyObj, 'PKCS8PRV').should.equal(privateKey);
            const publicKeyObj = KEYUTIL.getKey(publicKey);
            KEYUTIL.getPEM(publicKeyObj).should.equal(publicKey);
            const certificateObj = new X509();
            certificateObj.readCertPEM(certificate);
            certificateObj.getSubjectString().should.equal(`/CN=${commonName}`);
            certificateObj.getIssuerString().should.equal('/O=org1.example.com');
            const publicKeyFingerprint = KJUR.crypto.Util.hashHex(publicKeyObj.pubKeyHex, 'sha256');
            const certificateFingerprint = KJUR.crypto.Util.hashHex(certificateObj.getPublicKey().pubKeyHex, 'sha256');
            publicKeyFingerprint.should.equal(certificateFingerprint);
        });

        it('should throw if no options specified', () => {
            (() => {
                CertificateUtil.generate();
            }).should.throw(/commonName not specified/);
        });

        it('should throw if common name is not specified', () => {
            (() => {
                CertificateUtil.generate({});
            }).should.throw(/commonName not specified/);
        });

        it('should generate a certificate for the specified organization', () => {
            const commonName = 'doge:' + uuid.v4();
            const organization = 'dogeorg:' + uuid.v4();
            let { privateKey, publicKey, certificate } = CertificateUtil.generate({ commonName, organization });
            const privateKeyObj = KEYUTIL.getKey(privateKey);
            KEYUTIL.getPEM(privateKeyObj, 'PKCS8PRV').should.equal(privateKey);
            const publicKeyObj = KEYUTIL.getKey(publicKey);
            KEYUTIL.getPEM(publicKeyObj).should.equal(publicKey);
            const certificateObj = new X509();
            certificateObj.readCertPEM(certificate);
            certificateObj.getSubjectString().should.equal(`/CN=${commonName}`);
            certificateObj.getIssuerString().should.equal(`/O=${organization}`);
            const publicKeyFingerprint = KJUR.crypto.Util.hashHex(publicKeyObj.pubKeyHex, 'sha256');
            const certificateFingerprint = KJUR.crypto.Util.hashHex(certificateObj.getPublicKey().pubKeyHex, 'sha256');
            publicKeyFingerprint.should.equal(certificateFingerprint);
        });

        it('should generate a certificate using an existing public/private key pair', () => {
            const commonName = 'doge:' + uuid.v4();
            const oldPrivateKey = '-----BEGIN PRIVATE KEY-----\r\n' +
            'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgwK1HBTzQHBpwDctA\r\n' +
            'YDu+gvENM3lF/yY/ACnuzSUxP8KhRANCAATOq0ACLLHv1sjPsGM84jS+auUYpcq6\r\n' +
            'JIugzY+bS7G2eOEs12fRFqOSi2TeAuDLyWT2yqBJ6XsIN883uT2QIybl\r\n' +
            '-----END PRIVATE KEY-----\r\n';
            const oldPublicKey = '-----BEGIN PUBLIC KEY-----\r\n' +
            'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzqtAAiyx79bIz7BjPOI0vmrlGKXK\r\n' +
            'uiSLoM2Pm0uxtnjhLNdn0Rajkotk3gLgy8lk9sqgSel7CDfPN7k9kCMm5Q==\r\n' +
            '-----END PUBLIC KEY-----\r\n';
            let { privateKey: newPrivateKey, publicKey: newPublicKey, certificate } = CertificateUtil.generate({ commonName, privateKey: oldPrivateKey, publicKey: oldPublicKey });
            const privateKeyObj = KEYUTIL.getKey(newPrivateKey);
            KEYUTIL.getPEM(privateKeyObj, 'PKCS8PRV').should.equal(oldPrivateKey);
            const publicKeyObj = KEYUTIL.getKey(newPublicKey);
            KEYUTIL.getPEM(publicKeyObj).should.equal(oldPublicKey);
            const certificateObj = new X509();
            certificateObj.readCertPEM(certificate);
            certificateObj.getSubjectString().should.equal(`/CN=${commonName}`);
            certificateObj.getIssuerString().should.equal('/O=org1.example.com');
            const publicKeyFingerprint = KJUR.crypto.Util.hashHex(publicKeyObj.pubKeyHex, 'sha256');
            const certificateFingerprint = KJUR.crypto.Util.hashHex(certificateObj.getPublicKey().pubKeyHex, 'sha256');
            publicKeyFingerprint.should.equal(certificateFingerprint);
        });

        it('should throw if only a private key is specified', () => {
            const commonName = 'doge:' + uuid.v4();
            const oldPrivateKey = '-----BEGIN PRIVATE KEY-----\r\n' +
            'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgwK1HBTzQHBpwDctA\r\n' +
            'YDu+gvENM3lF/yY/ACnuzSUxP8KhRANCAATOq0ACLLHv1sjPsGM84jS+auUYpcq6\r\n' +
            'JIugzY+bS7G2eOEs12fRFqOSi2TeAuDLyWT2yqBJ6XsIN883uT2QIybl\r\n' +
            '-----END PRIVATE KEY-----\r\n';
            (() => {
                CertificateUtil.generate({ commonName, privateKey: oldPrivateKey });
            }).should.throw(/must specify neither publicKey and privateKey, or both publicKey and privateKey/);
        });

        it('should throw if only a public key is specified', () => {
            const commonName = 'doge:' + uuid.v4();
            const oldPublicKey = '-----BEGIN PUBLIC KEY-----\r\n' +
            'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzqtAAiyx79bIz7BjPOI0vmrlGKXK\r\n' +
            'uiSLoM2Pm0uxtnjhLNdn0Rajkotk3gLgy8lk9sqgSel7CDfPN7k9kCMm5Q==\r\n' +
            '-----END PUBLIC KEY-----\r\n';
            (() => {
                CertificateUtil.generate({ commonName, publicKey: oldPublicKey });
            }).should.throw(/must specify neither publicKey and privateKey, or both publicKey and privateKey/);
        });

    });

});