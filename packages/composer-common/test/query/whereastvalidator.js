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

const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const Property = require('../../lib/introspect/property');
const WhereAstValidator = require('../../lib/query/whereastvalidator');

require('chai').should();
const sinon = require('sinon');

describe('WhereAstValidator', () => {

    let sandbox;
    let mockAssetDeclaration;
    let mockStringProperty;
    let mockBooleanProperty;
    let mockInvalidProperty;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
        mockAssetDeclaration.ast = {location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }};

        mockStringProperty = sinon.createStubInstance(Property);
        mockStringProperty.getType.returns('String');
        mockStringProperty.isPrimitive.returns(true);
        mockStringProperty.getName.returns('stringProperty');
        mockStringProperty.isArray.returns(false);

        mockBooleanProperty = sinon.createStubInstance(Property);
        mockBooleanProperty.getType.returns('Boolean');
        mockBooleanProperty.isPrimitive.returns(true);
        mockBooleanProperty.getName.returns('booleanProperty');
        mockBooleanProperty.isArray.returns(false);

        mockInvalidProperty = sinon.createStubInstance(Property);
        mockInvalidProperty.getType.returns('Invalid');
        mockInvalidProperty.isPrimitive.returns(false);
        mockInvalidProperty.getName.returns('invalidProperty');
        mockInvalidProperty.isArray.returns(false);

        mockAssetDeclaration.getNestedProperty.withArgs('stringProperty').returns(mockStringProperty);
        mockAssetDeclaration.getNestedProperty.withArgs('booleanProperty').returns(mockBooleanProperty);
        mockAssetDeclaration.getNestedProperty.withArgs('invalidProperty').returns(mockInvalidProperty);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null select provided', () => {
            (() => {
                new WhereAstValidator(null);
            }).should.throw(/Invalid class declaration/);
        });
    });

    describe('#accept', () => {

        it('should throw when visiting unknown type', () => {
            (() => {
                let wv = new WhereAstValidator(mockAssetDeclaration);
                wv.visit( {type: 'foo'}, {});
            }).should.throw(/Unsupported type: object/);
        });
    });

    describe('#verifyTypeCompatability', () => {

        it('should throw for function value', () => {
            (() => {
                let wv = new WhereAstValidator(mockAssetDeclaration);
                wv.verifyTypeCompatibility( mockStringProperty, function() {});
            }).should.throw(/Property stringProperty cannot be compared/);
        });

        it('should throw for non boolean', () => {
            (() => {
                let wv = new WhereAstValidator(mockAssetDeclaration);
                wv.verifyTypeCompatibility( mockBooleanProperty, 'String');
            }).should.throw(/Property booleanProperty cannot be compared/);
        });

        it('should throw for invalid operator with boolean', () => {
            (() => {
                let wv = new WhereAstValidator(mockAssetDeclaration);
                wv.verifyOperator( mockBooleanProperty, '>');
            }).should.throw(/Property booleanProperty cannot be compared/);
        });

        it('should throw for invalid property', () => {
            (() => {
                let wv = new WhereAstValidator(mockAssetDeclaration);
                wv.verifyTypeCompatibility( mockInvalidProperty, false);
            }).should.throw(/Property invalidProperty of type Invalid/);
        });

    });

});
