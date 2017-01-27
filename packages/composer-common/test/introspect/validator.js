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
const Validator = require('../../lib/introspect/validator');

require('chai').should();
const sinon = require('sinon');

describe('Validator', () => {

    let mockField;

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#constructor', () => {

        it('should store values', () => {
            let v = new Validator(mockField, 'validatorString');
            v.field.should.equal(mockField);
            v.validator.should.equal('validatorString');
        });
    });

    describe('#validate', () => {

        it('should validate', () => {
            let v = new Validator(mockField, 'dummy');
            v.validate('id', 10);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let v = new Validator(mockField, 'dummy');
            let visitor = {
                visit: sinon.stub()
            };
            v.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, v, ['some', 'args']);
        });

    });
});
