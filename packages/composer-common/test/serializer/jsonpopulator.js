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

const Factory = require('../../lib/factory');
const Field = require('../../lib/introspect/field');
const JSONPopulator = require('../../lib/serializer/jsonpopulator');
const ModelManager = require('../../lib/modelmanager');
const Relationship = require('../../lib/model/relationship');
const Resource = require('../../lib/model/resource');
const TypedStack = require('../../lib/serializer/typedstack');
const TypeNotFoundException = require('../../lib/typenotfoundexception');

require('chai').should();
const sinon = require('sinon');

describe('JSONPopulator', () => {

    let modelManager;
    let mockFactory;
    let jsonPopulator;
    let sandbox;
    let assetDeclaration1;
    let relationshipDeclaration1;
    let relationshipDeclaration2;

    before(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
            namespace org.acme
            asset MyAsset1 identified by assetId {
                o String assetId
            }
            asset MyAsset2 identified by assetId {
                o String assetId
                o Integer integerValue
            }
            asset MyContainerAsset1 identified by assetId {
                o String assetId
                o MyAsset1 myAsset
            }
            asset MyContainerAsset2 identified by assetId {
                o String assetId
                o MyAsset1[] myAssets
            }
            transaction MyTx1 {
                --> MyAsset1 myAsset
            }
            transaction MyTx2 {
                --> MyAsset1[] myAssets
            }
        `);
        modelManager.addModelFile(`
            namespace org.acme.different
            asset MyAsset1 identified by assetId {
                o String assetId
            }
        `);
        assetDeclaration1 = modelManager.getType('org.acme.MyContainerAsset1').getProperty('myAsset');
        relationshipDeclaration1 = modelManager.getType('org.acme.MyTx1').getProperty('myAsset');
        relationshipDeclaration2 = modelManager.getType('org.acme.MyTx2').getProperty('myAssets');
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockFactory = sinon.createStubInstance(Factory);
        jsonPopulator = new JSONPopulator();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#visit', () => {

        it('should throw an error for an unrecognized type', () => {
            (() => {
                jsonPopulator.visit(3.142, {});
            }).should.throw(/Unrecognised/);
        });

    });

    describe('#convertToObject', () => {

        it('should convert to dates from ISO8601 strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('DateTime');
            let value = jsonPopulator.convertToObject(field, '2016-10-20T05:34:03Z');
            value.getTime().should.equal(new Date('2016-10-20T05:34:03Z').getTime());
        });

        it('should convert to integers from strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Integer');
            let value = jsonPopulator.convertToObject(field, '32768');
            value.should.equal(32768);
        });

        it('should convert to integers from numbers', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Integer');
            let value = jsonPopulator.convertToObject(field, 32768);
            value.should.equal(32768);
        });

        it('should convert to longs from strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Long');
            let value = jsonPopulator.convertToObject(field, '32768');
            value.should.equal(32768);
        });

        it('should convert to longs from numbers', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Long');
            let value = jsonPopulator.convertToObject(field, 32768);
            value.should.equal(32768);
        });

        it('should convert to doubles from strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Double');
            let value = jsonPopulator.convertToObject(field, '32.768');
            value.should.equal(32.768);
        });

        it('should convert to doubles from numbers', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Double');
            let value = jsonPopulator.convertToObject(field, 32.768);
            value.should.equal(32.768);
        });

        it('should convert to booleans from strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Boolean');
            let value = jsonPopulator.convertToObject(field, 'true');
            value.should.equal(true);
        });

        it('should convert to booleans from numbers', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('Boolean');
            let value = jsonPopulator.convertToObject(field, false);
            value.should.equal(false);
        });

        it('should convert to strings from strings', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('String');
            let value = jsonPopulator.convertToObject(field, 'hello world');
            value.should.equal('hello world');
        });

        it('should convert to strings from numbers', () => {
            let field = sinon.createStubInstance(Field);
            field.getType.returns('String');
            let value = jsonPopulator.convertToObject(field, 32768);
            value.should.equal('32768');
        });

    });

    describe('#convertItem', () => {

        it('should throw an error if the $class value does not match a class defined in the model', () => {
            let options = {
                jsonStack: new TypedStack({}),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource);
            (() => {
                jsonPopulator.convertItem(assetDeclaration1, {
                    $class: 'org.acme.NOTAREALTYPE',
                    assetId: 'asset1'
                }, options);
            }).should.throw(TypeNotFoundException, /NOTAREALTYPE/);
        });

        it('should create a new resource from an object using a $class value that matches the model', () => {
            let options = {
                jsonStack: new TypedStack({}),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource);
            let resource = jsonPopulator.convertItem(assetDeclaration1, {
                $class: 'org.acme.MyAsset1',
                assetId: 'asset1'
            }, options);
            resource.should.be.an.instanceOf(Resource);
            sinon.assert.calledWith(mockFactory.newResource, 'org.acme', 'MyAsset1', 'asset1');
        });

        it('should create a new resource from an object using a $class value even if it does not match the model', () => {
            let options = {
                jsonStack: new TypedStack({}),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset2', 'asset2').returns(mockResource);
            let resource = jsonPopulator.convertItem(assetDeclaration1, {
                $class: 'org.acme.MyAsset2',
                assetId: 'asset2'
            }, options);
            resource.should.be.an.instanceOf(Resource);
            sinon.assert.calledWith(mockFactory.newResource, 'org.acme', 'MyAsset2', 'asset2');
        });

        it('should create a new resource from an object using the model if no $class value is specified', () => {
            let options = {
                jsonStack: new TypedStack({}),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource);
            let resource = jsonPopulator.convertItem(assetDeclaration1, {
                assetId: 'asset1'
            }, options);
            resource.should.be.an.instanceOf(Resource);
            sinon.assert.calledWith(mockFactory.newResource, 'org.acme', 'MyAsset1', 'asset1');
        });

    });

    describe('#visitRelationshipDeclaration', () => {

        it('should create a new relationship from a string', () => {
            let options = {
                jsonStack: new TypedStack('asset1'),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockFactory.newRelationship.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockRelationship);
            let relationship = jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            relationship.should.be.an.instanceOf(Relationship);
        });

        it('should get the relationship namespace if required', () => {
            let options = {
                jsonStack: new TypedStack('asset1'),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            sandbox.stub(relationshipDeclaration1, 'getFullyQualifiedTypeName').returns('MyAsset1');
            sandbox.stub(relationshipDeclaration1, 'getNamespace').returns('org.acme.different');
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockFactory.newRelationship.withArgs('org.acme.different', 'MyAsset1', 'asset1').returns(mockRelationship);
            let relationship = jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            relationship.should.be.an.instanceOf(Relationship);
        });

        it('should not create a new relationship from an object if not permitted', () => {
            let options = {
                jsonStack: new TypedStack({
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset1'
                }),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource);
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should create a new relationship from an object if permitted', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack({
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset1'
                }),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource);
            let subResource = jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            subResource.should.be.an.instanceOf(Resource);
        });

        it('should throw if the JSON data is not a string or an object', () => {
            let options = {
                jsonStack: new TypedStack(3.142),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should throw if the JSON data is an object without a class', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack({}),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should throw if the JSON data is an object with a class that causes an error to be thrown', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack({
                    $class: 'org.acme.NoSuchClass'
                }),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(TypeNotFoundException, /NoSuchClass/);
        });

        it('should throw if the JSON data is an object with a class that does not exist', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack({
                    $class: 'org.acme.NoSuchClass'
                }),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            sandbox.stub(modelManager, 'getType').withArgs('org.acme.NoSuchClass').throws(new TypeNotFoundException('org.acme.NoSuchClass'));
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(TypeNotFoundException, /NoSuchClass/);
        });

        it('should create a new relationship from an array of strings', () => {
            let options = {
                jsonStack: new TypedStack(['asset1', 'asset2']),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockRelationship1 = sinon.createStubInstance(Relationship);
            mockFactory.newRelationship.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockRelationship1);
            let mockRelationship2 = sinon.createStubInstance(Relationship);
            mockFactory.newRelationship.withArgs('org.acme', 'MyAsset1', 'asset2').returns(mockRelationship2);
            let relationships = jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            relationships.should.have.length.of(2);
            relationships[0].should.be.an.instanceOf(Relationship);
            relationships[1].should.be.an.instanceOf(Relationship);
        });

        it('should not create a new relationship from an array of objects if not permitted', () => {
            let options = {
                jsonStack: new TypedStack([{
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset1'
                }, {
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset2'
                }]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource1 = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource1);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset2').returns(mockResource2);
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should create a new relationship from an array of objects if permitted', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack([{
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset1'
                }, {
                    $class: 'org.acme.MyAsset1',
                    assetId: 'asset2'
                }]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            let mockResource1 = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset1').returns(mockResource1);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockFactory.newResource.withArgs('org.acme', 'MyAsset1', 'asset2').returns(mockResource2);
            let subResources = jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            subResources.should.have.length.of(2);
            subResources[0].should.be.an.instanceOf(Resource);
            subResources[1].should.be.an.instanceOf(Resource);
        });

        it('should throw if the JSON data in the array is not a string or an object', () => {
            let options = {
                jsonStack: new TypedStack([3.142]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should throw if the JSON data in the array is an object without a class', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack([{}]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(/Invalid JSON data/);
        });

        it('should throw if the JSON data in the array is an object with a class that causes an error to be thrown', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack([{
                    $class: 'org.acme.NoSuchClass'
                }]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(TypeNotFoundException, /NoSuchClass/);
        });

        it('should throw if the JSON data in the array is an object with a class that does not exist', () => {
            jsonPopulator = new JSONPopulator(true); // true to enable acceptResourcesForRelationships
            let options = {
                jsonStack: new TypedStack([{
                    $class: 'org.acme.NoSuchClass'
                }]),
                resourceStack: new TypedStack({}),
                factory: mockFactory,
                modelManager: modelManager
            };
            sandbox.stub(modelManager, 'getType').withArgs('org.acme.NoSuchClass').throws(new TypeNotFoundException('org.acme.NoSuchClass'));
            (() => {
                jsonPopulator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(TypeNotFoundException, /NoSuchClass/);
        });

    });

});
