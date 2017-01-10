/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Factory = require('../../lib/factory');
const InstanceGenerator = require('../../lib/serializer/instancegenerator');
const ModelManager = require('../../lib/modelmanager');
const TypedStack = require('../../lib/serializer/typedstack');

const chai = require('chai');
chai.should();

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

    let test = (modelFile) => {
        modelManager.addModelFile(modelFile);
        let resource = factory.newInstance('org.acme.test', 'MyAsset', 'asset1');
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

    });

});
