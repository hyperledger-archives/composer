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
 * ConceptDeclaration defines the schema (aka model or class) for
 * an Concept. It extends ClassDeclaration which manages a set of
 * fields, a super-type and the specification of an
 * identifying field.
 * @private
 * @extends ClassDeclaration
 * @see See [ClassDeclaration]{@link module:ibm-concerto-common.ClassDeclaration}
 * @class
 * @memberof module:ibm-concerto-common
 */
class ConceptDeclaration extends ClassDeclaration {

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
     * Returns true if this class is the definition of a concept.
     *
     * @return {boolean} true if the class is a concept
     */
    isConcept() {
        return true;
    }
}

module.exports = ConceptDeclaration;
