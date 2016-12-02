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

const Property = require('./property');

/**
 * Class representing the definition of a Field. A Field is owned
 * by a ClassDeclaration and has a name, type and additional metadata
 * (see below).
 * @private
 * @extends Property
 * @see See [Property]{@link module:ibm-concerto-common.Property}
 * @class
 * @memberof module:ibm-concerto-common
 */
class Field extends Property {

    /**
     * Create an Field.
     * @param {ClassDeclaration} parent - The owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(parent, ast) {
        super(parent, ast);
    }

    /**
     * Process the AST and build the model
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        super.process();

        if(this.ast.validator) {
            this.validator = this.ast.validator.text.value;
        } else {
            this.validator = null;
        }

        if(this.ast.default) {
            this.defaultValue = this.ast.default.text.value;
        } else {
            this.defaultValue = null;
        }
    }

    /**
     * Returns the validator string for this field
     * @return {string} the validator for the field or null
     */
    getValidator() {
        return this.validator;
    }

    /**
     * Returns the default value for the field or null
     * @return {string} the default value for the field or null
     */
    getDefaultValue() {
        if(this.defaultValue) {
            return this.defaultValue;
        }
        else {
            return null;
        }
    }

    /**
     * Returns a new object representing this function declaration that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = super.toJSON();
        result.validator = this.validator;
        result.defaultValue = this.defaultValue;
        result.optional = this.optional;
        return result;
    }

    /**
     * Returns a string representation of this property§
     * @return {String} the string version of the property.
     */
    toString() {
        return 'Field {name=' + this.name + ', type=' + this.getFullyQualifiedTypeName() + ', array=' + this.array + ', optional=' + this.optional +'}';
    }
}

module.exports = Field;
