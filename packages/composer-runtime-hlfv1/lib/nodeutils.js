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

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('NodeUtils');


/**
 * Set of utilities.
 */
class NodeUtils {

    /**
     * Get all results from an iterator.
     *
     * @static
     * @param {any} iterator the chaincode iterator
     * @returns {promise} a promise that is resolved with the results or rejected or error
     */
    static async getAllResults(iterator) {
        const method = 'getAllResults';
        LOG.entry(method, iterator);
        const t0 = Date.now();

        let results = [];
        let logResults = [];
        let res = {done: false};
        while (!res.done) {
            res = await iterator.next();  //TODO: should we catch an error or just let it flow up the stack
            if (res && res.value && res.value.value) {
                let val = res.value.value.toString('utf8');
                if (val.length > 0) {
                    results.push(JSON.parse(val));
                    logResults.push(val);
                }
            }
            if (res && res.done) {
                try {
                    await iterator.close();
                }
                catch(err) {
                    // log the fact the close had a problem, but that
                    //doesn't affect the workings
                    const warnMsg = 'Failure to close iterator. ' + err;
                    LOG.warn(warnMsg);
                }
                LOG.exit(method, logResults);
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                return results;
            }
        }
    }

    /**
     * Get all results from an iterator.
     *
     * @static
     * @param {any} iterator the chaincode iterator
     * @param {any} stub the stub for this invocation
     * @returns {promise} a promise that is resolved with the results or rejected or error
     */
    static async deleteAllResults(iterator, stub) {
        const method = 'deleteAllResults';
        LOG.entry(method, iterator, stub);
        const t0 = Date.now();

        let results = [];
        let logResults = [];
        let res = {done: false};
        while (!res.done) {
            res = await iterator.next();  //TODO: should we catch an error or just let it flow up the stack
            if (res && res.value && res.value.key) {
                LOG.debug(method, 'deleting ' + res.value.key);
                await stub.deleteState(res.value.key); //TODO: should we catch an error or just let it flow up the stack
            }
            if (res && res.done) {
                try {
                    await iterator.close();
                }
                catch(err) {
                    // log the fact the close had a problem, but that
                    //doesn't affect the workings
                    const warnMsg = 'Failure to close iterator. ' + err;
                    LOG.warn(warnMsg);
                }
                LOG.exit(method, logResults);
                LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
                return results;
            }
        }
    }
}

module.exports = NodeUtils;
