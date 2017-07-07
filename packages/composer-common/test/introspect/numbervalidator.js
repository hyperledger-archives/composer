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
const chai = require('chai'), should = chai.should();

const sinon = require('sinon');

describe('NumberValidator', () => {

    let mockField;

    // valid test parms
    let VALID_UPPER_AND_LOWER_BOUND_AST = {'lower' : '0', 'upper' : '100' };
    let NO_LOWER_BOUND_AST = {'lower' : null, 'upper' : '100' };
    let NO_UPPER_BOUND_AST = {'lower' : '0' , 'upper' : null };

    // error parms
    let NO_PARMS_IN_AST = {'lower' : null, 'upper' : null };
    let LOWER_IS_HIGHER_THAN_UPPER = {'lower' : '200', 'upper' : '100' };

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#constructor', () => {
        it('should accept valid constructor parms VALID_UPPER_AND_LOWER_BOUND_AST', () => {
            let validator = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);
            validator.lowerBound.should.equal(0);
            validator.upperBound.should.equal(100);
        });

        it('should accept valid constructor parms NO_LOWER_BOUND_AST', () => {
            let validator = new NumberValidator(mockField, NO_LOWER_BOUND_AST);
            should.equal(validator.lowerBound, null);
            validator.upperBound.should.equal(100);
        });

        it('should accept valid constructor parms NO_UPPER_BOUND_AST', () => {
            let validator = new NumberValidator(mockField, NO_UPPER_BOUND_AST);
            validator.lowerBound.should.equal(0);
            should.equal(validator.upperBound, null);
        });

        it('should throw an error for constructor parms NO_PARMS_IN_AST', () => {
            (() => {
                new NumberValidator(mockField, NO_PARMS_IN_AST);
            }).should.throw(/Invalid range, lower and-or upper bound must be specified./);
        });

        it('should throw an error for constructor parms LOWER_IS_HIGHER_THAN_UPPER', () => {
            (() => {
                new NumberValidator(mockField, LOWER_IS_HIGHER_THAN_UPPER);
            }).should.throw(/Lower bound must be less than or equal to upper bound./);
        });
    });

    describe('#validate', () => {

        it('should validate', () => {
            let v = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);
            v.validate('id', 1);
            v.validate('id', 50);
            v.validate('id', 100);
        });

        it('should detect lower bound violation', () => {
            let v = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);

            (() => {
                v.validate('id', -1);
            }).should.throw(/org.acme.myField: Value is outside lower bound -1/);
        });

        it('should detect upper bound violation', () => {
            let v = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);

            (() => {
                v.validate('id', 101);
            }).should.throw(/org.acme.myField: Value is outside upper bound 101/);
        });

        it('should ignore missing upper bound', () => {
            let v = new NumberValidator(mockField, NO_UPPER_BOUND_AST);
            v.validate('id', 21);

            (() => {
                v.validate('id', -1);
            }).should.throw(/org.acme.myField: Value is outside lower bound -1/);
        });

        it('should ignore missing lower bound', () => {
            let v = new NumberValidator(mockField, NO_LOWER_BOUND_AST);
            v.validate('id', -1);

            (() => {
                v.validate('id', 101);
            }).should.throw(/org.acme.myField: Value is outside upper bound 101/);
        });

        it('should do nothing if no value is given', () => {
            let v = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);
            v.validate();
        });
    });

    describe('#toString', () => {
        it('should return the correct string', () => {
            let v = new NumberValidator(mockField, VALID_UPPER_AND_LOWER_BOUND_AST);
            v.toString().should.equal(`NumberValidator lower: ${VALID_UPPER_AND_LOWER_BOUND_AST.lower} upper: ${VALID_UPPER_AND_LOWER_BOUND_AST.upper}`);
        });
    });
});
