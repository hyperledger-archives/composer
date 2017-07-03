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

const Sort = require('../../lib/query/sort');
const parser = require('../../lib/query/parser');
const OrderBy = require('../../lib/query/orderby');

require('chai').should();
const sinon = require('sinon');

describe('Sort', () => {

    let sandbox;
    let mockOrderBy;

    const selectWhereOrderBy = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") ORDER BY [id ASC]', { startRule: 'SelectStatement' });
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockOrderBy = sinon.createStubInstance(OrderBy);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null OrderBy provided', () => {
            (() => {
                new Sort(null, null);
            }).should.throw(/Invalid OrderBy or AST/);
        });

        it('should throw when null ast provided', () => {
            (() => {
                new Sort(mockOrderBy, null);
            }).should.throw(/Invalid OrderBy or AST/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let s = new Sort(mockOrderBy, selectWhereOrderBy.orderBy.sort[0]);
            let visitor = {
                visit: sinon.stub()
            };
            s.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, s, ['some', 'args']);
        });
    });

    describe('#getOrderBy', () => {

        it('should return the owning OrderBy', () => {
            const s = new Sort(mockOrderBy, selectWhereOrderBy.orderBy.sort[0]);
            s.getOrderBy().should.equal(mockOrderBy);
        });

    });

    describe('#validate', () => {

       // TODO no validation method implemented yet

    });

    describe('#getPropertyPath', () => {

        it('should return the name of property of the OrderBy', () => {
            const s = new Sort(mockOrderBy, selectWhereOrderBy.orderBy.sort[0]);
            s.getPropertyPath().should.equal('id');
        });

    });

    describe('#getDirection', () => {

        it('should return the expected direction of the OrderBy', () => {
            const s = new Sort(mockOrderBy, selectWhereOrderBy.orderBy.sort[0]);
            s.getDirection().should.equal('ASC');
        });

    });
});
