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
const Limit = require('./limit');
const OrderBy = require('./orderby');
const Skip = require('./skip');
const Where = require('./where');

/**
 * Select defines a SELECT query over a resource (asset, transaction or participant)
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Select {

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
            throw new InvalidQueryException('Invalid Query or AST');
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
     * @return {Query} the owning QueryFile
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

        // The grammar ensures that the resource property is set.
        this.resource = this.ast.resource;

        this.registry = null;
        if(this.ast.registry) {
            this.registry = this.ast.registry;
        }

        this.where = null;
        if(this.ast.where) {
            this.where = new Where(this, this.ast.where);
        }

        this.limit = null;
        if(this.ast.limit) {
            this.limit = new Limit(this, this.ast.limit);
        }

        this.skip = null;
        if(this.ast.skip) {
            this.skip = new Skip(this, this.ast.skip);
        }

        this.orderBy = null;
        if(this.ast.orderBy) {
            this.orderBy = new OrderBy(this, this.ast.orderBy);
        }

        this.text = null;
        if(this.ast.text) {
            this.text = this.ast.text;
        }
    }

    /**
     * Semantic validation of the structure of this select.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {

        // The grammar ensures that the resource property is set.
        const resourceClassDeclaration = this.getResourceClassDeclaration();

        if(!resourceClassDeclaration) {
            throw new InvalidQueryException('Type does not exist ' + this.resource, this.getQuery().getQueryFile(), this.ast.location);
        }

        // check that it is not an enum or concept
        if(resourceClassDeclaration.isConcept() || resourceClassDeclaration.isEnum()) {
            throw new InvalidQueryException('Can only select assets, participants and transactions.', this.getQuery().getQueryFile(), this.ast.location);
        }

        if(this.where) {
            this.where.validate();
        }

        if(this.orderBy) {
            this.orderBy.validate();
        }

        if(this.limit) {
            this.limit.validate();
        }

        if(this.skip) {
            this.skip.validate();
        }
    }

    /**
     * Returns the FQN of the resource of this select or null if it does not have a resource.
     *
     * @return {string} the fully qualified name of the select
     */
    getResource() {
        return this.resource;
    }

    /**
     * Returns the FQN of the resource of this select or null if it does not have a resource.
     *
     * @return {string} the fully qualified name of the select
     */
    getResourceClassDeclaration() {
        // The grammar ensures that the resource property is set.
        const mm = this.getQuery().getQueryFile().getModelManager();

        // checks the resource type exists
        return mm.getType(this.resource);
    }

    /**
     * Returns the name of the registry of this select or null if it does not have a registry.
     *
     * @return {string} the name of the registry of the select
     */
    getRegistry() {
        return this.registry;
    }

    /**
     * Returns the Where clause for this query or null if it does not have a WHERE clause.
     *
     * @return {Where} the Where or null
     */
    getWhere() {
        return this.where;
    }

    /**
     * Returns the OrderBy clause for this query or null if it does not have an ORDER BY clause.
     *
     * @return {OrderBy} the OrderBy or null
     */
    getOrderBy() {
        return this.orderBy;
    }

    /**
     * Returns the LIMIT count for this query or null if it does not have a LIMIT
     *
     * @return {Limit} the LIMIT or null
     */
    getLimit() {
        return this.limit;
    }

    /**
     * Returns the SKIP count for this query or null if it does not have a SKIP
     *
     * @return {Skip} the SKIP or null
     */
    getSkip() {
        return this.skip;
    }

    /**
     * Returns the text of this select statement.
     * @return {string} the text of this select statement.
     */
    getText() {
        return this.text;
    }

    /**
     * Return the AST for this select statement.
     * @return {Object} The AST for this select statement.
     */
    getAST() {
        return this.ast;
    }
}

module.exports = Select;
