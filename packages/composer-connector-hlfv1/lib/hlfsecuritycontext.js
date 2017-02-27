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
 * Class representing a logged in Hyperledger Fabric user.
 * @protected
 */
class HLFSecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     */
    constructor(connection) {
        super(connection);
        this.user = null;
        this.chaincodeID = null;
    }

    /**
     * Get the current username.
     * @return {string} The username
     */
    getUser() {
        return this.user;
    }

    /**
     * Set the current username.
     * @param {string} user The username
     */
    setUser(user) {
        this.user = user;
    }

}

module.exports = HLFSecurityContext;
