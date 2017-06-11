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

const IllegalModelException = require('../introspect/illegalmodelexception');

/**
 * Condition defines the left-hand-side, operator and right-hand-side
 * for a conditional select in a Where clause.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Condition {

    /**
     * Create a Condition for a Where clause
     *
     * @param {Where} where - the Where for this condition
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(where, ast) {
        if(!where || !ast) {
            throw new IllegalModelException('Invalid Where or AST');
        }

        this.ast = ast;
        this.where = where;
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
     * Returns the Where that owns this condition.
     *
     * @return {Where} the owning where clause
     */
    getWhere() {
        return this.where;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.left = this.ast.left;
        this.op = this.ast.op;
        this.right = this.right.value;
    }

    /**
     * Semantic validation of the structure of this select.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
    }

    /**
     * Returns a new object representing this Query that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = {
            left: this.left,
            op: this.op,
            right: this.right
        };
        return result;
    }
}

module.exports = Condition;
