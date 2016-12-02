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
 * Class representing a value from a set of enumerated values
 * @private
 * @extends Property
 * @see See [Property]{@link module:ibm-concerto-common.Property}
 * @class
 * @memberof module:ibm-concerto-common
 */
class EnumValueDeclaration extends Property {

    /**
     * Create a EnumValueDeclaration.
     * @param {ClassDeclaration} parent - The owner of this property
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(parent, ast) {
        super(parent, ast);
    }

    /**
     * Validate the property
     * @param {ClassDeclaration} classDecl the class declaration of the property
     * @throws {InvalidModelException}
     * @private
     */
    validate(classDecl) {
        super.validate(classDecl);
    }
}

module.exports = EnumValueDeclaration;
