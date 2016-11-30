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

/**
* A base class for all Concerto exceptions
* <p><a href="diagrams/baseexception.svg"><img src="diagrams/baseexception.svg" style="width:100%;"/></a></p>
* @extends Error
* @class
* @memberof module:ibm-concerto-common
*/
class BaseException extends Error {

    /**
     * Create the BaseException.
     * @param {string} message - The exception message.
     */
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }

}

module.exports = BaseException;
