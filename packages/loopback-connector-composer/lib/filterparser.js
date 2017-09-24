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
const LOG = Logger.getLog('FilterParser');
const operationmap = {'=': '==', 'gt': '>', 'gte': '>=', 'lt': '<', 'lte': '<=', 'between': 'between', 'neq': '!='};
const operationmapKeys = Object.keys(operationmap);
const arrayCombinationOperators = {
    'and': 'AND',
    'or': 'OR'
};

/**
 * The fillter parser parse the filter where string and translate the filter JSON object to be a composer query statement
 ** @class
 *
 */
class FilterParser {
    /**
     * Constructor.
     *
     * @private
     */
    constructor() {
        const method = 'constructor';
        LOG.entry(method);
        LOG.exit(method);
    }

    /**
     * parse a filter string and convert the where conditions to be a composer query statement
     * examples of the where filter:
     * filter0 = {'where':{'field1':'value1'}}
     * filter1 = {'where':{'field1':{'between':'[value1:value2]'}}}
     * filter2 = {'where':{'or':[{'field1':{'gt':'value1'}},{'field2':{'lte':'value2'}}]}}
     * filter4 = {'where': {'and':[{'or':[{'f1':{'gt':'v1'}}, {'f2':{'lt':'v2'}}]}, {'and':[{'f3':{'lte':'v3'}},{'or':[{'f4':{'neq':'v4'}}, {'f5':{'lt':'v5'}}]}]}]}}
     * @param {Object} filter The filter being parsed.
     * @param {string} resourceType The type of the resource: asset or participant
     * @return {string} The result of filter parser, or null.
     * @private
     */
    static parseFilter(filter, resourceType) {
        const method = 'parseFilter';
        LOG.entry(method, JSON.stringify(filter));

        let result = null;
        let filterKeys = Object.keys(filter);

        if (filterKeys.indexOf('where') >= 0) {
            result = this.parseWhereCondition(filter.where);
            // if there is an op
            result = 'SELECT ' + resourceType + ' WHERE' + result;
        }
        LOG.exit(method);
        return result;
    }
    /**
     * parse the filter where conditions and convert the conditions to be the query language statement
     * @example the filter conditions
     * {"f1":"v1"} or {"f1":{"op":"v1"}} or
     * {"and|or":[{"f1":{"op":"v1"}}, {"f2":{"op":"v2"}}]}, or
     * {"and|or":[{"and|or":[{"f1":{"op":"v1"}}, {"f2":{"op":"v2"}}], {"f3":{"op":"v3"}}]}},
     * and so on with nested structures
     * @param {Object} whereObject  is a JSON object with the format as above examples
     * @return {string} a string condition (f1 == v1) or (f1 > v1) or recurively call this function, throw exceptions when the operators are not supported
     * @public
     */
    static parseWhereCondition(whereObject) {
        const method = 'parseWhereCondition';
        LOG.entry(method, JSON.stringify(whereObject));
        const keys = Object.keys(whereObject);
        const combinationOperatorKeys = Object.keys(arrayCombinationOperators);
        if (keys.length === 0) {
            throw new Error('There is no full where clause');
        } else if (keys.length === 1) {
            let values = whereObject[keys[0]];
            if(values !== null && values !== undefined ){
                if (typeof values === 'string') {
                    if(!values.startsWith('_$')){
                        values = '\'' + values + '\'';
                    }
                    const result = '(' + keys[0] + '==' + values + ')';
                    return result;
                } else if (typeof values === 'number'){
                    const result = '(' + keys[0] + '==' + values + ')';
                    return result;
                }
                else if(typeof values === 'object' && !(values instanceof Array)) {
                    let op = Object.keys(values);
                    if (op.length === 1) {
                        const opValue = values[op[0]];
                        // let queryOp = this.findElementValueByKey(operationmap, op[0]);
                        if(!operationmapKeys.includes(op[0])){
                            throw new Error('The key ' + op[0] + 'operator is not supported by the Composer filter where.');
                        }
                        let queryOp = operationmap[op[0]];
                        let result;
                        if(queryOp ==='between'){
                            // parse the first string format array object "[1, 10]" to an array
                            let theValue = JSON.parse(opValue);
                            result = '(' + keys[0] + '>=' + theValue[0] +' AND '+ keys[0] + '<=' + theValue[1] +')';
                        }else{
                            result = '(' + keys[0] + queryOp + opValue + ')';
                        }
                        return result;
                    }
                } else if (combinationOperatorKeys.includes(keys[0]) && (values instanceof Array)) {
                    if (values.length === 2) {
                        let result1 = this.parseWhereCondition(values[0]);
                        let result2 = this.parseWhereCondition(values[1]);
                        let combinationOp = arrayCombinationOperators[keys[0]];
                        return '(' + result1 + combinationOp + result2 + ')';
                    }
                }
            }
        }
    }
}
module.exports = FilterParser;
