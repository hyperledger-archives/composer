/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const BaseException = require('@ibm/concerto-common').BaseException;

/**
* Class representing an access exception
* <p><a href="./diagrams/accessexception.svg"><img src="./diagrams/accessexception.svg" style="width:100%;"/></a></p>
* @extends BaseException
* @see See [BaseException]{@link module:concerto-common.BaseException}
* @class
* @memberof module:concerto-runtime
*/
class AccessException extends BaseException {

    /**
     * Generate the exception message.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @return {string} The exception message.
     */
    static generateMessage(resource, access, participant) {
        let resourceId = resource.getFullyQualifiedIdentifier();
        let participantId = participant.getFullyQualifiedIdentifier();
        return `Participant '${participantId}' does not have '${access}' access to resource '${resourceId}'`;
    }

    /**
     * Constructor.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     */
    constructor(resource, access, participant) {
        super(AccessException.generateMessage(resource, access, participant));
    }

}

module.exports = AccessException;
