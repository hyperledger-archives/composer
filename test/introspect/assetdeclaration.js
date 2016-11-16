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

const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

const should = require('chai').should();
const sinon = require('sinon');

describe('AssetDeclaration', () => {

    let mockModelManager;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockModelManager = sinon.createStubInstance(ModelManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    let loadAssetDeclaration = (modelFileName) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(mockModelManager, modelDefinitions);
        let assets = modelFile.getAssetDeclarations();
        assets.should.have.lengthOf(1);
        return assets[0];
    };

    let loadLastAssetDeclaration = (modelFileName) => {
        let modelDefinitions = fs.readFileSync(modelFileName, 'utf8');
        let modelFile = new ModelFile(mockModelManager, modelDefinitions);
        let assets = modelFile.getAssetDeclarations();
        return assets[assets.length - 1];
    };

    describe('#constructor', () => {

        it('should throw if modelFile not specified', () => {
            (() => {
                new AssetDeclaration(null, {});
            }).should.throw(/required/);
        });

        it('should throw if ast not specified', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            (() => {
                new AssetDeclaration(mockModelFile, null);
            }).should.throw(/required/);
        });

    });

    describe('#validate', () => {

        it('should resolve an imported base asset', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockModelManager.getType.returns(mockAssetDeclaration);
            mockAssetDeclaration.getProperties.returns([]);
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.resolve.cto');
            asset.validate();
            sinon.assert.called(mockModelManager.getType);
            sinon.assert.calledWith(mockModelManager.getType, 'com.ibm.elsewhere.BaseAsset');
        });

        it('should throw when it fails to resolve an imported base asset', () => {
            mockModelManager.getType.returns(null);
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.resolve.cto');
            (() => {
                asset.validate();
            }).should.throw(/Could not find super type/);
        });

        it('should throw when identifying field is not a string', () => {
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.numid.cto');
            (() => {
                asset.validate();
            }).should.throw(/type of the field is not String/);
        });

        it('should throw when identifying field is optional', () => {
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.optid.cto');
            (() => {
                asset.validate();
            }).should.throw(/Identifying fields cannot be optional/);
        });

        it('should throw when field has been duplicated in the same class', () => {
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.dupesimp.cto');
            (() => {
                asset.validate();
            }).should.throw(/more than one field named/);
        });

        it('should throw when field has been duplicated in the same class hierachy', () => {
            let asset = loadLastAssetDeclaration('test/data/parser/assetdeclaration.dupecomp.cto');
            (() => {
                asset.validate();
            }).should.throw(/more than one field named/);
        });

    });

    describe('#getSuperType', () => {

        it('should return the fully qualified super type', () => {
            let asset = loadLastAssetDeclaration('test/data/parser/assetdeclaration.json.cto');
            asset.getSuperType().should.equal('com.ibm.testing.BaseAsset');
        });

        it('should throw when the super type is missing', () => {
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.missingsuper.cto');
            (() => {
                asset.getSuperType();
            }).should.throw(/Could not find super type/);
        });

    });

    describe('#getProperty', () => {

        it('should resolve an imported base property', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockModelManager.getType.returns(mockAssetDeclaration);
            mockAssetDeclaration.getProperty.returns(null);
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.resolve.cto');
            should.equal(asset.getProperty('noSuchProperty'), null);
            sinon.assert.calledOnce(mockAssetDeclaration.getProperty);
            sinon.assert.calledWith(mockAssetDeclaration.getProperty, 'noSuchProperty');
        });

    });

    describe('#getProperties', () => {

        it('should throw if base type not found', () => {
            mockModelManager.getType.returns(null);
            let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.resolve.cto');
            (() => {
                asset.getProperties();
            }).should.throw(/Could not find super type/);
        });

    });

    describe('#toJSON', () => {

        it('should return a JSON object suitable for serialization', () => {
            let asset = loadLastAssetDeclaration('test/data/parser/assetdeclaration.json.cto');
            asset.validate();
            let jsonObject = asset.toJSON();
            jsonObject.should.be.an('object');
            jsonObject.name.should.equal('TestAsset');
            jsonObject.idField.should.equal('assetId');
            jsonObject.superType.should.equal('BaseAsset');
            jsonObject.abstract.should.equal(false);
            jsonObject.fields.should.have.lengthOf(3);
            jsonObject.relationships.should.have.lengthOf(1);
            jsonObject.enumValues.should.have.lengthOf(0);
        });

    });

});
