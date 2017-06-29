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

const BaseException = require('composer-common').BaseException;

/**
* Class representing an access exception
* <p><a href="./diagrams/accessexception.svg"><img src="./diagrams/accessexception.svg" style="width:100%;"/></a></p>
* @protected
* @extends BaseException
* @see See [BaseException]{@link module:composer-common.BaseException}
* @class
* @memberof module:composer-runtime
*/
class AccessException extends BaseException {

    /**
     * Generate the exception message.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     * @return {string} The exception message.
     */
    static generateMessage(resource, access, participant, transaction) {
        let resourceId = resource.getFullyQualifiedIdentifier();
        let participantId = participant.getFullyQualifiedIdentifier();
        return `Participant '${participantId}' does not have '${access}' access to resource '${resourceId}'`;
    }

    /**
     * Constructor.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     */
    constructor(resource, access, participant, transaction) {
        super(AccessException.generateMessage(resource, access, participant, transaction));
    }

}

module.exports = AccessException;
