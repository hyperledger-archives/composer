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

const BaseException = require('./baseexception');

/**
* Class representing a security exception
* <p><a href="./diagrams/securityexception.svg"><img src="./diagrams/securityexception.svg" style="height:100%;"/></a></p>
* @extends BaseException
* @see See [BaseException]{@link module:composer-common.BaseException}
* @class
* @memberof module:composer-common
*/
class SecurityException extends BaseException {

    /**
     * Create the SecurityException.
     * @param {string} message - The exception message.
     */
    constructor(message) {
        super(message);
    }

}

module.exports = SecurityException;
