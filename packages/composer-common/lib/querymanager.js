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

const QueryFile = require('./query/queryfile');

/**
 * <p>
 * Manages a set of queries.
 * </p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class QueryManager {

  /**
   * Create the QueryManager.
   * <p>
   * <strong>Note: Only to be called by framework code. Applications should
   * retrieve instances from {@link BusinessNetworkDefinition}</strong>
   * </p>
   * @param {ModelManager} modelManager - The ModelManager to use for this QueryManager
   * @param {QueryFile} queryFile - The QueryFile that stores the queries
   */
    constructor(modelManager) {
        this.modelManager = modelManager;
        this.queryFile = null;
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
     * Create an Query file using the specified ID and contents.
     * @param {string} identifier The identifier of the query file.
     * @param {string} contents The contents of the query file.
     * @return {QueryFile} The new Query file.
     */
    createQueryFile(identifier, contents) {
        return new QueryFile(identifier, this.modelManager, contents);
    }

    /**
     * Set the QueryFile for this QueryManager
     * @param {QueryFile} queryFile  - the QueryFile to associate with this QueryManager
     * @private
     */
    setQueryFile(queryFile) {
        queryFile.validate();
        this.queryFile = queryFile;
    }

    /**
     * Get the QueryFile associated with this QueryManager
     * @return {QueryFile} The QueryFile for this QueryManager or null if it has not been set
     */
    getQueryFile() {
        return this.queryFile;
    }

    /**
     * Get the Queries associated with this QueryManager
     * @return {Query[]} The Queries for the QueryManager or an empty array if not set
     */
    getQueries() {
        if(this.queryFile) {
            return this.queryFile.getQueries();
        }
        return [];
    }

    /**
     * Remove the Query
     */
    deleteQueryFile() {
        delete this.queryFile;
    }

    /**
     * Get the named Query associated with this QueryManager
     * @param {string} name  - the name of the query
     * @return {Query} The Query or null if it does not exist
     */
    getQuery(name) {
        if(this.queryFile) {
            const queries = this.queryFile.getQueries();
            for(let n=0; n < queries.length; n++) {
                const query = queries[n];
                if(query.getName() === name) {
                    return query;
                }
            }
        }
        return null;
    }

}

module.exports = QueryManager;
