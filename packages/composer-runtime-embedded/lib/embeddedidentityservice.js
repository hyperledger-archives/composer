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

/**
 * Base class representing the identity service provided by a {@link Container}.
 * @protected
 */
class EmbeddedIdentityService extends IdentityService {

    /**
     * Constructor.
     * @param {String} identity The current identity.
     */
    constructor(identity) {
        super();
        this.identity = identity;
    }

    /**
     * Get a unique identifier for the identity used to submit the transaction.
     * @return {string} A unique identifier for the identity used to submit the transaction.
     */
    getIdentifier() {
        return this.identity.identifier;
    }

    /**
     * Get the name of the identity used to submit the transaction.
     * @return {string} The name of the identity used to submit the transaction.
     */
    getName() {
        return this.identity.name;
    }

    /**
     * Get the issuer of the identity used to submit the transaction.
     * @return {string} The issuer of the identity used to submit the transaction.
     */
    getIssuer() {
        return this.identity.issuer;
    }

    /**
     * Get the certificate for the identity used to submit the transaction.
     * @return {string} The certificate for the identity used to submit the transaction.
     */
    getCertificate() {
        return this.identity.certificate;
    }

}

module.exports = EmbeddedIdentityService;
