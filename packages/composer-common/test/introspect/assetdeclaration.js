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

const IllegalModelException = require('../../lib/introspect/illegalmodelexception');
const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');

const should = require('chai').should();
const sinon = require('sinon');

describe('AssetDeclaration', () => {

    let mockModelManager;
    let mockClassDeclaration;
    let mockSystemAsset;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockModelManager =  sinon.createStubInstance(ModelManager);
        mockSystemAsset = sinon.createStubInstance(AssetDeclaration);
        mockSystemAsset.getFullyQualifiedName.returns('org.hyperledger.composer.system.Asset');
        mockModelManager.getSystemTypes.returns([mockSystemAsset]);
        mockClassDeclaration = sinon.createStubInstance(AssetDeclaration);
        mockModelManager.getType.returns(mockClassDeclaration);
        mockClassDeclaration.getProperties.returns([]);
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
        //     sinon.assert.calledWith(mockModelManager.getType, 'com.hyperledger.elsewhere.BaseAsset');
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

        it('should throw an an IllegalModelException if its not a System Type and is called Asset', () => {
            let asset = loadLastAssetDeclaration('test/data/parser/assetdeclaration.systypename.cto');
            try {
                asset.validate();
            } catch (err) {
                err.should.be.an.instanceOf(IllegalModelException);
                err.message.should.match(/Asset is a reserved type name./);
            }
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

});
