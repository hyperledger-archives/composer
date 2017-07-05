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

const Skip = require('../../lib/query/skip');
const parser = require('../../lib/query/parser');
const Select = require('../../lib/query/select');

require('chai').should();
const sinon = require('sinon');

describe('Skip', () => {

    let sandbox;
    let mockSelect;

    const selectWhereLimitSkip = parser.parse('SELECT org.acme.Driver WHERE (prop = "value") LIMIT 10 SKIP 5', { startRule: 'SelectStatement' });
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
                new Skip(null, null);
            }).should.throw(/Invalid Select or AST/);
        });

        it('should throw when null ast provided', () => {
            (() => {
                new Skip(mockSelect, null);
            }).should.throw(/Invalid Select or AST/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let o = new Skip(mockSelect, selectWhereLimitSkip.skip);
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
            const o = new Skip(mockSelect, selectWhereLimitSkip.skip);
            o.getSelect().should.equal(mockSelect);
        });

    });

    describe('#validate', () => {

       // TODO no validation method implemented yet

    });

    describe('#getAST', () => {

        it('should return the AST for this skip statement', () => {
            const s = new Skip(mockSelect, selectWhereLimitSkip.skip);
            s.getAST().type.should.equal('Literal');
            s.getAST().value.should.equal(5);
        });
    });
});
