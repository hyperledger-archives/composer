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

const Where = require('./where');
const OrderBy = require('./orderby');
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
     * Create an Select from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {Query} query - the Query for this select
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(query, ast) {
        if(!query || !ast) {
            throw new IllegalModelException('Invalid Query or AST');
        }

        this.ast = ast;
        this.query = query;
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
     * Returns the QueryFile that owns this Query.
     *
     * @return {AclFile} the owning QueryFile
     */
    getQuery() {
        return this.query;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.resource = this.ast.resource;

        this.where = null;
        if(this.ast.where) {
            this.where = new Where(this.ast.where);
        }

        this.limit = null;
        if(this.ast.limit) {
            this.limit = parseInt(this.ast.limit);
        }

        this.skip = null;
        if(this.ast.skip) {
            this.skip = parseInt(this.ast.skip);
        }

        this.orderBy = null;
        if(this.ast.orderBy) {
            this.orderBy = new OrderBy(this.ast.orderBy);
        }
    }

    /**
     * Semantic validation of the structure of this select.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        const mm = this.getQuery().getQueryFile().getModelManager();

        // checks the resource type exists
        const resourceClassDeclaration = mm.getType(this.resource);

        // check that it is not an enum or concept
        if(resourceClassDeclaration.isConcept() || resourceClassDeclaration.isEnum()) {
            throw new Error('Can only select assets, participants and transactions.');
        }

        if(this.where) {
            this.where.validate();
        }

        if(this.orderBy) {
            this.orderBy.validate();
        }
    }

    /**
     * Returns the FQN of the resource of this select.
     *
     * @return {string} the fully qualified name of the select
     */
    getResource() {
        return this.resource;
    }

    /**
     * Returns a new object representing this Query that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = {
            resouce: this.resource
        };
        return result;
    }
}

module.exports = Condition;
