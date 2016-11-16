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

const ClassDeclaration = require('./classdeclaration');

/**
 * EnumDeclaration defines an enumeration of static values.
 * @private
 * @extends ClassDeclaration
 */
class EnumDeclaration extends ClassDeclaration {

    /**
     * Create an AssetDeclaration.
     * @param {ModelFile} modelFile the ModelFile for this class
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }

    /**
     * Returns true if this class is an enumeration.
     *
     * @return {boolean} true if the class is an enumerated type
     */
    isEnum() {
        return true;
    }

    /**
     * Returns the string representation of this class
     * @return {String} the string representation of the class
     */
    toString() {
        return 'EnumDeclaration {id=' + this.getFullyQualifiedName() + '}';
    }
}

module.exports = EnumDeclaration;
