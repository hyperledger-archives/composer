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
const NumberValidator = require('./numbervalidator');
const StringValidator = require('./stringvalidator');

/**
 * Class representing the definition of a Field. A Field is owned
 * by a ClassDeclaration and has a name, type and additional metadata
 * (see below).
 * @private
 * @extends Property
 * @see See [Property]{@link module:concerto-common.Property}
 * @class
 * @memberof module:concerto-common
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

        this.validator = null;

        switch(this.getType()) {
        case 'Integer':
        case 'Double':
        case 'Long':
            if(this.ast.range) {
                this.validator = new NumberValidator(this, this.ast.range);
            }
            break;
        case 'String':
            if(this.ast.regex) {
                this.validator = new StringValidator(this, this.ast.regex);
            }
            break;
        }

        if(this.ast.default) {
            this.defaultValue = this.ast.default;
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
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
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
