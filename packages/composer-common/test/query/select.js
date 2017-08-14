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

/**
 * Returns the AST for a SELECT query expression
 * @param {String} selectExpression - the SELECT for the query
 * @returns {object} the AST
 * @private
 */
function toSelectAst(selectExpression) {
    return parser.parse(selectExpression, { startRule: 'SelectStatement' });
}

describe('Select', () => {

    const testModel = fs.readFileSync(path.resolve(__dirname, '../data/query/model.cto'), 'utf8');

    let modelManager;
    let sandbox;
    let mockQuery;
    let mockQueryFile;

    const select = parser.parse('SELECT org.acme.Driver', { startRule: 'SelectStatement' });

    const selectWhere = parser.parse('SELECT org.acme.Driver WHERE (firstName == "value")', { startRule: 'SelectStatement' });

    const selectWhereOrderBy = parser.parse('SELECT org.acme.Driver WHERE (prop == "value") ORDER BY [id ASC]', { startRule: 'SelectStatement' });

    const selectWhereLimit = parser.parse('SELECT org.acme.Driver WHERE (prop == "value") LIMIT 10', { startRule: 'SelectStatement' });

    const selectWhereLimitSkip = parser.parse('SELECT org.acme.Driver WHERE (prop == "value") LIMIT 10 SKIP 5', { startRule: 'SelectStatement' });

    const selectFrom = parser.parse('SELECT org.acme.Driver FROM DogesDrivers', { startRule: 'SelectStatement' });

    const selectConcept = parser.parse('SELECT org.acme.Address', { startRule: 'SelectStatement' });

    const selectEnum = parser.parse('SELECT org.acme.CarType', { startRule: 'SelectStatement' });

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        sandbox = sinon.sandbox.create();
        mockQuery = sinon.createStubInstance(Query);
        mockQuery.getName.returns('test');
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

        it('should not throw for valid select statements', () => {
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (age == 10)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (age == _$param1)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (address.city.postcode == "SO225GB")')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (address.city.postcode == _$param1)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (owner == "DAN")')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (owner == _$param1)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (carType == "DAN")')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (carType == _$param1)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height == 6.2)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height < 6.2)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height <= 6.2)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height > 6.2)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height >= 6.2)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (6.2 == height)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (length == 123)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (trustworthy == false)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (trustworthy != false)')).validate();

            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (dob == "2017-07-24")')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE ("2017-07-24" == dob)')).validate();
            new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE ("2017-07-24" > dob)')).validate();
        });

        it('should throw for arrays', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (middleNames == "DAN")')).validate();
            }).should.throw(/Property middleNames of type String/);
        });

        it('should throw Integer type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (age == "DAN")')).validate();
            }).should.throw(/Property age/);
        });

        it('should throw Double type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (height == true)')).validate();
            }).should.throw(/Property height/);
        });

        it('should throw Long type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (length == "true")')).validate();
            }).should.throw(/Property length/);
        });

        it('should throw String type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (firstName == true)')).validate();
            }).should.throw(/Property firstName/);
        });

        it('should throw DateTime type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (dob == true)')).validate();
            }).should.throw(/Property dob/);
        });

        it('should throw Enum type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (carType == true)')).validate();
            }).should.throw(/Enum property carType/);
        });

        it('should throw Relationship type violation', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (owner == 10)')).validate();
            }).should.throw(/Relationship owner cannot be compared with 10/);
        });

        it('should throw on missing property', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Car WHERE (foo == 10)')).validate();
            }).should.throw(/Property foo does not exist on org.acme.Car/);
        });

        it('should throw on missing property', () => {
            (() => {
                new Select(mockQuery, toSelectAst('SELECT org.acme.Driver WHERE (address.goo == 10)')).validate();
            }).should.throw(/Property goo does not exist on org.acme.Address/);
        });

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
            where.getAST().type.should.equal('BinaryExpression');
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
