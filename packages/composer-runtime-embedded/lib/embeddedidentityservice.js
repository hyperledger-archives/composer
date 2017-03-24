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
     * @param {String} userID The current user ID.
     */
    constructor(userID) {
        super();
        this.userID = userID;
    }

    /**
     * Retrieve the current user ID.
     * @return {string} The current user ID, or null if the current user ID cannot
     * be determined or has not been specified.
     */
    getCurrentUserID() {
        return this.userID;
    }

}

module.exports = EmbeddedIdentityService;
