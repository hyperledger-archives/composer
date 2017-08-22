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

const QueryAnalyzer = require('../../lib/query/queryanalyzer');
const Query = require('../../lib/query/query');
const Select = require('../../lib/query/select');
const parser = require('../../lib/query/parser');

const QueryFile = require('../../lib/query/queryfile');
const ModelManager = require('../../lib/modelmanager');
require('chai').should();
const sinon = require('sinon');

describe('QueryAnalyzer', () => {

    let queryAnalyzer;
    let mockQuery;
    let mockQueryFile;
    let sandbox;

    beforeEach(() => {
        const modelManager = new ModelManager();
        modelManager.addModelFile(
        `
        namespace org.acme

        enum ContactType {
            o MOBILE
            o FAX
            o LANDLINE
        }

        concept PhoneDetails {
            o String phoneNumber
            o ContactType contactType
        }

        concept Address {
            o String city
            o PhoneDetails phoneDetails
        }

        participant Driver identified by driverId {
            o String driverId
            o String name
            o Address address
            o Integer age
        }

        asset Vehicle identified by vin {
            o String vin
            --> Driver driver
        }
        `, 'test');

        mockQuery = sinon.createStubInstance(Query);
        mockQueryFile = sinon.createStubInstance(QueryFile);
        mockQuery.getQueryFile.returns(mockQueryFile);
        mockQueryFile.getModelManager.returns(modelManager);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null Query provided', () => {
            (() => {
                new QueryAnalyzer(null);
            }).should.throw(/Invalid query/);
        });
    });

    describe('#analyze', () => {

        it('should call the visitor', () => {
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            queryAnalyzer.analyze();
            sinon.assert.calledOnce(mockQuery.accept);
        });

    });

    describe('#visitQuery', () => {

        it('should process select with a single string param', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (name == _$param1) LIMIT 10 SKIP 5', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with a single integer LIMIT param', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (name == \'Dan\') LIMIT _$param1 SKIP 5', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('Integer');
        });

        it('should process select with a single integer SKIP param', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (name == \'Dan\') LIMIT 5 SKIP _$param1', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('Integer');
        });

        it('should process select with an order by', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (name == _$param1) ORDER BY name DESC', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with a member expression', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (address.city == _$param1)', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with a member expression with param on RHS', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (_$param1 == address.city)', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with an array combination operator', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE ((address.city == _$param1) AND (age > _$param2))', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(2);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
            result[1].name.should.equal('param2');
            result[1].type.should.equal('Integer');
        });

        it('should process select with a 3 level member expression', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (address.phoneDetails.phoneNumber == _$param1)', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with a 3 level member expression on enum', () => {
            const ast = parser.parse('SELECT org.acme.Driver WHERE (address.phoneDetails.contactType == _$param1)', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('param1');
            result[0].type.should.equal('String');
        });

        it('should process select with relationship', () => {
            const ast = parser.parse('SELECT org.acme.Vehicle WHERE (_$driverParam == driver)', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(1);
            result[0].name.should.equal('driverParam');
            result[0].type.should.equal('String');
        });

        it('should process select without a WHERE', () => {
            const ast = parser.parse('SELECT org.acme.Vehicle', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(0);
        });

        it('should process select with a hardcoded limit', () => {
            const ast = parser.parse('SELECT org.acme.Vehicle LIMIT 5', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(0);
        });

        it('should process select with a hardcoded skip', () => {
            const ast = parser.parse('SELECT org.acme.Vehicle SKIP 5', { startRule: 'SelectStatement' });
            const select = new Select(mockQuery, ast);
            mockQuery.getSelect.returns(select);
            queryAnalyzer = new QueryAnalyzer( mockQuery );
            const result = queryAnalyzer.visit(mockQuery, {});
            result.should.not.be.null;
            result.length.should.equal(0);
        });

        it('should throw when using missing property', () => {
            (() => {
                const ast = parser.parse('SELECT org.acme.Driver WHERE (address.foo == _$param1)', { startRule: 'SelectStatement' });
                const select = new Select(mockQuery, ast);
                mockQuery.getSelect.returns(select);
                queryAnalyzer = new QueryAnalyzer( mockQuery );
                const result = queryAnalyzer.visit(mockQuery, {});
                result.should.not.be.null;
                result.length.should.equal(0);
            }).should.throw(/Property foo does not exist on org.acme.Address/);
        });

        it('should throw when parameter is not a primitive, enum or relationship', () => {
            (() => {
                const ast = parser.parse('SELECT org.acme.Driver WHERE (address == _$param1)', { startRule: 'SelectStatement' });
                const select = new Select(mockQuery, ast);
                mockQuery.getSelect.returns(select);
                queryAnalyzer = new QueryAnalyzer( mockQuery );
                const result = queryAnalyzer.visit(mockQuery, {});
                result.should.not.be.null;
                result.length.should.equal(0);
            }).should.throw(/Unsupported property type org.acme.Driver.address/);
        });

        it('should throw when using invalid AST', () => {
            (() => {
                const ast = parser.parse('SELECT org.acme.Driver WHERE (address == _$param1)', { startRule: 'SelectStatement' });
                ast.where.type = 'DAN';
                const select = new Select(mockQuery, ast);
                mockQuery.getSelect.returns(select);
                queryAnalyzer = new QueryAnalyzer( mockQuery );
                const result = queryAnalyzer.visit(mockQuery, {});
                result.should.not.be.null;
                result.length.should.equal(0);
            }).should.throw(/Unrecognised type/);
        });

    });
});