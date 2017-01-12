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
 * A Validator to enforce that non null numeric values are between two values.
 * @private
 * @class
 * @memberof module:concerto-common
 */
class NumberValidator extends Validator{

    /**
     * Create a NumberValidator.
     * @param {Field} field - the field this validator is attached to
     * @param {Object} ast - The ast for the range defined as [lower,upper] (inclusive).
     *
     * @throws {InvalidModelException}
     */
    constructor(field, ast) {
        super(field,ast);

        this.lowerBound = ast.lower;
        this.upperBound = ast.upper;

        if(this.lowerBound > this.upperBound) {
            this.reportError(null, 'Lower bound must be less than or equal to upper bound.');
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
            if(this.lowerBound && value < this.lowerBound) {
                this.reportError(identifier, 'Value is outside lower bound ' + value);
            }

            if(this.upperBound && value > this.upperBound) {
                this.reportError(identifier, 'Value is outside upper bound ' + value);
            }
        }
    }
}

module.exports = NumberValidator;
