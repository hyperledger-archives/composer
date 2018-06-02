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
 * Operation captures the array ofaction verbs that the ACL rule
 * governs.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Operation {

    /**
     * Create an Operation from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclRule} aclRule - the AclRule for this Operation
     * @param {Object} ast - the AST created by the parser
     * @throws {IllegalAclException}
     */
    constructor(aclRule, ast) {
        if(!aclRule || !ast) {
            throw new IllegalAclException('Invalid AclRule or AST');
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
     * Returns the AclRule that owns this Operation.
     *
     * @return {AclRule} the owning AclRule
     */
    getAclRule() {
        return this.aclRule;
    }

    /**
     * Returns the expression as a text string.
     *
     * @return {string} the verbs for the operation
     */
    getVerbs() {
        return this.verbs;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalAclException}
     * @private
     */
    process() {
        this.verbs = this.ast.verbs;
    }

    /**
     * Semantic validation of the structure of this Operation.
     *
     * @throws {IllegalAclException}
     * @private
     */
    validate() {
        const foundVerbs = {};
        this.verbs.forEach((verb) => {
            if (foundVerbs[verb]) {
                throw new IllegalAclException(`The verb '${verb}' has been specified more than once in the ACL rule '${this.aclRule.getName()}'`, this.aclRule.getAclFile(), this.ast.location);
            }
            foundVerbs[verb] = true;
        });
    }

}

module.exports = Operation;
