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

const Where = require('../../lib/query/where');
const parser = require('../../lib/query/parser');
const Select = require('../../lib/query/select');

require('chai').should();
const sinon = require('sinon');

describe('Where', () => {

    let sandbox;
    let mockSelect;

    const selectWhere = parser.parse('SELECT org.acme.Driver WHERE (prop == "value")', { startRule: 'SelectStatement' });
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
                new Where(null, null);
            }).should.throw(/Invalid Select or AST/);
        });

        it('should throw when null ast provided', () => {
            (() => {
                new Where(mockSelect, null);
            }).should.throw(/Invalid Select or AST/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let o = new Where(mockSelect, selectWhere.where);
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
            const o = new Where(mockSelect, selectWhere.where);
            o.getSelect().should.equal(mockSelect);
        });

    });

    describe('#getAST', () => {

        it('should return the AST with expected where type', () => {
            const w = new Where(mockSelect, selectWhere.where);
            w.getAST().type.should.equal('BinaryExpression');
        });
    });
});
