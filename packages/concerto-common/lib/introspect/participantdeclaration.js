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

/** Class representing the definition of a Participant.
 * @extends ClassDeclaration
 * @see See [ClassDeclaration]{@link module:concerto-common.ClassDeclaration}
 * @private
 * @class
 * @memberof module:concerto-common
 */
class ParticipantDeclaration extends ClassDeclaration {
    /**
     * Create an ParticipantDeclaration.
     * @param {ModelFile} modelFile the ModelFile for this class
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }
}

module.exports = ParticipantDeclaration;
