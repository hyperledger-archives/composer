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
const jsr = require('jsrsasign');
const crypto = require('crypto');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeIdentityService');

const extractCN = /(\/CN=)(.*?)(\/|,|$)/;

/**
 * Base class representing the identity service provided by a {@link Container}.
 * @protected
 */
class NodeIdentityService extends IdentityService {

    /**
     * Constructor.
     */
    constructor(stub) {
        super();
        const method = 'constructor';
        LOG.entry(method, stub);
        this.stub = stub;
        LOG.exit(method);

    }

    /**
     * Load and process a certificate.
     */
    _loadCertificate() {
        const method = '_loadCertificate';
        LOG.entry(method);

        let creator = this.stub.getCreator();
        this.pem = creator.getIdBytes().toString('utf8');
        if (this.pem && this.pem.startsWith('-----BEGIN CERTIFICATE-----')) {

            this.certificate = new jsr.X509();
            this.certificate.readCertPEM(this.pem);

            //TODO: Issuer is not always used, so could lazy load that for a performance improvement
            const sha256Issuer = crypto.createHash('sha256');
            sha256Issuer.update(this.certificate.getIssuerString(), 'utf8');
            this.issuer = sha256Issuer.digest('hex');

            const sha256Identifier = crypto.createHash('sha256');
            sha256Identifier.update(Buffer.from(this.certificate.hex, 'hex'));
            this.identifier = sha256Identifier.digest('hex');

            // need to do this because getSubjectString is not in a valid DN format
            this.name = extractCN.exec(this.certificate.getSubjectString())[2];
        }
        else {
            const newErr = new Error('No creator certificate provided or not a valid x509 certificate');
            LOG.error(method, newErr);
            throw newErr;
        }
        LOG.exit(method);
    }

    /**
     * Get a unique identifier for the identity used to submit the transaction.
     * @return {string} A unique identifier for the identity used to submit the transaction.
     */
    getIdentifier() {
        const method = 'getIdentifier';
        LOG.entry(method);

        if (!this.identifier) {
            this._loadCertificate();
        }
        LOG.exit(method, this.identifier);
        return this.identifier; // this.Certificate.raw, hashed using sha256 and sum result
    }

    /**
     * Get the name of the identity used to submit the transaction.
     * @return {string} The name of the identity used to submit the transaction.
     */
    getName() {
        const method = 'getName';
        LOG.entry(method);

        if (!this.name) {
            this._loadCertificate();
        }
        LOG.exit(method, this.name);
        return this.name;
    }

    /**
     * Get the issuer of the identity used to submit the transaction.
     * @return {string} The issuer of the identity used to submit the transaction.
     */
    getIssuer() {
        const method = 'getIssuer';
        LOG.entry(method);

        if (!this.issuer) {
            this._loadCertificate();
        }
        LOG.exit(method, this.issuer);
        return this.issuer; // this.Certificate.Issuer.raw, hashed using sha256 and sum result
    }

    /**
     * Get the certificate for the identity used to submit the transaction.
     * @return {string} The certificate for the identity used to submit the transaction.
     */
    getCertificate() {
        const method = 'getCertificate';
        LOG.entry(method);

        if (!this.pem) {
            this._loadCertificate();
        }
        LOG.exit(method, this.pem);
        return this.pem;
    }

}

module.exports = NodeIdentityService;
