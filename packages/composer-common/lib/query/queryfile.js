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

const parser = require('./parser');
const Query = require('./query');
const ParseException = require('../introspect/parseexception');

/**
 * Class representing a Query File
 * @private
 * @class
 * @memberof module:composer-common
 */
class QueryFile {

    /**
     * Create an QueryFile. This should only be called by framework code.
     * @param {string} id - The identifier of this Query File (may be a filename for example)
     * @param {ModelManager} modelManager - the ModelManager that manages this
     * ModelFile and that will be used to validate the queries in the QueryFile
     * @param {string} definitions - The queries as a string.
     * @throws {IllegalModelException}
     */
    constructor(id, modelManager, definitions) {
        this.modelManager = modelManager;
        this.queries = [];
        this.identifier = id;

        if(typeof definitions !== 'string') {
            throw new Error('QueryFile expects an QueryFile as a string as input.');
        }
        this.definitions = definitions;

        try {
            this.ast = parser.parse(definitions);
        }
        catch(err) {
            if(err.location && err.location.start) {
                throw new ParseException( err.message, err.location, id );
            }
            else {
                throw err;
            }
        }

        for(let n=0; n < this.ast.queries.length; n++ ) {
            let thing = this.ast.queries[n];
            this.queries.push(new Query(this, thing));
        }
    }

    /**
     * Returns the name of this Query File.
     * @return {string} the name of this Query File
     */
    getIdentifier() {
        return this.identifier;
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
     * Returns the ModelManager associated with this QueryFile
     *
     * @return {ModelManager} The ModelManager for this QueryFile
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Validates the QueryFile.
     *
     * @throws {IllegalModelException} if the query file is invalid
     * @private
     */
    validate() {
        const queries = {};
        this.queries.forEach((query) => {
            query.validate();
            let name = query.getName();
            if (queries[name]){
                throw new Error(`Found two or more queries with the name '${name}'`);
            }
            queries[name] = query;
        });
    }

    /**
     * Get all declarations in this Query file
     * @return {Query[]} the Queries defined in the Query file
     */
    getQueries() {
        return this.queries;
    }

    /**
     * Get the definitions for this Query file.
     * @return {string} The definitions for this Query file.
     */
    getDefinitions() {
        return this.definitions;
    }

    /**
     * Create a query programmatically without supplying an AST,
     * and add it into this query file.
     * @param {string} name The name of the query.
     * @param {string} description A description of the query.
     * @param {string} select The select statement.
     * @return {Query} The created query.
     */
    buildQuery(name, description, select) {
        const query = Query.buildQuery(this, name, description, select);
        this.queries.push(query);
        return query;
    }

}

module.exports = QueryFile;
