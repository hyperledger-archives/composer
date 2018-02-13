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

const createHash = require('sha.js');
const Logger = require('./log/logger');

const LOG = Logger.getLog('Certificate');

/**
 * A class representing a digital certificate, the public part of an identity.
 */
class Certificate {

    /**
     * Calculate the unique identifier for the given certificate.
     * @private
     * @param {string} pem The PEM encoded certificate.
     * @return {string} The unique identifier.
     */
    static _calculateIdentifier(pem) {
        const method = '_calculateIdentifier';
        LOG.entry(method, pem);
        const bytes = pem
            .replace(/-----BEGIN CERTIFICATE-----/, '')
            .replace(/-----END CERTIFICATE-----/, '')
            .replace(/[\r\n]+/g, '');
        const buffer = Buffer.from(bytes, 'base64');
        const sha256 = createHash('sha256');
        const result = sha256.update(buffer).digest('hex');
        LOG.exit(method, result);
        return result;
    }

    /**
     * Constructor.
     * @param {string} pem The PEM encoded certificate.
     */
    constructor(pem) {
        const method = 'constructor';
        LOG.entry(method, pem);
        this.pem = pem;
        this.identifier = Certificate._calculateIdentifier(pem);
        LOG.exit(method);
    }

    /**
     * Get the PEM encoded certificate.
     * @return {string} The PEM encoded certificate.
     */
    getPEM() {
        return this.pem;
    }

    /**
     * Get the unique identifier.
     * @return {string} The unique identifier.
     */
    getIdentifier() {
        return this.identifier;
    }

}

module.exports = Certificate;