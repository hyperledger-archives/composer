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

const ValueGeneratorFactory = require('../../lib/serializer/valuegenerator');

const chai = require('chai');
const expect = chai.expect;

describe('ValueGenerator', function() {

    describe('Consistent return types', function() {
        /** Array of names of the static factory methods for obtaining ValueGenerator objects. */
        const generatorNames = Object.getOwnPropertyNames(ValueGeneratorFactory)
            .filter((p) => {
                return typeof ValueGeneratorFactory[p] === 'function';
            });

        /**
         * Check that invoking the supplied function name on all of the ValueGenerator implementations returns the expected type.
         * @param {string} functionName name of the function to invoke.
         * @param {string} type expected return type.
         */
        const assertFunctionReturnsType = (functionName, type) => {
            generatorNames.forEach((generatorName) => {
                const generator = ValueGeneratorFactory[generatorName]();
                const returnValue = generator[functionName]();
                expect(returnValue, generatorName + '.' + functionName + '() should return a ' + type)
                    .to.be.a(type);
            });
        };

        it('getDateTime should return a Date', function() {
            assertFunctionReturnsType('getDateTime', 'Date');
        });

        it('getInteger should return a number', function() {
            assertFunctionReturnsType('getInteger', 'number');
        });

        it('getLong should return a number', function() {
            assertFunctionReturnsType('getLong', 'number');
        });

        it('getDouble should return a number', function() {
            assertFunctionReturnsType('getDouble', 'number');
        });

        it('getBoolean should return a boolean', function() {
            assertFunctionReturnsType('getBoolean', 'boolean');
        });

        it('getString should return a string', function() {
            assertFunctionReturnsType('getString', 'string');
        });
    });

    describe('EmptyValueGenerator', function() {
        it('getEnum should return the first value', function() {
            const inputs = ['One', 'Two', 'Three'];
            const output = ValueGeneratorFactory.empty().getEnum(inputs);
            expect(output).to.equal(inputs[0]);
        });

        it('getArray should return empty array', function() {
            const output = ValueGeneratorFactory.empty().getArray(() => '');
            expect(output).to.be.a('Array').that.is.empty;
        });
    });

    describe('SampleValueGenerator', function() {
        it('getEnum should return one of the input values', function() {
            const inputs = ['One', 'Two', 'Three'];
            const output = ValueGeneratorFactory.sample().getEnum(inputs);
            expect(inputs).to.include(output);
        });

        it('getArray should return array with one element obtained from callback', function() {
            const value = 'TEST_VALUE';
            const output = ValueGeneratorFactory.sample().getArray(() => value);
            expect(output).to.be.a('Array').and.deep.equal([value]);
        });
    });

});
