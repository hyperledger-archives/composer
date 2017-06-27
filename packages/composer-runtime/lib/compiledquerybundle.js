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

const createHash = require('sha.js');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('CompiledQueryBundle');

/**
 * A script compiler compiles all scripts in a script manager into a compiled
 * script bundle that can easily be called by the runtime.
 * @protected
 */
class CompiledQueryBundle {

    /**
     * Constructor.
     * @param {QueryCompiler} queryCompiler The query compiler to use.
     * @param {QueryManager} queryManager The query manager to use.
     * @param {Object[]} compiledQueries The compiled queries to use.
     */
    constructor(queryCompiler, queryManager, compiledQueries) {
        const method = 'constructor';
        LOG.entry(method, queryCompiler, queryManager, compiledQueries);
        this.queryCompiler = queryCompiler;
        this.queryManager = queryManager;
        this.compiledQueries = compiledQueries;
        this.compiledQueriesByName = {};
        compiledQueries.forEach((compiledQuery) => {
            this.compiledQueriesByName[compiledQuery.name] = compiledQuery;
            this.compiledQueriesByName[compiledQuery.hash] = compiledQuery;
        });
        this.dynamicQueryFile = queryManager.createQueryFile('$dynamic_queries.qry', '');
        LOG.exit(method);
    }

    /**
     * Build and compile a query for use at a later time.
     * @param {string} query The query string.
     * @return {string} An identifier for the query.
     */
    buildQuery(query) {
        const method = 'buildQuery';
        LOG.entry(method, query);

        // Hash the query string.
        const sha256 = createHash('sha256');
        const hash = sha256.update(query, 'utf8').digest('hex');
        LOG.debug(method, 'Calculated query hash', hash);

        // Check to see if the query exists by name.
        let compiledQuery = this.compiledQueriesByName[hash];
        if (compiledQuery) {
            LOG.debug(method, 'Compiled query already exists');
            LOG.exit(method, hash);
            return hash;
        } else {
            LOG.debug(method, 'Compiled query does not exist, compiling');
        }

        // Create a new query.
        const newQuery = this.dynamicQueryFile.buildQuery(hash, 'Dynamic query ' + hash, query);
        compiledQuery = newQuery.accept(this.queryCompiler, {});

        // Store the query for later.
        this.compiledQueriesByName[compiledQuery.name] = compiledQuery;

        LOG.exit(method, hash);
        return hash;
    }

    /**
     * Execute the specified query.
     * @param {DataService} dataService The data service to use.
     * @param {string} query The name of the query, or the query itself.
     * @param {Object} [parameters] The parameters provided for the query.
     * @return {Promise} A promise that is resolved with the results of the
     * query, or rejected with an error.
     */
    execute(dataService, query, parameters) {
        const method = 'execute';
        LOG.entry(method, dataService, query, parameters);

        // Check to see if the query exists by name.
        let compiledQuery = this.compiledQueriesByName[query];
        if (!compiledQuery) {
            throw new Error('The specified query does not exist');
        }

        // Return the results of executing the query.
        LOG.debug(method, 'Found query by name lookup');
        return this.executeInternal(dataService, compiledQuery, parameters)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

    /**
     * Execute the specified query.
     * @param {DataService} dataService The data service to use.
     * @param {Object} compiledQuery The compiled query.
     * @param {Object} [parameters] The parameters provided for the query.
     * @return {Promise} A promise that is resolved with the results of the
     * query, or rejected with an error.
     */
    executeInternal(dataService, compiledQuery, parameters) {
        const method = 'executeInternal';
        LOG.entry(method, dataService, compiledQuery, parameters);

        // Set the parameters if not provided.
        parameters = parameters || {};

        // Get the compiled query string.
        const compiledQueryString = compiledQuery.generator(parameters);

        // Execute the compiled query string.
        return dataService.executeQuery(compiledQueryString)
            .then((result) => {
                LOG.exit(method, result);
                return result;
            });
    }

}

module.exports = CompiledQueryBundle;
