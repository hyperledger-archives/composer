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
 * A security context for the embedded connection.
 */
class ProxySecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     * @param {string} enrollmentID The enrollment ID.
     * @param {string} securityContextID The security context ID.
     */
    constructor(connection, enrollmentID, securityContextID) {
        super(connection);
        this.enrollmentID = enrollmentID;
        this.securityContextID = securityContextID;
    }

    /**
     * Get the current username.
     * @abstract
     * @return {string} The username
     */
    getUser() {
        return this.enrollmentID;
    }

    /**
     * Get the security context ID.
     * @return {string} The security context ID.
     */
    getSecurityContextID() {
        return this.securityContextID;
    }

}

module.exports = ProxySecurityContext;
