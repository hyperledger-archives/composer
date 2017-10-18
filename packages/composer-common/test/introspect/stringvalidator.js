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
const StringValidator = require('../../lib/introspect/stringvalidator');

require('chai').should();
const sinon = require('sinon');

describe('StringValidator', () => {

    let mockField;

    beforeEach(() => {
        mockField = sinon.createStubInstance(Field);
        mockField.getFullyQualifiedName.returns('org.acme.myField');
    });

    describe('#constructor', () => {

        it('should throw for invalid regexes', () => {
            (() => {
                new StringValidator(mockField, '/^[A-z/' );
            }).should.throw(/Validator error for field/);
        });

    });

    describe('#validate', () => {

        it('should ignore a null string', () => {
            let v = new StringValidator(mockField, '/^[A-z][A-z][0-9]{7}/' );
            v.validate('id', null);
        });

        it('should validate a string', () => {
            let v = new StringValidator(mockField, '/^[A-z][A-z][0-9]{7}/' );
            v.validate('id', 'AB1234567');
        });

        it('should detect mismatch string', () => {
            let v = new StringValidator(mockField, '/^[A-z][A-z][0-9]{7}/');

            (() => {
                v.validate('id', 'xyz');
            }).should.throw(/Validator error for field id org.acme.myField/);
        });
    });
});
