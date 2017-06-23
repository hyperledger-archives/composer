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

const fs = require('fs');
const Limit = require('../../lib/query/limit');
const ModelManager = require('../../lib/modelmanager');
const OrderBy = require('../../lib/query/orderby');
const parser = require('../../lib/query/parser');
const path = require('path');
const Query = require('../../lib/query/query');
const QueryFile = require('../../lib/query/queryfile');
const Select = require('../../lib/query/select');
const Skip = require('../../lib/query/skip');
const Where = require('../../lib/query/where');

const should = require('chai').should();
const sinon = require('sinon');

describe('Select', () => {

    const testModel = fs.readFileSync(path.resolve(__dirname, './model.cto'), 'utf8');

    let modelManager;
    let sandbox;
    let mockQuery;
    let mockQueryFile;

    const select = parser.parse('SELECT org.acme.Driver', { startRule: 'SelectStatement' });

    const selectWhere = parser.parse('SELECT org.acme.Driver WHERE (prop = "value")', { startRule: 'SelectStatement' });

    const selectWhereOrderBy = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") ORDER BY [id ASC]', { startRule: 'SelectStatement' });

    const selectWhereLimit = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") LIMIT 10', { startRule: 'SelectStatement' });

    const selectWhereLimitSkip = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") LIMIT 10 SKIP 5', { startRule: 'SelectStatement' });

    const selectFrom = parser.parse('SELECT org.acme.Driver FROM DogesDrivers', { startRule: 'SelectStatement' });

    const selectConcept = parser.parse('SELECT org.acme.Address', { startRule: 'SelectStatement' });

    const selectEnum = parser.parse('SELECT org.acme.Enum', { startRule: 'SelectStatement' });

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        sandbox = sinon.sandbox.create();
        mockQuery = sinon.createStubInstance(Query);
        mockQueryFile = sinon.createStubInstance(QueryFile);
        mockQuery.getQueryFile.returns(mockQueryFile);
        mockQueryFile.getModelManager.returns(modelManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null query provided', () => {
            (() => {
                new Select(null, null);
            }).should.throw(/Invalid Query or AST/);
        });

        it('should throw when null ast provided', () => {
            (() => {
                new Select(mockQuery, null);
            }).should.throw(/Invalid Query or AST/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let s = new Select(mockQuery, select);
            let visitor = {
                visit: sinon.stub()
            };
            s.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, s, ['some', 'args']);
        });
    });

    describe('#getQuery', () => {

        it('should return the query', () => {
            const s = new Select(mockQuery, select);
            s.getQuery().should.equal(mockQuery);
        });

    });

    describe('#validate', () => {

        it('should throw for concept resources', () => {
            const s = new Select(mockQuery, selectConcept);
            (() => {
                s.validate();
            }).should.throw(/Can only select/);
        });

        it('should throw for enum resources', () => {
            const s = new Select(mockQuery, selectEnum);
            (() => {
                s.validate();
            }).should.throw(/Can only select/);
        });

    });

    describe('#getResource', () => {

        it('should return the resource', () => {
            const s = new Select(mockQuery, select);
            s.getResource().should.equal('org.acme.Driver');
        });

    });

    describe('#getRegistry', () => {

        it('should return null if the registry is not specified', () => {
            const s = new Select(mockQuery, select);
            should.equal(s.getRegistry(), null);
        });

        it('should return the registry', () => {
            const s = new Select(mockQuery, selectFrom);
            s.getRegistry().should.equal('DogesDrivers');
        });

    });

    describe('#getWhere', () => {

        it('should return null if the where clause is not specified', () => {
            const s = new Select(mockQuery, select);
            should.equal(s.getWhere(), null);
        });

        it('should return the where clause', () => {
            const s = new Select(mockQuery, selectWhere);
            const where = s.getWhere();
            where.should.be.an.instanceOf(Where);
            where.getAST().type.should.equal('AssignmentExpression');
        });

    });

    describe('#getOrderBy', () => {

        it('should return null if the order by clause is not specified', () => {
            const s = new Select(mockQuery, select);
            should.equal(s.getWhere(), null);
        });

        it('should return the order by clause', () => {
            const s = new Select(mockQuery, selectWhereOrderBy);
            const orderBy = s.getOrderBy();
            orderBy.should.be.an.instanceOf(OrderBy);
            orderBy.getSortCriteria().should.have.lengthOf(1);
        });

    });

    describe('#getLimit', () => {

        it('should return null if the limit clause is not specified', () => {
            const s = new Select(mockQuery, select);
            should.equal(s.getLimit(), null);
        });

        it('should return the limit clause', () => {
            const s = new Select(mockQuery, selectWhereLimit);
            const limit = s.getLimit();
            limit.should.be.an.instanceOf(Limit);
            limit.getAST().type.should.equal('Literal');
        });

    });

    describe('#getSkip', () => {

        it('should return null if the skip clause is not specified', () => {
            const s = new Select(mockQuery, select);
            should.equal(s.getSkip(), null);
        });

        it('should return the limit clause', () => {
            const s = new Select(mockQuery, selectWhereLimitSkip);
            const skip = s.getSkip();
            skip.should.be.an.instanceOf(Skip);
            skip.getAST().type.should.equal('Literal');
        });

    });

    describe('#getText', () => {

        it('should return the statement text', () => {
            const s = new Select(mockQuery, select);
            s.getText().should.equal('SELECT org.acme.Driver');
        });

    });

});
