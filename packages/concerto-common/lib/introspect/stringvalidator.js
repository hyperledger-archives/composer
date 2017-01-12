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

const Validator = require('./validator');

/**
 * A Validator to enforce that a string matches a regex
 * @private
 * @class
 * @memberof module:concerto-common
 */
class StringValidator extends Validator{

    /**
     * Create a StringValidator.
     * @param {Field} field - the field this validator is attached to
     * @param {Object} validator - The validation string. This must be a regex
     * expression.
     *
     * @throws {InvalidModelException}
     */
    constructor(field, validator) {
        super(field,validator);
        try {
            // discard the leading / and closing /
            this.regex = new RegExp(validator.substring(1,validator.length-1));
        }
        catch(exception) {
            this.reportError(exception.message);
        }
    }

    /**
     * Validate the property
     * @param {string} identifier the identifier of the instance being validated
     * @param {Object} value the value to validate
     * @throws {InvalidModelException}
     * @private
     */
    validate(identifier, value) {
        if(value !== null) {
            if(!this.regex.test(value)) {
                this.reportError(identifier, 'Value + \'' + value + '\' failed to match validation regex: ' + this.regex);
            }
        }
    }
}

module.exports = StringValidator;
