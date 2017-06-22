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
const InstanceGenerator = require('../../lib/serializer/instancegenerator');
const ModelManager = require('../../lib/modelmanager');
const TypedStack = require('../../lib/serializer/typedstack');

const chai = require('chai');
const should = chai.should();

describe('InstanceGenerator', () => {

    let factory;
    let modelManager;
    let parameters;
    let visitor;

    beforeEach(() => {
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        parameters = {
            modelManager: modelManager,
            factory: factory
        };
        visitor = new InstanceGenerator();
    });

    let test = (modelFile, additionalParams) => {
        modelManager.addModelFile(modelFile);
        Object.assign(parameters, additionalParams);
        let resource = factory.newResource('org.acme.test', 'MyAsset', 'asset1');
        parameters.stack = new TypedStack(resource);
        let classDeclaration = resource.getClassDeclaration();
        return classDeclaration.accept(visitor, parameters);
    };

    describe('#visit', () => {

        it('should throw on unrecognized thing', () => {
            (() => {
                visitor.visit(new Date(), {});
            }).should.throw(/Unrecognised/);
        });

        it('should generate a default value for a string property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o String theValue
            }`);
            resource.theValue.should.be.a('string');
        });

        it('should generate a default value for a string array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o String[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.a('string');
            resource.theValues[1].should.be.a('string');
            resource.theValues[2].should.be.a('string');
        });

        it('should generate a default value for a date/time property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o DateTime theValue
            }`);
            resource.theValue.should.be.an.instanceOf(Date);
        });

        it('should generate a default value for a date/time array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o DateTime[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.an.instanceOf(Date);
            resource.theValues[1].should.be.an.instanceOf(Date);
            resource.theValues[2].should.be.an.instanceOf(Date);
        });

        it('should generate a default value for an integer property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Integer theValue
            }`);
            resource.theValue.should.be.a('number');
        });

        it('should generate a default value for an integer array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Integer[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.a('number');
            resource.theValues[1].should.be.a('number');
            resource.theValues[2].should.be.a('number');
        });

        it('should generate a default value for a long property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Long theValue
            }`);
            resource.theValue.should.be.a('number');
        });

        it('should generate a default value for a long array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Long[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.a('number');
            resource.theValues[1].should.be.a('number');
            resource.theValues[2].should.be.a('number');
        });

        it('should generate a default value for a double property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Double theValue
            }`);
            resource.theValue.should.be.a('number');
        });

        it('should generate a default value for a double array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Double[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.a('number');
            resource.theValues[1].should.be.a('number');
            resource.theValues[2].should.be.a('number');
        });

        it('should generate a default value for a boolean property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Boolean theValue
            }`);
            resource.theValue.should.be.a('boolean');
        });

        it('should generate a default value for a boolean array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o Boolean[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.a('boolean');
            resource.theValues[1].should.be.a('boolean');
            resource.theValues[2].should.be.a('boolean');
        });

        it('should generate a default value for an enum property', () => {
            let resource = test(`namespace org.acme.test
            enum MyEnum {
                o ENUM_VAL1
                o ENUM_VAL2
                o ENUM_VAL3
            }
            asset MyAsset identified by assetId {
                o String assetId
                o MyEnum theValue
            }`);
            resource.theValue.should.be.oneOf(['ENUM_VAL1', 'ENUM_VAL2', 'ENUM_VAL3']);
        });

        it('should generate a default value for an enum array property', () => {
            let resource = test(`namespace org.acme.test
            enum MyEnum {
                o ENUM_VAL1
                o ENUM_VAL2
                o ENUM_VAL3
            }
            asset MyAsset identified by assetId {
                o String assetId
                o MyEnum[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].should.be.oneOf(['ENUM_VAL1', 'ENUM_VAL2', 'ENUM_VAL3']);
            resource.theValues[1].should.be.oneOf(['ENUM_VAL1', 'ENUM_VAL2', 'ENUM_VAL3']);
            resource.theValues[2].should.be.oneOf(['ENUM_VAL1', 'ENUM_VAL2', 'ENUM_VAL3']);
        });

        it('should generate a default value for a relationship property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                --> MyAsset theValue
            }`);
            resource.theValue.getIdentifier().should.match(/^assetId:\d{4}$/);
        });

        it('should generate a default value for a relationship array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                --> MyAsset[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].getIdentifier().should.match(/^assetId:\d{4}$/);
            resource.theValues[1].getIdentifier().should.match(/^assetId:\d{4}$/);
            resource.theValues[2].getIdentifier().should.match(/^assetId:\d{4}$/);
        });

        it('should generate a default value for a resource property', () => {
            let resource = test(`namespace org.acme.test
            asset MyInnerAsset identified by innerAssetId {
                o String innerAssetId
                o String theValue
            }
            asset MyAsset identified by assetId {
                o String assetId
                o MyInnerAsset theValue
            }`);
            resource.theValue.getIdentifier().should.match(/^innerAssetId:\d{4}$/);
            resource.theValue.theValue.should.be.a('string');
        });

        it('should generate a default value for a resource array property', () => {
            let resource = test(`namespace org.acme.test
            asset MyInnerAsset identified by innerAssetId {
                o String innerAssetId
                o String theValue
            }
            asset MyAsset identified by assetId {
                o String assetId
                o MyInnerAsset[] theValues
            }`);
            resource.theValues.should.have.lengthOf(3);
            resource.theValues[0].getIdentifier().should.match(/^innerAssetId:\d{4}$/);
            resource.theValues[0].theValue.should.be.a('string');
            resource.theValues[1].getIdentifier().should.match(/^innerAssetId:\d{4}$/);
            resource.theValues[1].theValue.should.be.a('string');
            resource.theValues[2].getIdentifier().should.match(/^innerAssetId:\d{4}$/);
            resource.theValues[2].theValue.should.be.a('string');
        });

        it('should generate a default value for base class properties', () => {
            let resource = test(`namespace org.acme.test
            abstract asset BaseAsset {
                o String inheritedValue
            }
            asset MyAsset identified by assetId extends BaseAsset {
                o String assetId
            }`);
            resource.inheritedValue.should.be.a('string');
        });

        it('should generate a concrete class for an abstract type if one is available', () => {
            let resource = test(`namespace org.acme.test
            abstract concept BaseConcept {
                o String inheritedValue
            }
            concept MyConcept extends BaseConcept {
                o String concreteConceptValue
            }
            asset MyAsset identified by id {
                o String id
                o BaseConcept aConcept
            }`);
            resource.aConcept.$type.should.match(/^MyConcept$/);
        });

        it('should throw an error when trying to generate a resource from a model that uses an Abstract type with no concrete Implementing type', () => {
            try {
                test(`namespace org.acme.test
                    abstract concept BaseConcept {
                        o String inheritedValue
                    }
                    asset MyAsset identified by id {
                        o String id
                        o BaseConcept aConcept
                    }`);
            } catch (error) {
                error.should.match(/^Error: No concrete extending type for org.acme.test.BaseConcept$/);
            }
        });

        it('should not generate default value for optional property if not requested', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o String theValue optional
            }`, { includeOptionalFields: false });
            should.equal(resource.theValue, undefined);
        });

        it('should generate default value for optional property if requested', () => {
            let resource = test(`namespace org.acme.test
            asset MyAsset identified by assetId {
                o String assetId
                o String theValue optional
            }`, { includeOptionalFields: true });
            resource.theValue.should.be.a('String');
        });

    });

});
