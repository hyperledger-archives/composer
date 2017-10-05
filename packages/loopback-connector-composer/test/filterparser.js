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

const FilterParser = require('../lib/filterparser');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const resourceType = 'org.acme.base.TestAsset';
let whereObject;
let whereCondition;

describe('FilterParser', () => {

    describe('#parseFilter', () => {

        it('should return the correct select statement', () => {
            const filter1 = {'where':{'f1':'v1'}};
            const queryString = 'SELECT org.acme.base.TestAsset WHERE (f1==\'v1\')';
            FilterParser.parseFilter(filter1, resourceType).should.equal(queryString);
        });

        it('should throw when the where object is not specified', () => {
            const filter1 = {'nowhere':{'f1':'v1'}};
            (() => {FilterParser.parseFilter(filter1, resourceType);
            }).should.throw(/The filter does not contain the where key/);
        });
    });

    describe('#parseWhereCondition', () => {

        it('should return the string value of a where condition', () => {
            whereObject = {'f1':'v1'};
            whereCondition = '(f1==\'v1\')';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return an integer value of a where condition', () => {
            whereObject = {'f1':10};
            whereCondition = '(f1==10)';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return a boolean value of a where condition', () => {
            whereObject = {'f1':true};
            whereCondition = '(f1==true)';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return a Datetime value of a where condition', () => {
            whereObject = {'f1':{'gt':'2017-09-26T14:43:48.444Z'}};
            whereCondition = '(f1>\'2017-09-26T14:43:48.444Z\')';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return a Datetime value of a where condition', () => {
            whereObject = {'f1':'2017-09-26T14:43:48.444Z'};
            whereCondition = '(f1==\'2017-09-26T14:43:48.444Z\')';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return a where condition with a great than operator', () => {
            whereObject = {'f1':{'gt':'v1'}};
            whereCondition = '(f1>\'v1\')';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should throw when a where condition with a parameter', () => {
            (() => {
                whereObject = {'f1':'_$param'};
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The filter where does not support a parameter/);
        });

        it('should throw when a where condition with an unsupported operator', () => {
            (() => {
                whereObject = {'f1':{'unknown':'v1'}};
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The key unknown operator is not supported by the Composer filter where/);
        });

        it('should throw when a field value has more than one keys', () => {
            (() => {
                whereObject = {'f1':{'lte':'v1', 'gt':'v2'}};
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The loopback user input operator has more than one operators in a field object/);
        });

        it('should return when a where condition with a between operator', () => {
            whereObject = {'f1':{'between':[1,10]}};
            whereCondition = '((f1>=1) AND (f1<=10))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a between operator', () => {
            (() => {
                whereObject = {'f1':{'between':[1,10,20]}};
                FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
            }).should.throw(/The between value is not an array or does not have two elements/);
        });

        it('should return when a where condition with a combination of the and operation', () => {
            whereObject = {'and':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            whereCondition = '((f1<=\'v1\') AND (f2!=\'v2\'))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a combination of the or operation', () => {
            whereObject = {'or':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            whereCondition = '((f1<=\'v1\') OR (f2!=\'v2\'))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a combination of the and|or operators in a nested structure ', () => {
            whereObject = {'or':[{'f1':{'lte':'v1'}}, {'and':[{'f2':{'neq':'v2'}}, {'f3':{'neq':'v3'}}]}]};
            whereCondition = '((f1<=\'v1\') OR ((f2!=\'v2\') AND (f3!=\'v3\')))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where top level condition has multiple properties with operators', () => {
            whereObject = {'f1':{'lte':'v1'}, 'f2':{'neq':'v2'}};
            whereCondition = '((f1<=\'v1\') AND (f2!=\'v2\'))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where top level condition has multiple properties with the default format', () => {
            whereObject = {'f1':'v1', 'f2':'v2'};
            whereCondition = '((f1==\'v1\') AND (f2==\'v2\'))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where top level condition has multiple properties with a mixture of operators', () => {
            whereObject = {'f1':'v1', 'f2':'v2', 'f3':{'lte':'v3'},};
            whereCondition = '((f1==\'v1\') AND (f2==\'v2\') AND (f3<=\'v3\'))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should throw when a where top level condition has multiple properties with non-primitive type of values', () => {
            whereObject = {'f1':'v1', 'f2':'v2', 'f3':[{'f4':{'lte':'v4'},'f5':'v5'}]};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/Only support multiple properties with primitive type of values/);
        });

        it('should throw when a where condition with an unknown combination operator', () => {
            whereObject = {'unknown':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The combination operator: unknown is not supported by the Composer filter where/);
        });

        it('should throw when a where condition with a valid combination operator but with only one condiiton', () => {
            whereObject = {'and':[{'f1':{'lte':'v1'}}, ]};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The combination operator: and at least have two conditions/);
        });

        it('should throw when the where object is null', () => {
            (() => {
                FilterParser.parseWhereCondition(null);
            }).should.throw(/The where object is not specified/);
        });

        it('should throw when the where object is undefined', () => {
            (() => {
                FilterParser.parseWhereCondition(undefined);
            }).should.throw(/The where object is not specified/);
        });

        it('should throw when the where object has an empty key', () => {
            (() => {
                FilterParser.parseWhereCondition({});
            }).should.throw(/The where object does not have one key/);
        });
        it('should throw when the where object key is undefind', () => {
            (() => {
                FilterParser.parseWhereCondition({'' :'v1'});
            }).should.throw(/The where object key is invalid/);
        });

        it('should throw when the where object value is null', () => {
            (() => {
                FilterParser.parseWhereCondition({'key1' : null});
            }).should.throw(/The value: null is invalid/);
        });
        it('should throw when the where object value is undefind', () => {
            (() => {
                FilterParser.parseWhereCondition({'key1' : undefined});
            }).should.throw(/The value: undefined is invalid/);
        });
    });

    describe('#parsePropertyValue', () => {

        it('should be able to parse a datetime type value', () => {
            const result = '(f1<=\'2017-09-26T14:43:48.444Z\')';
            FilterParser.parsePropertyValue('f1', '<=', '2017-09-26T14:43:48.444Z').should.equal(result);
        });

        it('should be able to parse a datetime type value with equality operator' , () => {
            const result = '(f1==\'2017-09-26T14:43:48.444Z\')';
            const dt = new Date('2017-09-26T14:43:48.444Z');
            FilterParser.parsePropertyValue('f1', '==', dt).should.equal(result);
        });

        it('should be able to parse a string type value', () => {
            const result = '(f1<=\'v1\')';
            FilterParser.parsePropertyValue('f1', '<=', 'v1').should.equal(result);
        });

        it('should be able to parse a number type value', () => {
            const result = '(f1<=10.5)';
            FilterParser.parsePropertyValue('f1', '<=', 10.5).should.equal(result);
        });

        it('should be able to parse a boolean type value', () => {
            const result = '(f1==\'true\')';
            FilterParser.parsePropertyValue('f1', '==','true').should.equal(result);
        });

        it('should throw when the key is undefined', () => {
            (() => {FilterParser.parsePropertyValue(undefined, 'op', 'v1');
            }).should.throw(/A property name is invalid/);
        });

        it('should throw when the key is null', () => {
            (() => {FilterParser.parsePropertyValue(null, 'op', 'v1');
            }).should.throw(/A property name is invalid/);
        });

        it('should throw when the key is empty', () => {
            (() => {FilterParser.parsePropertyValue(' ', 'op', 'v1');
            }).should.throw(/A property name is invalid/);
        });

        it('should throw when the operator is undefined', () => {
            (() => {FilterParser.parsePropertyValue('f1', undefined, 'v1');
            }).should.throw(/The operator is invalid/);
        });

        it('should throw when the operator is null', () => {
            (() => {FilterParser.parsePropertyValue('f1', null, 'v1');
            }).should.throw(/The operator is invalid/);
        });

        it('should throw when the operator is empty', () => {
            (() => {FilterParser.parsePropertyValue('f1', ' ', 'v1');
            }).should.throw(/The operator is invalid/);
        });

        it('should throw when the value is undefined', () => {
            (() => {FilterParser.parsePropertyValue('f1', '===', undefined);
            }).should.throw(/The value is invalid/);
        });

        it('should throw when the value is null', () => {
            (() => {FilterParser.parsePropertyValue('f1', '>=', null);
            }).should.throw(/The value is invalid/);
        });

        it('should throw when the value type is an array', () => {
            (() => {FilterParser.parsePropertyValue('f1', '==', [1, 2, 3]);
            }).should.throw(/Unsupported primitive type value/);
        });

    });

    describe('#parseObjectValue',()=> {

        it('should return when a where condition with a between operator for numbers', () => {
            const keyObject = {'between':[2,10]};
            whereCondition = '((f1>=2) AND (f1<=10))';
            FilterParser.parseObjectValue('f1', keyObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a between operator for strings', () => {
            const keyObject = {'between':['Alex','Emma']};
            whereCondition = '((f1>=\'Alex\') AND (f1<=\'Emma\'))';
            FilterParser.parseObjectValue('f1',keyObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a between operator for strings', () => {
            const keyObject = {'between':['2017-09-26T14:43:48.444Z','2017-12-26T14:43:48.444Z']};
            whereCondition = '((f1>=\'2017-09-26T14:43:48.444Z\') AND (f1<=\'2017-12-26T14:43:48.444Z\'))';
            FilterParser.parseObjectValue('f1', keyObject).should.equal(whereCondition);
        });

        it('should throw when parse a property value that is not a primitive value', () => {
            (() => {FilterParser.parseObjectValue('f1', {'gt': [1, 2, 3]});
            }).should.throw(/The type of the operator value: object is not supported/);
        });

        it('should throw when the between operator value are boolean type', () => {
            (() => {FilterParser.parseObjectValue('f1', {'between': [false, true]});
            }).should.throw(/Unsupported data type for the between operator/);
        });
    });

    describe('#isDateTime',()=> {
        const testDate = new Date('2017-09-26T14:43:48.444Z');

        FilterParser.isDateTime(testDate).should.be.true;
    });

    describe('#isPrimitiveTypeValue',()=> {
        const testDate = new Date('2017-09-26T14:43:48.444Z');

        FilterParser.isPrimitiveTypeValue(testDate).should.be.true;
    });
});