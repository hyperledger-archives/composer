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

const BaseException = require('../baseexception');

/**
 * Exception throws when a Concerto file is semantically invalid
 * @extends BaseException
 * @see See [BaseException]{@link module:concerto-common.BaseException}
 * @class
 * @memberof module:concerto-common
 */
class IllegalModelException extends BaseException {

    /**
     * Create an IllegalModelException
     * @param {string} message - the message for the exception
     */
    constructor(message) {
        super(message);
    }
}

module.exports = IllegalModelException;
