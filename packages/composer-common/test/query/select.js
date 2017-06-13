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

const Query = require('../../lib/query/query');
const Select = require('../../lib/query/select');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('Select', () => {

    const testModel = fs.readFileSync(path.resolve(__dirname, './model.cto'), 'utf8');

    let modelManager;
    let sandbox;
    let mockQuery;

    const select = {
        resource: 'org.acme.Driver'
    };

    const selectWhere = {
        resource: 'org.acme.Driver', where: 'WHERE'
    };

    const selectWhereOrderBy = {
        resource: 'org.acme.Driver', where: 'WHERE', orderBy: 'ORDER BY'
    };

    const selectWhereLimit = {
        resource: 'org.acme.Driver', where: 'WHERE', limit: 10
    };

    const selectWhereLimitSkip = {
        resource: 'org.acme.Driver', where: 'WHERE', limit: 10, skip: 5
    };

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        sandbox = sinon.sandbox.create();
        mockQuery = sinon.createStubInstance(Query);
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

        it('should save a select query', () => {
            let s = new Select( mockQuery, select );
            s.getQuery().should.equal(mockQuery);
            s.getResource().should.equal('org.acme.Driver');
            (s.getWhere() === null).should.be.true;
        });

        it('should save a select where query', () => {
            let s = new Select( mockQuery, selectWhere );
            s.getQuery().should.equal(mockQuery);
            s.getWhere().getSelect().should.equal(s);
        });

        it('should save a select where order by query', () => {
            let s = new Select( mockQuery, selectWhereOrderBy );
            s.getQuery().should.equal(mockQuery);
            s.getWhere().getSelect().should.equal(s);
            s.getOrderBy().getSelect().should.equal(s);
        });

        it('should save a select where limit', () => {
            let s = new Select( mockQuery, selectWhereLimit );
            s.getQuery().should.equal(mockQuery);
            s.getWhere().getSelect().should.equal(s);
            s.getLimit().should.equal(10);
        });

        it('should save a select where skip', () => {
            let s = new Select( mockQuery, selectWhereLimitSkip );
            s.getQuery().should.equal(mockQuery);
            s.getWhere().getSelect().should.equal(s);
            s.getLimit().should.equal(10);
            s.getSkip().should.equal(5);
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
});
