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
 * An Abstract field validator. Extend this class and override the
 * validate method.
 * @private
 * @class
 * @abstract
 * @memberof module:ibm-concerto-common
 */
class Validator {

    /**
     * Create a Property.
     * @param {Field} field - the field this validator is attached to
     * @param {Object} validator - The validation string
     * @throws {InvalidModelException}
     */
    constructor(field, validator) {
        this.validator = validator;
        this.field = field;
    }

    /**
     * @param {string} id the identifier of the instance
     * @param {string} msg the exception message
     * @throws {Error} throws an error to report the message
     */
    reportError(id, msg) {
        throw new Error( 'Invalid validator for field ' + id + ' ' + this.getField().getFullyQualifiedName() + ': ' + msg );
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Returns the field that this validator applies to
     * @return {Field} the field
     */
    getField() {
        return this.field;
    }

    /**
     * Validate the property against a value
     * @param {string} identifier the identifier of the instance being validated
     * @param {Object} value the value to validate
     * @throws {InvalidModelException}
     * @private
     */
    validate(identifier, value) {
    }
}

module.exports = Validator;
