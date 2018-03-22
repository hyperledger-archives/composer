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

const SecurityContext = require('composer-common').SecurityContext;

/**
 * A security context for the web connection.
 */
class WebSecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     * @param {Object} identity The current identity.
     */
    constructor(connection, identity) {
        super(connection);
        this.identity = identity;
        this.chaincodeID = null;
    }

    /**
     * Get the current username.
     * @return {string} The username
     */
    getUser() {
        return this.identity.name;
    }

    /**
     * Get the current identity.
     * @return {string} The current identity.
     */
    getIdentity() {
        return this.identity;
    }

    /**
     * Get the name of the business network (chaincode).
     * @return {string} business network name.
     */
    getNetworkName() {
        return this.networkName;
    }

    /**
     * Set the name of the business network (chaincode).
     * @param {string} networkName business network name.
     */
    setNetworkName(networkName) {
        this.networkName = networkName;
    }

}

module.exports = WebSecurityContext;
