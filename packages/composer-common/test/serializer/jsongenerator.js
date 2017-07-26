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
const JSONGenerator = require('../../lib/serializer/jsongenerator');
const JSONWriter = require('../../lib/codegen/jsonwriter');
const ModelManager = require('../../lib/modelmanager');
const TypedStack = require('../../lib/serializer/typedstack');
const ModelUtil = require('../../lib/modelutil');


let chai = require('chai'), should = chai.should();
const sinon = require('sinon');

describe('JSONGenerator', () => {

    let modelManager;
    let factory;
    // let mockFactory;
    let jsonGenerator;
    let mockJSONWriter;
    let sandbox;
    // let assetDeclaration1;
    let relationshipDeclaration1;
    let relationshipDeclaration2;
    let relationshipDeclaration3;
    let relationshipDeclaration4;

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
            asset SimpleAssetCircle identified by assetId {
                o String assetId
                --> SimpleAssetCircle next
            }
            asset SimpleAssetCircleArray identified by assetId {
                o String assetId
                --> SimpleAssetCircleArray[] next
            }
        `);

        modelManager.addModelFile(`
            namespace org.foo
            asset AnotherAsset identified by assetId {
                o String assetId
            }
        `);

        modelManager.addModelFile(`
            namespace org.acme.sample

            asset SampleAsset identified by assetId {
            o String assetId
            o Vehicle vehicle
            }

            abstract concept Vehicle{
            o String numberPlate
            o String color
            }

            concept Car extends Vehicle{
            o Integer numberOfSeats
            }
        `);

        factory = new Factory(modelManager);

        // assetDeclaration1 = modelManager.getType('org.acme.SimpleAssetCircle').getProperty('myAsset');
        relationshipDeclaration1 = modelManager.getType('org.acme.MyTx1').getProperty('myAsset');
        relationshipDeclaration2 = modelManager.getType('org.acme.MyTx2').getProperty('myAssets');
        relationshipDeclaration3 = modelManager.getType('org.acme.SimpleAssetCircle').getProperty('next');
        relationshipDeclaration4 = modelManager.getType('org.acme.SimpleAssetCircleArray').getProperty('next');
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        // mockFactory = sinon.createStubInstance(Factory);
        jsonGenerator = new JSONGenerator();
        mockJSONWriter = sinon.createStubInstance(JSONWriter);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#visit', () => {

        it('should throw an error for an unrecognized type', () => {
            (() => {
                jsonGenerator.visit(3.142, {});
            }).should.throw(/Unrecognised/);
        });

    });

    describe('#convertToJSON', () => {

        it('should serialize an integer object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Integer'; } }, 123456).should.equal('123456');
        });

        it('should serialize an double object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Double'; } }, 3.142).should.equal('3.142');
        });

        it('should serialize an long object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Long'; } }, 1234567890).should.equal('1234567890');
        });

        it('should serialize an string object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello world').should.equal('"hello world"');
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello"world').should.equal('"hello\\"world"');
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello\nworld').should.equal('"hello\\nworld"');
        });

        it('should serialize a date time object', () => {
            let date = new Date('Wed, 09 Aug 1995 00:00:00 GMT');
            jsonGenerator.convertToJSON({ getType: () => { return 'DateTime'; } }, date).should.equal('"1995-08-09T00:00:00.000Z"');
        });

        it('should serialize an boolean object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Boolean'; } }, true).should.equal('true');
            jsonGenerator.convertToJSON({ getType: () => { return 'Boolean'; } }, false).should.equal('false');
        });

    });

    describe('#visitRelationshipDeclaration', () => {

        it('should serialize a relationship', () => {
            let relationship = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager
            };
            options.stack.push(relationship);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            sinon.assert.calledOnce(mockJSONWriter.writeStringValue);
            sinon.assert.calledWith(mockJSONWriter.writeStringValue, 'resource:org.acme.MyAsset1#DOGE_1');
        });

        it('should throw when serializing a resource by default', () => {
            let resource = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager
            };
            options.stack.push(resource);
            (() => {
                jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(/Did not find a relationship/);
        });

        it('should serialize a resource if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push(resource);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            sinon.assert.calledOnce(mockJSONWriter.openObject);
            sinon.assert.calledOnce(mockJSONWriter.closeObject);
        });

        it('should serialize a circular resource if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_2');
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_3');
            resource1.next = resource2;
            resource2.next = resource3;
            resource3.next = resource1;
            let options = {
                stack: new TypedStack({}),
                writer: new JSONWriter(),
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push(resource1);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration3, options);
            options.writer.getBuffer().should.equal('"next":{"$class":"org.acme.SimpleAssetCircle","assetId":"DOGE_1","next":{"$class":"org.acme.SimpleAssetCircle","assetId":"DOGE_2","next":{"$class":"org.acme.SimpleAssetCircle","assetId":"DOGE_3","next":"resource:org.acme.SimpleAssetCircle#DOGE_1"}}}');
        });

        it('should serialize an array of relationships', () => {
            let relationship1 = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager
            };
            options.stack.push([relationship1, relationship2]);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            sinon.assert.calledOnce(mockJSONWriter.openArray);
            sinon.assert.calledTwice(mockJSONWriter.writeArrayStringValue);
            sinon.assert.calledWith(mockJSONWriter.writeArrayStringValue, 'resource:org.acme.MyAsset1#DOGE_1');
            sinon.assert.calledWith(mockJSONWriter.writeArrayStringValue, 'resource:org.acme.MyAsset1#DOGE_2');
            sinon.assert.calledOnce(mockJSONWriter.closeArray);
        });

        it('should throw when serializing an array of resources by default', () => {
            let resource1 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager
            };
            options.stack.push([resource1, resource2]);
            (() => {
                jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(/Did not find a relationship/);
        });

        it('should serialize an array of resources if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource1 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                writer: mockJSONWriter,
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push([resource1, resource2]);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            sinon.assert.calledOnce(mockJSONWriter.openArray);
            sinon.assert.calledTwice(mockJSONWriter.writeComma);
            sinon.assert.calledTwice(mockJSONWriter.openObject);
            sinon.assert.calledTwice(mockJSONWriter.closeObject);
            sinon.assert.calledOnce(mockJSONWriter.closeArray);
        });

        it('should serialize a circular array of resources if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'DOGE_2');
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'DOGE_3');
            resource1.next = [resource2, resource3];
            resource2.next = [resource3, resource1];
            resource3.next = [resource1, resource2];
            let options = {
                stack: new TypedStack({}),
                writer: new JSONWriter(),
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push([resource1, resource2, resource3]);
            jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration4, options);
            options.writer.getBuffer().should.equal('"next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_1","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_2","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_3","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_1""resource:org.acme.SimpleAssetCircleArray#DOGE_2"]}"resource:org.acme.SimpleAssetCircleArray#DOGE_1"]},{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_3","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_1",{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_2","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_3""resource:org.acme.SimpleAssetCircleArray#DOGE_1"]}]}]},{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_2","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_3","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_1","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_2""resource:org.acme.SimpleAssetCircleArray#DOGE_3"]}"resource:org.acme.SimpleAssetCircleArray#DOGE_2"]},{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_1","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_2",{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_3","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_1""resource:org.acme.SimpleAssetCircleArray#DOGE_2"]}]}]},{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_3","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_1","next":[{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_2","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_3""resource:org.acme.SimpleAssetCircleArray#DOGE_1"]}"resource:org.acme.SimpleAssetCircleArray#DOGE_3"]},{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_2","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_3",{"$class":"org.acme.SimpleAssetCircleArray","assetId":"DOGE_1","next":["resource:org.acme.SimpleAssetCircleArray#DOGE_2""resource:org.acme.SimpleAssetCircleArray#DOGE_3"]}]}]}]');
        });

        it('should throw if stack contains something other than a Resource or Concept', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let options = {
                writer: new JSONWriter(),
                stack: new TypedStack({})
            };
            options.stack.push('string');
            (() => {
                jsonGenerator.visitClassDeclaration(relationshipDeclaration4, options);
            }).should.throw(/Expected a Resource or a Concept/);
        });
    });

    describe('#getRelationshipText', () => {

        it('should return a relationship string for a relationship', () => {
            let relationship = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_1');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, relationship).should.equal('resource:org.acme.MyAsset1#DOGE_1');
        });

        it('should return a relationship string for a relationship in another namespace', () => {
            let relationship = factory.newRelationship('org.foo', 'AnotherAsset', 'DOGE_1');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, relationship).should.equal('resource:org.foo.AnotherAsset#DOGE_1');
        });

        it('should throw an error for a resource if not permitted', () => {
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircleArray', 'DOGE_1');
            (() => {
                jsonGenerator.getRelationshipText(relationshipDeclaration1, resource1);
            }).should.throw(/Did not find a relationship/);
        });

        it('should return a relationship string for a resource if permitted', () => {
            jsonGenerator = new JSONGenerator(true); // true enables convertResourcesToRelationships
            let resource = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, resource).should.equal('resource:org.acme.MyAsset1#DOGE_1');
        });

    });

    describe('#visitField', () => {

        it('should visit field', () => {
            let field = {'getName':function(){return 'vehicle';},'isArray':function(){return false;},'isPrimitive':function(){return false;},
                'getParent':function(){return 'vehicle';}};
            let concept = factory.newConcept('org.acme.sample','Car');
            let parameters = {
                stack: new TypedStack({}),
                writer: new JSONWriter(),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(concept);
            sinon.stub(ModelUtil.prototype.constructor,'isEnum').returns(false);
            should.equal(jsonGenerator.visitField(field,parameters),null);
        });

    });

});
