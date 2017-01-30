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

const ModelFile = require('../lib/introspect/modelfile');
const Property = require('../lib/introspect/property');
const ModelUtil = require('../lib/modelutil');

require('chai').should();
const sinon = require('sinon');

describe('ModelUtil', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#isPrimitiveType', function() {
        it('check isPrimitiveType', function() {
            ModelUtil.isPrimitiveType('org.acme.baz.Foo').should.equal(false);
            ModelUtil.isPrimitiveType('Boolean').should.equal(true);
            ModelUtil.isPrimitiveType('Integer').should.equal(true);
            ModelUtil.isPrimitiveType('Long').should.equal(true);
            ModelUtil.isPrimitiveType('DateTime').should.equal(true);
            ModelUtil.isPrimitiveType('String').should.equal(true);
        });
    });

    describe('#getShortName', function() {

        it('should handle a name with a namespace', function() {
            ModelUtil.getShortName('org.acme.baz.Foo').should.equal('Foo');
        });

        it('should handle a name without a namespace', function() {
            ModelUtil.getShortName('Foo').should.equal('Foo');
        });

    });

    describe('#getNamespace', function() {
        it('check getNamespace', function() {
            ModelUtil.getNamespace('org.acme.baz.Foo').should.equal('org.acme.baz');
            ModelUtil.getNamespace('Foo').should.equal('');
        });
    });

    describe('#capitalizeFirstLetter', () => {

        it('should handle a single lower case letter', () => {
            ModelUtil.capitalizeFirstLetter('a').should.equal('A');
        });

        it('should handle a single upper case letter', () => {
            ModelUtil.capitalizeFirstLetter('A').should.equal('A');
        });

        it('should handle a string of lower case letters', () => {
            ModelUtil.capitalizeFirstLetter('abcdef').should.equal('Abcdef');
        });

        it('should handle a string of mixed case letters', () => {
            ModelUtil.capitalizeFirstLetter('aBcDeF').should.equal('ABcDeF');
        });

    });

    describe('#isAssignableTo', function() {

        it('throws error for primitive types', function() {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            let mockProperty = sinon.createStubInstance(Property);
            (() => {
                ModelUtil.isAssignableTo(mockModelFile, 'String', mockProperty);
            }).should.throw(/This method only works with complex types/);
        });

        it('returns false if property name is primitive type', function() {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            let mockProperty = sinon.createStubInstance(Property);
            mockProperty.getName.returns('String');
            ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty).should.equal(false);
        });

        it('returns true if property type and required type are identical', function() {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            let mockProperty = sinon.createStubInstance(Property);
            mockProperty.getFullyQualifiedTypeName.returns('org.doge.Doge');
            ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty).should.equal(true);
        });

        it('throws error when type cannot be found', function() {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            let mockProperty = sinon.createStubInstance(Property);
            mockProperty.getName.returns('theDoge');
            mockProperty.getFullyQualifiedTypeName.returns('org.doge.BaseDoge');
            mockModelFile.getType.returns(null);
            (() => {
                ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty);
            }).should.throw(/Cannot find type/);
        });

    });

});
