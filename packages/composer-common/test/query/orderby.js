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

const OrderBy = require('../../lib/query/orderby');
const parser = require('../../lib/query/parser');
const Select = require('../../lib/query/select');
const sinon = require('sinon');

describe('OrderBy', () => {

    let sandbox;
    let mockSelect;

    const selectWhereOrderBy = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") ORDER BY [id ASC]', { startRule: 'SelectStatement' });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSelect = sinon.createStubInstance(Select);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null select provided', () => {
            (() => {
                new OrderBy(null, null);
            }).should.throw(/Invalid Select or AST/);
        });

        it('should throw when null ast provided', () => {
            (() => {
                new OrderBy(mockSelect, null);
            }).should.throw(/Invalid Select or AST/);
        });

        it('should throw when invalid ast provided', () => {
            (() => {
                new OrderBy(mockSelect, 'force failure');
            }).should.throw(/Invalid AST/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let o = new OrderBy(mockSelect, selectWhereOrderBy.orderBy);
            let visitor = {
                visit: sinon.stub()
            };
            o.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, o, ['some', 'args']);
        });
    });

    describe('#getSelect', () => {

        it('should return the select', () => {
            const o = new OrderBy(mockSelect, selectWhereOrderBy.orderBy);
            o.getSelect().should.equal(mockSelect);
        });

    });

    describe('#validate', () => {

       // TODO no validation method implemented yet

    });

    describe('#getSortCriteria', () => {

        it('should return the sort critera', () => {
            const o = new OrderBy(mockSelect, selectWhereOrderBy.orderBy);
            o.should.be.an.instanceOf(OrderBy);
            o.getSortCriteria().should.have.lengthOf(1);
        });
    });
});
