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
const Select = require('./select');

/**
 * Query defines a SELECT query over a resource (asset, transaction or participant)
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Query {

    /**
     * Create an Query from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {QueryFile} queryFile - the QueryFile for this query
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(queryFile, ast) {
        if(!queryFile || !ast) {
            throw new IllegalModelException('Invalid QueryFile or AST');
        }

        this.ast = ast;
        this.queryFile = queryFile;
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
    getQueryFile() {
        return this.queryFile;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.name = this.ast.identifier.name;
        this.description = this.ast.description;
        this.select = new Select(this, this.ast.select);
    }

    /**
     * Semantic validation of the structure of this Query.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
    }

    /**
     * Returns the name of this Query.
     *
     * @return {string} the name of the Query
     */
    getName() {
        return this.name;
    }

    /**
     * Returns the description associated with this ACL Rule.
     *
     * @return {string} the description
     */
    getDescription() {
        return this.description;
    }

    /**
     * Returns a new object representing this Query that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = {
            name: this.name,
            description: this.description,
            select: this.select.toJSON()
        };
        return result;
    }
}

module.exports = Query;
