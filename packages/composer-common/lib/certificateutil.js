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

const { KEYUTIL, KJUR } = require('jsrsasign');
const Logger = require('./log/logger');

const LOG = Logger.getLog('CertificateUtil');

/**
 * A class with utilities for generating digital certificates.
 */
class CertificateUtil {

    /**
     * Generate a certificate and public/private key pair.
     * @param {Object} options The options.
     * @param {string} options.commonName The common name for the certificate.
     * @param {string} options.organization The organization for the certificate, defaults to 'org1.example.com'.
     * @param {string} options.publicKey An existing PEM encoded public key.
     * @param {string} options.privateKey An existing PEM encoded private key.
     * @return {{ publicKey: string, privateKey: string, certificate: string }} The certificate and public/private key pair.
     */
    static generate({ commonName, organization = 'org1.example.com', publicKey, privateKey } = {}) {
        const method = 'generate';
        LOG.entry(method);
        let pubKeyObj, prvKeyObj;
        if (!commonName) {
            throw new Error('commonName not specified');
        } else if (!publicKey && !privateKey) {
            LOG.debug(method, 'No existing key pair specified, generating');
            ({ pubKeyObj, prvKeyObj } = KEYUTIL.generateKeypair('EC', 'secp256r1'));
            publicKey = KEYUTIL.getPEM(pubKeyObj);
            privateKey = KEYUTIL.getPEM(prvKeyObj, 'PKCS8PRV');
        } else if (publicKey && privateKey) {
            LOG.debug(method, 'Existing key pair specified');
            pubKeyObj = KEYUTIL.getKey(publicKey);
            prvKeyObj = KEYUTIL.getKey(privateKey);
        } else {
            throw new Error('must specify neither publicKey and privateKey, or both publicKey and privateKey');
        }
        const certificate = KJUR.asn1.x509.X509Util.newCertPEM({
            serial: { int: 4 },
            sigalg: { name: 'SHA1withECDSA' },
            issuer: { str: `/O=${organization}` },
            notbefore: { str: '180101000000Z' },
            notafter: { str: '280101000000Z' },
            subject: { str: `/CN=${commonName}` },
            sbjpubkey: pubKeyObj,
            ext: [
              { basicConstraints: { cA: true, critical: true } },
              { keyUsage: { bin: '11' } },
            ],
            cakey: prvKeyObj
        });
        LOG.exit(method);
        return { publicKey, privateKey, certificate };
    }

}

module.exports = CertificateUtil;