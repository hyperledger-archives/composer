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

/**
 * SecurityContext is used to authenticate and manage
 * user credentials to the underlying blockchain fabric.
 * <p><a href="./diagrams/securitycontext.svg"><img src="./diagrams/securitycontext.svg" style="height:100%;"/></a></p>
 * @abstract
 * @class
 * @memberof module:composer-common
 * @private
 */
class SecurityContext {

    /**
     * Create the SecurityContext.
     * <strong>Note: Only to be called by framework code. </strong>
     * </p>
     * @param {Connection} connection The owning connection.
     * @param {string} user The user identifier.
     */
    constructor(connection) {
        this.connection = connection;
    }

    /**
     * Get the owning connection.
     * @return {Connection} The owning connection.
     */
    getConnection() {
        return this.connection;
    }

    /**
     * Get the current username.
     * @abstract
     * @return {string} The username
     */
    getUser() {
        throw new Error('abstract function called');
    }

}

module.exports = SecurityContext;
