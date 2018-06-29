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
const ModelManager = require('../../lib/modelmanager');
const TypedStack = require('../../lib/serializer/typedstack');
const ModelUtil = require('../../lib/modelutil');


let chai = require('chai'), should = chai.should();
const sinon = require('sinon');

describe('JSONGenerator', () => {

    let modelManager;
    let factory;
    let jsonGenerator;
    let sandbox;
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

        relationshipDeclaration1 = modelManager.getType('org.acme.MyTx1').getProperty('myAsset');
        relationshipDeclaration2 = modelManager.getType('org.acme.MyTx2').getProperty('myAssets');
        relationshipDeclaration3 = modelManager.getType('org.acme.SimpleAssetCircle').getProperty('next');
        relationshipDeclaration4 = modelManager.getType('org.acme.SimpleAssetCircleArray').getProperty('next');
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        jsonGenerator = new JSONGenerator();
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

        it('should pass through an integer object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Integer'; } }, 123456).should.equal(123456);
        });

        it('should pass through a double object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Double'; } }, 3.142).should.equal(3.142);
        });

        it('should pass through a long object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Long'; } }, 1234567890).should.equal(1234567890);
        });

        it('should pass through a string object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello world').should.equal('hello world');
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello"world').should.equal('hello"world');
            jsonGenerator.convertToJSON({ getType: () => { return 'String'; } }, 'hello\nworld').should.equal('hello\nworld');
        });

        it('should convert a date time object to ISOString', () => {
            let date = new Date('Wed, 09 Aug 1995 00:00:00 GMT');
            jsonGenerator.convertToJSON({ getType: () => { return 'DateTime'; } }, date).should.equal('1995-08-09T00:00:00.000Z');
        });

        it('should pass through a boolean object', () => {
            jsonGenerator.convertToJSON({ getType: () => { return 'Boolean'; } }, true).should.equal(true);
            jsonGenerator.convertToJSON({ getType: () => { return 'Boolean'; } }, false).should.equal(false);
        });

    });

    describe('#visitRelationshipDeclaration', () => {

        it('should generate a relationship', () => {
            let relationship = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager
            };
            options.stack.push(relationship);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            result.should.be.equal(result, 'resource:org.acme.MyAsset1#DOGE_1');
        });

        it('should throw when generating a resource by default', () => {
            let resource = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager
            };
            options.stack.push(resource);
            (() => {
                jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            }).should.throw(/Did not find a relationship/);
        });

        it('should generate a resource if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push(resource);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration1, options);
            result.should.deep.equal({ '$class': 'org.acme.MyAsset1', assetId: 'DOGE_1' });
        });

        it('should generate a circular resource if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource1 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_2');
            let resource3 = factory.newResource('org.acme', 'SimpleAssetCircle', 'DOGE_3');
            resource1.next = resource2;
            resource2.next = resource3;
            resource3.next = resource1;
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push(resource1);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration3, options);
            result.should.deep.equal({'$class':'org.acme.SimpleAssetCircle','assetId':'DOGE_1','next':{'$class':'org.acme.SimpleAssetCircle','assetId':'DOGE_2','next':{'$class':'org.acme.SimpleAssetCircle','assetId':'DOGE_3','next':'resource:org.acme.SimpleAssetCircle#DOGE_1'}}});
        });

        it('should generate an array of relationships', () => {
            let relationship1 = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_1');
            let relationship2 = factory.newRelationship('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager
            };
            options.stack.push([relationship1, relationship2]);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            result.should.deep.equal(['resource:org.acme.MyAsset1#DOGE_1', 'resource:org.acme.MyAsset1#DOGE_2']);
        });

        it('should throw when generating an array of resources by default', () => {
            let resource1 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager
            };
            options.stack.push([resource1, resource2]);
            (() => {
                jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            }).should.throw(/Did not find a relationship/);
        });

        it('should generate an array of resources if option is specified', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let resource1 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_1');
            let resource2 = factory.newResource('org.acme', 'MyAsset1', 'DOGE_2');
            let options = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push([resource1, resource2]);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration2, options);
            result.should.deep.equal([{ '$class': 'org.acme.MyAsset1', assetId: 'DOGE_1' }, { '$class': 'org.acme.MyAsset1', assetId: 'DOGE_2' }]);
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
                modelManager: modelManager,
                seenResources: new Set()
            };
            options.stack.push([resource1, resource2, resource3]);
            let result = jsonGenerator.visitRelationshipDeclaration(relationshipDeclaration4, options);
            result.should.deep.equal([{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_1','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_2','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_3','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_1','resource:org.acme.SimpleAssetCircleArray#DOGE_2']},'resource:org.acme.SimpleAssetCircleArray#DOGE_1']},{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_3','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_1',{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_2','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_3','resource:org.acme.SimpleAssetCircleArray#DOGE_1']}]}]},{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_2','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_3','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_1','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_2','resource:org.acme.SimpleAssetCircleArray#DOGE_3']},'resource:org.acme.SimpleAssetCircleArray#DOGE_2']},{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_1','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_2',{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_3','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_1','resource:org.acme.SimpleAssetCircleArray#DOGE_2']}]}]},{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_3','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_1','next':[{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_2','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_3','resource:org.acme.SimpleAssetCircleArray#DOGE_1']},'resource:org.acme.SimpleAssetCircleArray#DOGE_3']},{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_2','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_3',{'$class':'org.acme.SimpleAssetCircleArray','assetId':'DOGE_1','next':['resource:org.acme.SimpleAssetCircleArray#DOGE_2','resource:org.acme.SimpleAssetCircleArray#DOGE_3']}]}]}]);
        });

        it('should throw if stack contains something other than a Resource or Concept', () => {
            jsonGenerator = new JSONGenerator(false, true);
            let options = {
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

        let isEnumStub;

        before(() => {
            isEnumStub = sandbox.stub(ModelUtil,'isEnum');
        });

        it('should populate if a primitive string', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'String';}
            };
            isEnumStub.returns(false);
            let primitive = 'WONGA-1';
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), 'WONGA-1');
        });

        it('should populate if a primitive integer', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'Integer';}
            };
            isEnumStub.returns(false);
            let primitive = 2;
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), 2);
        });

        it('should populate if a primitive double', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'Double';}
            };
            isEnumStub.returns(false);
            let primitive = 2.1212;
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), 2.1212);
        });

        it('should populate if a primitive Long', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'Long';}
            };
            isEnumStub.returns(false);
            let primitive = 1234567890;
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), 1234567890);
        });

        it('should populate if a primitive Boolean', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'Boolean';}
            };
            isEnumStub.returns(false);
            let primitive = true;
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), true);
        });

        it('should populate if an Enum', () => {
            let field = {
                'isArray':function(){return false;},
                'isPrimitive':function(){return false;},
                'getType':function(){return 'String';}
            };
            isEnumStub.returns(true);

            let primitive = 'WONGA-1';
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(primitive);
            should.equal(jsonGenerator.visitField(field, parameters), 'WONGA-1');
        });

        it('should recurse if an object', () => {
            let field = {
                'getName':function(){return 'vehicle';},
                'isArray':function(){return false;},
                'isPrimitive':function(){return false;},
                'getParent':function(){return 'vehicle';},
                'getType':function(){return 'String';}
            };
            isEnumStub.returns(false);

            let concept = factory.newConcept('org.acme.sample','Car');
            concept.numberPlate = 'PENGU1N';
            concept.numberOfSeats = '2';
            concept.color = 'GREEN';

            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(concept);

            let spy = sinon.spy(jsonGenerator, 'visitField');

            let result = jsonGenerator.visitField(field,parameters);
            result.should.deep.equal({ '$class': 'org.acme.sample.Car',
                color: 'GREEN',
                numberOfSeats: '2',
                numberPlate: 'PENGU1N' });
            spy.callCount.should.equal(4); // We call it once at the start, then it recurses three times
        });

        it('should populate an array if array contains primitives', () => {
            let field = {
                'isArray':function(){return true;},
                'isPrimitive':function(){return true;},
                'getType':function(){return 'String';}
            };
            let array = ['WOMBAT','RULEZ', 'OK'];
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
                seenResources: new Set()
            };
            parameters.stack.push(array);
            isEnumStub.returns(false);

            let result = jsonGenerator.visitField(field,parameters);
            result.should.be.deep.equal([ 'WOMBAT', 'RULEZ', 'OK' ]);
        });

        it('should populate an array if array contains a Enums', () => {
            let field = {
                'getName':function(){return 'vehicle';},
                'isArray':function(){return false;},
                'isPrimitive':function(){return false;},
                'getParent':function(){return 'vehicle';},
                'getType':function(){return 'Integer';}
            };
            let myEnum = {
                RED : 0,
                GREEN : 1,
                BLUE : 2
            };
            let array = [myEnum.RED, myEnum.BLUE, myEnum.GREEN];
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager,
            };
            parameters.stack.push(array);
            isEnumStub.returns(true);

            let result = jsonGenerator.visitField(field,parameters);
            result.should.deep.equal([0, 2, 1]);
        });

        it('should recurse if array contains an object', () => {
            let field = {
                'getName':function(){return 'vehicle';},
                'isArray':function(){return true;},
                'isPrimitive':function(){return false;},
                'getParent':function(){return 'vehicle';},
                'getType':function(){return 'String';}
            };
            let child1 = factory.newResource('org.acme','MyAsset1','child1');
            let child2 = factory.newResource('org.acme','MyAsset1','child2');
            let myAssets = [child1, child2];
            let parameters = {
                stack: new TypedStack({}),
                modelManager: modelManager
            };
            parameters.stack.push(myAssets);
            isEnumStub.returns(false);
            let spy = sinon.spy(jsonGenerator, 'visitField');

            let result = jsonGenerator.visitField(field,parameters);
            result.should.deep.equal([
                { '$class': 'org.acme.MyAsset1', assetId: 'child1' },
                { '$class': 'org.acme.MyAsset1', assetId: 'child2' } ]);

            spy.callCount.should.equal(3); // we call it once at the start, the function recurses into it twice
        });

    });

});
