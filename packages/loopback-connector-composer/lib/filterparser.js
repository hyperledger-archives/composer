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
const operationmap = {'gt': '>', 'gte': '>=', 'lt': '<', 'lte': '<=', 'between': 'between', 'neq': '!='};
const operationmapKeys = Object.keys(operationmap);
const arrayCombinationOperators = {
    'and': 'AND',
    'or': 'OR'
};
const combinationOperatorKeys = Object.keys(arrayCombinationOperators);

/**
 * The fillter parser parse the filter where string and translate the filter JSON object to be a composer query statement
 * @class
 *
 */
class FilterParser {
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
     * @public
     */
    static parseFilter(filter, resourceType) {
        const method = 'parseFilter';
        LOG.entry(method, JSON.stringify(filter));

        let result = null;
        let filterKeys = Object.keys(filter);

        if (filterKeys.indexOf('where') >= 0) {
            result = this.parseWhereCondition(filter.where);
            // if there is an op
            result = 'SELECT ' + resourceType + ' WHERE ' + result;
        } else{
            throw new Error('The filter does not contain the where key');
        }
        LOG.exit(method);
        return result;
    }
    /** parse a single condition that has only one key
     * examples are: {"f1":"v1"} or {"f1":{"op":"v1"}}
     * @param {string} key is a property name of a JSON object
     * @param {string} op is an operator supported by the composer query
     * @param {any} value is a property value of a JSON object
     * @return {string} return a string condition eg. (f1 == v1 AND f2 == v2) or throw errors when any of these input are invalid
     */
    static parsePropertyValue(key, op, value){
        let result;

        if( typeof key === 'undefined' || key === null || key.trim() ===''){
            throw new Error('A property name is invalid');
        }
        if( typeof op === 'undefined' || op === null || op.trim() ==='') {
            throw new Error('The operator is invalid');
        }
        if( typeof value === 'undefined' || value === null){
            throw new Error('The value is invalid');
        }

        if (typeof value === 'string') {
            if(value.startsWith('_$')){
                throw new Error('The filter where does not support a parameter');
            }
            value = '\''+ value +'\'';
            result = '(' + key + op + value + ')';
        } else if (typeof value === 'number' || typeof value === 'boolean'){

            result = '(' + key + op + value + ')';
        } else if ( this.isDateTime(value)){
            let datetimeValue = JSON.stringify(value);
            result = '(' + key + op + '\'' + JSON.parse(datetimeValue) + '\')';
        } else{
            throw new Error('Unsupported primitive type value');
        }
        return result;
    }

    /**
     * parseObjectValue parses a Javascript object as below example
     * {"op" : "value"} or {"bwteen": [1, 100]} the op any other supported operator in composer loopback
     * @param {string} key is the property name
     * @param {object} keyObject is a Javascript object as above.
     * @return {string} returns a composer query where condition, or throw errors when the {"op1": "value", "op2":"value2"}
     */
    static parseObjectValue(key, keyObject){

        let op = Object.keys(keyObject);

        if( op.length !== 1){
            throw new Error('The loopback user input operator has more than one operators in a field object');
        }
        if(!operationmapKeys.includes(op[0])){
            throw new Error('The key ' + op[0] + ' operator is not supported by the Composer filter where');
        }
        const queryOp = operationmap[op[0]];
        const opValue = keyObject[op[0]];
        let result;
        if(queryOp ==='between'){
            // parse the first string format array object "[1, 10]" to an array
            let theStrValue = JSON.stringify(opValue);
            let theValue = JSON.parse(theStrValue);
            if( !(theValue instanceof Array) || theValue.length !== 2){
                throw new Error('The between value is not an array or does not have two elements');
            }
            //support number, datetime and string for the between operator
            if(this.isPrimitiveTypeValue(theValue[0]) && this.isPrimitiveTypeValue(theValue[1]) &&
                typeof theValue[0] !== 'boolean' && typeof theValue[1] !== 'boolean'){

                result = '('+this.parsePropertyValue(key, '>=', theValue[0]) + ' AND ' +
                             this.parsePropertyValue(key, '<=', theValue[1]) +')';
            }else{
                throw new Error('Unsupported data type for the between operator');
            }
        } else if (this.isPrimitiveTypeValue(opValue)){

            result = this.parsePropertyValue(key, queryOp, opValue);
        } else {
            throw new Error('The type of the operator value: ' + typeof opValue + ' is not supported.');
        }

        return result;
    }

