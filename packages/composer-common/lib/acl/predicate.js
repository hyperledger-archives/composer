/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const IllegalAclException = require('./illegalaclexception');

/**
 * Predicate captures a conditional Javascript expression:
 * anything that can legally appear within a if statement.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Predicate {

    /**
     * Create an Predicate from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclRule} aclRule - the AclRule for this Predicate
     * @param {Object} ast - the AST created by the parser
     * @throws {IllegalAclException}
     */
    constructor(aclRule, ast) {
        if(!aclRule || !ast) {
            throw new IllegalAclException('Invalid AclRule or AST');
        }

        this.expression = ast;
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
     * Returns the expression as a text string.
     *
     * @return {string} the operator for the predicate
     */
    getExpression() {
        return this.expression;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalAclException}
     * @private
     */
    process() {
    }

    /**
     * Semantic validation of the structure of this ModelBinding.
     *
     * @throws {IllegalAclException}
     * @private
     */
    validate() {
    }

}

module.exports = Predicate;
