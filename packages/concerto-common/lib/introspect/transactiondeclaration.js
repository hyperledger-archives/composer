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
const Field = require('./field');

/** Class representing the definition of an Transaction.
 * @extends ClassDeclaration
 * @see See [ClassDeclaration]{@link module:concerto-common.ClassDeclaration}
 * @private
 * @class
 * @memberof module:concerto-common
 */
class TransactionDeclaration extends ClassDeclaration {
    /**
     * Create an TransactionDeclaration.
     * @param {ModelFile} modelFile the ModelFile for this class
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }

    /**
     * Process the AST and build the model
     *
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        super.process();

        // we add the timestamp property that all transactions must have
        if(this.getProperty('timestamp') === null) {
            const ast = {
                id : {name: 'timestamp'},
                propertyType: {name: 'DateTime'}
            };
            this.properties.push(new Field(this, ast));
        }
    }
}

module.exports = TransactionDeclaration;
