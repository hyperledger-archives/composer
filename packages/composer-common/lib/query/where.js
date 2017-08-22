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

const InvalidQueryException = require('./invalidqueryexception');
const WhereAstValidator = require('./whereastvalidator');

/**
 * Where defines the WHERE portion of a SELECT statement
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Where {

    /**
     * Create a Where from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {Select} select - the Select for this Where
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(select, ast) {
        if(!select || !ast) {
            throw new InvalidQueryException('Invalid Select or AST');
        }

        this.ast = ast;
        this.select = select;
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
     * Returns the Select that owns this Where.
     *
     * @return {Select} the owning Select
     */
    getSelect() {
        return this.select;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
    }

    /**
     * Semantic validation of the structure of this where.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        try {
            const wv = new WhereAstValidator(this.getSelect().getResourceClassDeclaration());
            wv.visit(this.getAST(), {});
        }
        catch(err) {
            if(err instanceof InvalidQueryException === false) {
                // console.log(err.stack);
                let msg = err.message;

                if(err.getShortMessage) {
                    msg = err.getShortMessage();
                }

                throw new InvalidQueryException( 'Invalid WHERE clause in query ' + this.getSelect().getQuery().getName() + ': ' + msg, this.getSelect().getQuery().getQueryFile(), this.getSelect().getAST().location );
            }

            throw err;
        }
    }

    /**
     * Return the AST for this where statement.
     * @return {Object} The AST for this where statement.
     */
    getAST() {
        return this.ast;
    }

}

module.exports = Where;
