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

describe('FilterParser', () => {
    beforeEach(() => {
        new FilterParser();
        // const filter1 = {'f1':'v1'};
        // const filter2 = {'f1':{'gt':'v1'}} ;
        // const filter3 = {'and|or':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
        // const filter4 =  {'and|or':[{'and|or':[{'f1':{'op':'v1'}}, {'f2':{'op':'v2'}}]}, {'f3':{'op':'v3'}}]};
        // const queryString ={
        //     filter1: 'SELECT org.acme.base.TestAsset WHERE (f1 == v1)',
        //     filter2: 'SELECT org.acme.base.TestAsset WHERE (f1 <= v1)',
        //     filter3: 'SELECT org.acme.base.TestAsset WHERE (f1 == v1)',
        //     filter4: 'SELECT org.acme.base.TestAsset WHERE (f1 == v1)'
        // };
    });

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
            const whereObject = {'f1':'v1'};
            const whereCondition = '(f1==\'v1\')';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return an integer value of a where condition', () => {
            const whereObject = {'f1':10};
            const whereCondition = '(f1==10)';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return a where condition with a great than operator', () => {
            const whereObject = {'f1':{'gt':'v1'}};
            const whereCondition = '(f1>v1)';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should throw when a where condition with an unsupported operator', () => {
            const whereObject = {'f1':{'unknown':'v1'}};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The key unknown operator is not supported by the Composer filter where/);
        });

        it('should return when a where condition with a between operator', () => {
            const whereObject = {'f1':{'between':'[1,10]'}};
            const whereCondition = '(f1>=1 AND f1<=10)';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should return when a where condition with a combination of the and operation', () => {
            const whereObject = {'and':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            const whereCondition = '((f1<=v1) AND (f2!=v2))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });
        it('should return when a where condition with a combination of the or operation', () => {
            const whereObject = {'or':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            const whereCondition = '((f1<=v1) OR (f2!=v2))';
            FilterParser.parseWhereCondition(whereObject).should.equal(whereCondition);
        });

        it('should throw when a where condition with an unknown combination operator', () => {
            const whereObject = {'unknown':[{'f1':{'lte':'v1'}}, {'f2':{'neq':'v2'}}]};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The combination operator: unknown is not supported by the Composer filter where/);
        });

        it('should throw when a where condition with a valid combination operator but with only one condiiton', () => {
            const whereObject = {'and':[{'f1':{'lte':'v1'}}, ]};
            (() => {
                FilterParser.parseWhereCondition(whereObject);
            }).should.throw(/The combination operator: and should have two conditions/);
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
            }).should.throw(/The where object is empty/);
        });
        it('should throw when the where object key is undefind', () => {
            (() => {
                FilterParser.parseWhereCondition({'' :'v1'});
            }).should.throw(/The where object key is invalid/);
        });

        it('should throw when the where object value is null', () => {
            (() => {
                FilterParser.parseWhereCondition({'key1' : null});
            }).should.throw(/The object value is invalid/);
        });
        it('should throw when the where object value is undefind', () => {
            (() => {
                FilterParser.parseWhereCondition({'key1' : undefined});
            }).should.throw(/The object value is invalid/);
        });

    });

});