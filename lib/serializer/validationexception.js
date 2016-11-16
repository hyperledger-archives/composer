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
 * Exception thrown when a resource fails to model against the model
 */
class ValidationException extends BaseException {

    /**
     * Create an ParseException
     * @param {string} message - the message for the exception
     */
    constructor(message) {
        super(message);
    }
}

module.exports = ValidationException;
