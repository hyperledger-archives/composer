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

const IllegalModelException = require('../introspect/illegalmodelexception');

/**
 * Predicate captures a boolean expression over left-hand-side and
 * right-hand-side variables.
 *
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class Predicate {

    /**
     * Create an Predicate from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclRule} aclRule - the AclRule for this Predicate
     * @param {Object} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(aclRule, ast) {
        if(!aclRule || !ast) {
            throw new IllegalModelException('Invalid AclRule or AST');
        }

        this.ast = ast;
        this.aclRule = aclRule;
        this.process();
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
     * Returns the AclRule that owns this ModelBinding.
     *
     * @return {AclRule} the owning AclRule
     */
    getAclRule() {
        return this.aclRule;
    }

    /**
     * Returns the AST for the predicate
     *
     * @return {string} the operator for the predicate
     */
    getExpression() {
        return this.ast;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {InvalidModelException}
     * @private
     */
    process() {
    }

    /**
     * Semantic validation of the structure of this ModelBinding.
     *
     * @throws {InvalidModelException}
     * @private
     */
    validate() {
    }

    /**
     * Returns a new object representing this function declaration that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = {
            expression: this.ast,
        };
        return result;
    }
}

module.exports = Predicate;
