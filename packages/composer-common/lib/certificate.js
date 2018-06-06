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

const { KEYUTIL, KJUR, X509 } = require('jsrsasign');
const Logger = require('./log/logger');

const LOG = Logger.getLog('Certificate');

/**
 * A class representing a digital certificate, the public part of an identity.
 */
class Certificate {

    /**
     * Constructor.
     * @param {string} pem The PEM encoded certificate.
     */
    constructor(pem) {
        const method = 'constructor';
        LOG.entry(method, pem);
        this.pem = pem;
        this.certificate = new X509();
        this.certificate.readCertPEM(pem);
        this.publicKey = KEYUTIL.getPEM(this.certificate.getPublicKey());
        this.identifier = KJUR.crypto.Util.hashHex(this.certificate.getPublicKey().pubKeyHex, 'sha256');
        this.issuer = KJUR.crypto.Util.hashHex(this.certificate.getIssuerString(), 'sha256');
        this.name = /(\/CN=)(.*?)(\/|,|$)/.exec(this.certificate.getSubjectString())[2];
        LOG.exit(method);
    }

    /**
     * Get the PEM encoded certificate.
     * @return {string} The PEM encoded certificate.
     */
    getCertificate() {
        return this.pem;
    }

    /**
     * Get the PEM encoded public key.
     * @return {string} The PEM encoded public key.
     */
    getPublicKey() {
        return this.publicKey;
    }

    /**
     * Get the unique identifier.
     * @return {string} The unique identifier.
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Get the issuer.
     * @return {string} The issuer.
     */
    getIssuer() {
        return this.issuer;
    }

    /**
     * Get the name.
     * @return {string} The name.
     */
    getName() {
        return this.name;
    }

}

module.exports = Certificate;