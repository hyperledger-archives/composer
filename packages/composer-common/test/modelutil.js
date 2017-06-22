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

const ClassDeclaration = require('../lib/introspect/classdeclaration');
const ModelFile = require('../lib/introspect/modelfile');
const Property = require('../lib/introspect/property');
const Typed = require('../lib/model/identifiable');
const ModelManager = require('../lib/modelmanager');
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

    describe('#isWildcardName', () => {

        it('should return false for a name without a wildcard', () => {
            ModelUtil.isWildcardName('Foo').should.be.false;
        });

        it('should return true for a name with a wildcard', () => {
            ModelUtil.isWildcardName('*').should.be.true;
        });

        it('should return false for a fully qualified name without a wildcard', () => {
            ModelUtil.isWildcardName('org.acme.baz.Foo').should.be.false;
        });

        it('should return true for a fully qualified name with a wildcard', () => {
            ModelUtil.isWildcardName('org.acme.baz.*').should.be.true;
        });

        it('should return false for a fully qualified name with a recursive wildcard', () => {
            ModelUtil.isWildcardName('org.acme.baz.**').should.be.false;
        });

    });

    describe('#isRecursiveWildcardName', () => {

        it('should return false for a name without a recursive wildcard', () => {
            ModelUtil.isRecursiveWildcardName('Foo').should.be.false;
        });

        it('should return true for a name with a recursive wildcard', () => {
            ModelUtil.isRecursiveWildcardName('**').should.be.true;
        });

        it('should return false for a fully qualified name without a recursive wildcard', () => {
            ModelUtil.isRecursiveWildcardName('org.acme.baz.Foo').should.be.false;
        });

        it('should return true for a fully qualified name with a recursive wildcard', () => {
            ModelUtil.isRecursiveWildcardName('org.acme.baz.**').should.be.true;
        });

        it('should return false for a fully qualified name with a wildcard', () => {
            ModelUtil.isRecursiveWildcardName('org.acme.baz.*').should.be.false;
        });

    });

    describe('#isMatchingType', () => {

        let mockModelManager;
        let mockModelFile;
        let mockClassDeclaration;
        let type;

        beforeEach(() => {
            mockModelManager = sinon.createStubInstance(ModelManager);
            mockModelFile = sinon.createStubInstance(ModelFile);
            mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);

            mockModelManager.getModelFile.returns(mockModelFile);
            mockModelFile.getType.returns(mockClassDeclaration);
            mockClassDeclaration.getFullyQualifiedName.returns('org.acme.baz.Foo');
            mockClassDeclaration.getAllSuperTypeDeclarations.returns([]);

            type = new Typed(mockModelManager, 'org.acme.baz', 'Foo' );
        });

        it('should return true for an exact match', () => {
            ModelUtil.isMatchingType(type, 'org.acme.baz.Foo').should.be.true;
        });

        it('should return false for a non-match', () => {
            ModelUtil.isMatchingType(type, 'org.acme.baz.Bar').should.be.false;
        });

        it('should return true for a wildcard namespace match', () => {
            ModelUtil.isMatchingType(type, 'org.acme.baz.*').should.be.true;
        });

        it('should return false for a non-matching wildcard namespace', () => {
            ModelUtil.isMatchingType(type, 'org.doge.baz.*').should.be.false;
        });

        it('should return false for an ancestor namespace wildcard match', () => {
            ModelUtil.isMatchingType(type, 'org.acme.*').should.be.false;
        });

        it('should return true for a recursive wildcard match', () => {
            ModelUtil.isMatchingType(type, 'org.acme.**').should.be.true;
        });

        it('should return false for a non-matching recursive wildcard', () => {
            ModelUtil.isMatchingType(type, 'org.ac.**').should.be.false;
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
        let mockModelFile;
        let mockProperty;

        beforeEach(function() {
            mockModelFile = sinon.createStubInstance(ModelFile);
            mockProperty = sinon.createStubInstance(Property);
        });

        it('returns true for matching primitive types', function() {
            mockProperty.getFullyQualifiedTypeName.returns('String');
            const result = ModelUtil.isAssignableTo(mockModelFile, 'String', mockProperty);
            result.should.equal(true);
        });

        it('returns false for non-matching primitive types', function() {
            mockProperty.getFullyQualifiedTypeName.returns('DateTime');
            const result = ModelUtil.isAssignableTo(mockModelFile, 'Boolean', mockProperty);
            result.should.equal(false);
        });

        it('returns false for assignment of primitive to non-primitive property', function() {
            mockProperty.getFullyQualifiedTypeName.returns('org.doge.Doge');
            const result = ModelUtil.isAssignableTo(mockModelFile, 'String', mockProperty);
            result.should.equal(false);
        });

        it('returns false for assignment of non-primitive to primitive property', function() {
            mockProperty.getFullyQualifiedTypeName.returns('String');
            const result = ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty);
            result.should.equal(false);
        });

        it('returns true if property type and required type are identical', function() {
            mockProperty.getFullyQualifiedTypeName.returns('org.doge.Doge');
            const result = ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty);
            result.should.equal(true);
        });

        it('throws error when type cannot be found', function() {
            mockProperty.getName.returns('theDoge');
            mockProperty.getFullyQualifiedTypeName.returns('org.doge.BaseDoge');
            const mockModelManager = sinon.createStubInstance(ModelManager);
            mockModelManager.getType.returns(null);
            mockModelFile.getModelManager.returns(mockModelManager);
            (() => {
                ModelUtil.isAssignableTo(mockModelFile, 'org.doge.Doge', mockProperty);
            }).should.throw(/Cannot find type/);
        });

    });

    describe('#getFullyQualifiedName', function() {
        it('valid inputs', function() {
            const result = ModelUtil.getFullyQualifiedName('a.namespace', 'type');
            result.should.equal('a.namespace.type');
        });

        it('empty namespace should return the type with no leading dot', function() {
            const result = ModelUtil.getFullyQualifiedName('', 'type');
            result.should.equal('type');
        });

    });

});
