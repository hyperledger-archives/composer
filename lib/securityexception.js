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

const BaseException = require('./baseexception');

/**
* Class representing a security exception
* <p><a href="diagrams/securityexception.svg"><img src="diagrams/securityexception.svg" style="width:100%;"/></a></p>
* @class
* @memberof module:ibm-concerto-common
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
