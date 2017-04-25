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

        // skip('should resolve an imported base asset', () => {
        //     let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
        //     mockModelManager.getType.returns(mockAssetDeclaration);
        //     mockAssetDeclaration.getProperties.returns([]);
        //     let asset = loadAssetDeclaration('test/data/parser/assetdeclaration.resolve.cto');
        //     let mockModelFile = sinon.createStubInstance(ModelFile);
        //     asset.getModelFile.returns(mockModelFile);
        //     mockModelFile.getType.returns(mockAssetDeclaration);
        //     asset.validate();
        //     sinon.assert.called(mockModelManager.getType);
        //     sinon.assert.calledWith(mockModelManager.getType, 'com.ibm.elsewhere.BaseAsset');
        // });

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

        it('should return an empty object', () => {
            let asset = loadLastAssetDeclaration('test/data/parser/assetdeclaration.json.cto');
            asset.validate();
            let jsonObject = asset.toJSON();
            jsonObject.should.deep.equal({});
        });

    });

});
