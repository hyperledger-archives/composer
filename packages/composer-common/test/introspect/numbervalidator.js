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

const Field = require('../../lib/introspect/field');
const NumberValidator = require('../../lib/introspect/numbervalidator');

require('chai').should();
const sinon = require('sinon');

describe('NumberValidator', () => {

    let mockField;

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#constructor', () => {

        it('should store values', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});
            v.lowerBound.should.equal(10);
            v.upperBound.should.equal(20);
        });

        it('should detect lower bound greater than upper bound', () => {

            (() => {
                new NumberValidator(mockField, {lower: 10,upper: 9});
            }).should.throw(/Lower bound must be less than or equal to upper bound/);
        });
    });

    describe('#validate', () => {

        it('should validate', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});
            v.validate('id', 10);
            v.validate('id', 15);
            v.validate('id', 20);
        });

        it('should detect lower bound violation', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});

            (() => {
                v.validate('id', 9);
            }).should.throw(/org.acme.myField: Value is outside lower bound 9/);
        });

        it('should detect upper bound violation', () => {
            let v = new NumberValidator(mockField, {lower: 10,upper: 20});

            (() => {
                v.validate('id', 21);
            }).should.throw(/org.acme.myField: Value is outside upper bound 21/);
        });

        it('should ignore missing upper bound', () => {
            let v = new NumberValidator(mockField, {lower: 10});
            v.validate('id', 21);

            (() => {
                v.validate('id', 9);
            }).should.throw(/org.acme.myField: Value is outside lower bound 9/);
        });

        it('should ignore missing lower bound', () => {
            let v = new NumberValidator(mockField, {upper: 20});
            v.validate('id', -1);

            (() => {
                v.validate('id', 21);
            }).should.throw(/org.acme.myField: Value is outside upper bound 21/);
        });
    });
});
