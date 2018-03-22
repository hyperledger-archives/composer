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
const InvalidQueryException = require('./invalidqueryexception');
const Sort = require('./sort');

/**
 * Defines the ORDER BY specification for a SELECT statement
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class OrderBy {

    /**
     * Create an OrderBy from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {Select} select - the Select for this order by
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(select, ast) {
        if(!select || !ast) {
            throw new IllegalModelException('Invalid Select or AST');
        }

        this.ast = ast;
        this.select = select;
        this.sortCriteria = [];
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
     * Returns the Select that owns this OrderBy.
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
        if(this.ast.sort) {
            for(let n=0; n < this.ast.sort.length; n++) {
                this.sortCriteria.push( new Sort(this, this.ast.sort[n]));
            }
        } else {
            throw new IllegalModelException('Invalid AST');
        }
    }

    /**
     * Semantic validation of the structure of this select.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        let direction = null;
        for(let n=0; n < this.sortCriteria.length; n++) {
            this.sortCriteria[n].validate();
            if(direction === null) {
                // initialise the direction
                direction = this.sortCriteria[n].direction;
            } else if(direction !== this.sortCriteria[n].direction) {
                // opposing directions - Couch won't like this
                throw new InvalidQueryException( 'ORDER BY currently only supports a single direction for all fields.', this.getSelect().getQuery().getQueryFile(), this.getSelect().getAST().location );
            }
        }
    }

    /**
     * Return the sort criteria of this order by.
     * @return {Sort[]} The sort criteria of this order by.
     */
    getSortCriteria() {
        return this.sortCriteria;
    }

}

module.exports = OrderBy;