    /**
     * isDateTime parses if an object is the Datetime value
     * @param {object} value an object value is a datetime value eg. value = 2017-09-26T14:43:48.444Z
     * @return {boolean} true if the value is a datetime value, false otherwise, or throw an expection
     */
    static isDateTime(value){
        let isDateTimeType = false;
        if( value !== null && typeof value ==='object' && Object.prototype.toString.call(value) === '[object Date]'){
            isDateTimeType = true;
        }
        return isDateTimeType;
    }
    /**
     * @param {any} value a literal value of any type of a string, number, boolean or datetime
     * @return {boolean} true if the value type is a string, number, boolean or datetime, false otherwise
     */
    static isPrimitiveTypeValue(value){
        let isPrimitive = false;

        if( typeof value === 'undefined' || value === null){
            throw new Error('The value: ' + value + ' is invalid');
        }
        if(typeof value === 'string' || typeof value ==='number' || typeof value ==='boolean'){
            isPrimitive = true;
        }else if(this.isDateTime(value)){
            isPrimitive = true;
        }
        return isPrimitive;
    }
    /**
     * parse the filter where conditions and convert the conditions to be the query language statement
     * @example the filter conditions
     * {"f1":"v1"} or {"f1":"v1",  "f2": {"op":"v2"}, ...}, or {"f1":{"op":"v1"}}
     * {"and|or":[{"f1":{"op":"v1"}}, {"f2":{"op":"v2"}}]}, or
     * {'and|or':[{'and|or':[{'f1':{'op':'v1'}}, {'f2':{'op':'v2'}}]}, {'f3':{'op':'v3'}}]};
     * and so on with nested structures
     * @param {Object} whereObject  is a JSON object with the format as above examples
     * @return {string} a string condition (f1 == v1) or (f1 > v1) or recurively call this function, throw exceptions when the operators are not supported
     * @public
     */
    static parseWhereCondition(whereObject) {
        const method = 'parseWhereCondition';
        LOG.entry(method, JSON.stringify(whereObject));

        if(typeof whereObject === 'undefined'|| whereObject === null){
            throw new Error('The where object is not specified');
        }
        const keys = Object.keys(whereObject);
        const numKeys = keys.length;
        if(numKeys === 1){
            if(keys[0].trim() ===''){
                throw new Error('The where object key is invalid');
            }
            let values = whereObject[keys[0]];
            if(this.isPrimitiveTypeValue(values)){

                const result = this.parsePropertyValue(keys[0], '==', values);
                return result;
            }
            else if(typeof values === 'object' && !(values instanceof Array)) {
                let result = this.parseObjectValue(keys[0], values);
                return result;
            } else{
                //values are the instance of array
                if(!combinationOperatorKeys.includes(keys[0])){
                    throw new Error('The combination operator: ' +keys[0] + ' is not supported by the Composer filter where');
                }
                const numValues = values.length;
                if( numValues < 2){
                    throw new Error('The combination operator: ' + keys[0] + ' at least have two conditions');
                }
                // the and|or operator support multiple conditions
                const combinationOp = arrayCombinationOperators[keys[0]];
                let result = '(';
                for( let n=0; n<numValues;n++){
                    result += this.parseWhereCondition(values[n]);
                    if ( n < numValues - 1){
                        result = result + ' ' + combinationOp + ' ';
                    }
                }
                result += ')';

                return result;
            }
        }else if( numKeys > 1 ){
            // handle multiple with primitive type values and link them with AND
            let result ='(';
            for( let n = 0; n < numKeys; n++ ) {
                let key = keys[n];
                let value = whereObject[key];
                if( this.isPrimitiveTypeValue(value) ){
                    result += this.parsePropertyValue(key, '==', value);

                }else if( typeof value === 'object' && !(value instanceof Array)){
                    result += this.parseObjectValue(key, value);
                }else{
                    throw new Error('Only support multiple properties with primitive type of values');
                }
                if ( n < numKeys -1){
                    result += ' AND ';
                }
            }
            result += ')';
            return result;
        }
        else{
            throw new Error('The where object does not have one key');
        }
    }
}
module.exports = FilterParser;
