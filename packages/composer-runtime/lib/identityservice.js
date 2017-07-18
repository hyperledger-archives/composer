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

const Service = require('./service');

/**
 * Base class representing the identity service provided by a {@link Container}.
 * @protected
 * @abstract
 * @memberof module:composer-runtime
 */
class IdentityService extends Service {

    /**
     * Get a unique identifier for the identity used to submit the transaction.
     * @abstract
     * @return {string} A unique identifier for the identity used to submit the transaction.
     */
    getIdentifier() {
        throw new Error('abstract function called');
    }

    /**
     * Get the name of the identity used to submit the transaction.
     * @abstract
     * @return {string} The name of the identity used to submit the transaction.
     */
    getName() {
        throw new Error('abstract function called');
    }

    /**
     * Get the issuer of the identity used to submit the transaction.
     * @abstract
     * @return {string} The issuer of the identity used to submit the transaction.
     */
    getIssuer() {
        throw new Error('abstract function called');
    }

    /**
     * Get the certificate for the identity used to submit the transaction.
     * @abstract
     * @return {string} The certificate for the identity used to submit the transaction.
     */
    getCertificate() {
        throw new Error('abstract function called');
    }

}

module.exports = IdentityService;
