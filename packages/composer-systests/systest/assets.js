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

const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));

describe('Asset system tests', function () {
    let bnID;
    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });

    let businessNetworkDefinition;
    let client;

    before(function () {
        // In this systest we are intentionally not fully specifying the model file with a fileName, but supplying "UNKNOWN"
        const modelFiles = [
            { fileName: 'UNKNOWN', contents:fs.readFileSync(path.resolve(__dirname, 'data/assets.cto'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-assets@0.0.1', 'The network for the asset system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });

        bnID = businessNetworkDefinition.getName();

        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest-assets')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
    });

    let createAsset = (assetId) => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.assets', 'SimpleAsset', assetId);
        asset.stringValue = 'hello world';
        asset.stringValues = [ 'hello', 'world' ];
        asset.doubleValue = 3.142;
        asset.doubleValues = [ 4.567, 8.901 ];
        asset.integerValue = 1024;
        asset.integerValues = [ 32768, -4096 ];
        asset.longValue = 131072;
        asset.longValues = [ 999999999, -1234567890 ];
        asset.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
        asset.dateTimeValues = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        asset.booleanValue = true;
        asset.booleanValues = [ false, true ];
        asset.enumValue = 'WOW';
        asset.enumValues = [ 'SUCH', 'MANY', 'MUCH' ];
        return asset;
    };

    let createAssetContainer = () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.assets', 'SimpleAssetContainer', 'dogeAssetContainer');
        return asset;
    };

    let createAssetRelationshipContainer = () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.assets', 'SimpleAssetRelationshipContainer', 'dogeAssetRelationshipContainer');
        return asset;
    };

    let validateAsset = (asset, assetId) => {
        asset.getIdentifier().should.equal(assetId);
        asset.stringValue.should.equal('hello world');
        asset.stringValues.should.deep.equal([ 'hello', 'world' ]);
        asset.doubleValue.should.equal(3.142);
        asset.doubleValues.should.deep.equal([ 4.567, 8.901 ]);
        asset.integerValue.should.equal(1024);
        asset.integerValues.should.deep.equal([ 32768, -4096 ]);
        asset.longValue.should.equal(131072);
        asset.longValues.should.deep.equal([ 999999999, -1234567890 ]);
        let expectedDate = new Date('1994-11-05T08:15:30-05:00');
        asset.dateTimeValue.getTime().should.equal(expectedDate.getTime());
        let expectedDates = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        asset.dateTimeValues[0].getTime().should.equal(expectedDates[0].getTime());
        asset.dateTimeValues[1].getTime().should.equal(expectedDates[1].getTime());
        asset.booleanValue.should.equal(true);
        asset.booleanValues.should.deep.equal([ false, true ]);
        asset.enumValue.should.equal('WOW');
        asset.enumValues.should.deep.equal([ 'SUCH', 'MANY', 'MUCH' ]);
    };

    let validateAssetContainer = (assetContainer, assetId) => {
        assetContainer.getIdentifier().should.equal(assetId);
        validateAsset(assetContainer.simpleAsset, 'dogeAsset1');
        assetContainer.simpleAssets.length.should.equal(2);
        validateAsset(assetContainer.simpleAssets[0], 'dogeAsset2');
        validateAsset(assetContainer.simpleAssets[1], 'dogeAsset3');
    };

    let validateAssetRelationshipContainer = (assetContainer, assetId) => {
        assetContainer.getIdentifier().should.equal(assetId);
        assetContainer.simpleAsset.$class.should.equal('Relationship');
        assetContainer.simpleAsset.getFullyQualifiedIdentifier().should.equal('systest.assets.SimpleAsset#dogeAsset1');
        assetContainer.simpleAssets.length.should.equal(2);
        assetContainer.simpleAssets[0].$class.should.equal('Relationship');
        assetContainer.simpleAssets[0].getFullyQualifiedIdentifier().should.equal('systest.assets.SimpleAsset#dogeAsset2');
        assetContainer.simpleAssets[1].$class.should.equal('Relationship');
        assetContainer.simpleAssets[1].getFullyQualifiedIdentifier().should.equal('systest.assets.SimpleAsset#dogeAsset3');
    };

    let validateResolvedAsset = (asset, assetId) => {
        asset.assetId.should.equal(assetId);
        asset.stringValue.should.equal('hello world');
        asset.stringValues.should.deep.equal([ 'hello', 'world' ]);
        asset.doubleValue.should.equal(3.142);
        asset.doubleValues.should.deep.equal([ 4.567, 8.901 ]);
        asset.integerValue.should.equal(1024);
        asset.integerValues.should.deep.equal([ 32768, -4096 ]);
        asset.longValue.should.equal(131072);
        asset.longValues.should.deep.equal([ 999999999, -1234567890 ]);
        let expectedDate = new Date('1994-11-05T08:15:30-05:00');
        (new Date(asset.dateTimeValue)).getTime().should.equal(expectedDate.getTime());
        let expectedDates = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
        (new Date(asset.dateTimeValues[0])).getTime().should.equal(expectedDates[0].getTime());
        (new Date(asset.dateTimeValues[1])).getTime().should.equal(expectedDates[1].getTime());
        asset.booleanValue.should.equal(true);
        asset.booleanValues.should.deep.equal([ false, true ]);
        asset.enumValue.should.equal('WOW');
        asset.enumValues.should.deep.equal([ 'SUCH', 'MANY', 'MUCH' ]);
    };

    let validateResolvedAssetContainer = (assetContainer, assetId) => {
        assetContainer.assetId.should.equal(assetId);
        validateResolvedAsset(assetContainer.simpleAsset, 'dogeAsset1');
        assetContainer.simpleAssets.length.should.equal(2);
        validateResolvedAsset(assetContainer.simpleAssets[0], 'dogeAsset2');
        validateResolvedAsset(assetContainer.simpleAssets[1], 'dogeAsset3');
    };

    it('should get all the asset registries', function () {
        return client
            .getAllAssetRegistries()
            .then(function (assetRegistries) {
                assetRegistries.length.should.equal(4);
                assetRegistries.should.containSubset([
                    {'id': 'systest.assets.SimpleAsset', 'name': 'Asset registry for systest.assets.SimpleAsset'},
                    {'id': 'systest.assets.SimpleAssetContainer', 'name': 'Asset registry for systest.assets.SimpleAssetContainer'},
                    {'id': 'systest.assets.SimpleAssetRelationshipContainer', 'name': 'Asset registry for systest.assets.SimpleAssetRelationshipContainer'},
                    {'id': 'systest.assets.SimpleAssetCircle', 'name': 'Asset registry for systest.assets.SimpleAssetCircle'}
                ]);
            });
    });

    it('should get an asset registry', function () {
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (assetRegistry) {
                assetRegistry.should.containSubset({'id': 'systest.assets.SimpleAsset', 'name': 'Asset registry for systest.assets.SimpleAsset'});
            });
    });

    it('should throw when getting a non-existent asset registry', function () {
        return client
            .getAssetRegistry('e92074d3-935b-4c75-98e5-5dc2505aa971')
            .then(function (assetRegistry) {
                throw new Error('should not get here');
            }).catch(function (error) {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should throw when getting a non-existent asset in an asset registry', function () {
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (assetRegistry) {
                return assetRegistry.get('doesnotexist');
            })
            .should.be.rejectedWith(/does not exist/);
    });

    it('should return false for an asset that does not exist', function () {
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (assetRegistry) {
                return assetRegistry.exists('doesnotexist');
            })
            .should.eventually.equal(false);
    });

    it('should add an asset registry', function () {
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function () {
                return client.getAllAssetRegistries();
            })
            .then(function (assetRegistries) {
                assetRegistries.should.have.length.of.at.least(4);
                assetRegistries.should.containSubset([{'id': 'myregistry', 'name': 'my new asset registry'}]);
                return client.getAssetRegistry('myregistry');
            })
            .then(function (assetRegistry) {
                assetRegistry.should.containSubset({'id': 'myregistry', 'name': 'my new asset registry'});
            });
    });

    it('should add an asset to an asset registry', function () {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function () {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(1);
                validateAsset(assets[0], 'dogeAsset1');
                return assetRegistry.get('dogeAsset1');
            })
            .then(function (asset) {
                asset.getIdentifier().should.equal('dogeAsset1');
            });
    });

    it('should bulk add assets to an asset registry', function () {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset1 = createAsset('dogeAsset1');
                let asset2 = createAsset('dogeAsset2');
                return assetRegistry.addAll([asset1, asset2]);
            })
            .then(function () {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(2);
                assets.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateAsset(assets[0], 'dogeAsset1');
                validateAsset(assets[1], 'dogeAsset2');
            });
    });

    it('should update an asset in an asset registry', () => {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function (asset) {
                return assetRegistry.get('dogeAsset1');
            })
            .then(function (asset) {
                validateAsset(asset, 'dogeAsset1');
                asset.stringValue = 'ciao mondo';
                asset.stringValues = [ 'ciao', 'mondo' ];
                return assetRegistry.update(asset);
            })
            .then(function () {
                return assetRegistry.get('dogeAsset1');
            })
            .then(function (asset) {
                asset.stringValue.should.equal('ciao mondo');
                asset.stringValues.should.deep.equal([ 'ciao', 'mondo' ]);
            });
    });

    it('should bulk update assets in an asset registry', function () {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset1 = createAsset('dogeAsset1');
                let asset2 = createAsset('dogeAsset2');
                return assetRegistry.addAll([asset1, asset2]);
            })
            .then(function () {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(2);
                assets.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateAsset(assets[0], 'dogeAsset1');
                assets[0].stringValue = 'ciao mondo';
                assets[0].stringValues = [ 'ciao', 'mondo' ];
                validateAsset(assets[1], 'dogeAsset2');
                assets[1].stringValue = 'hei maailma';
                assets[1].stringValues = [ 'hei', 'maailma' ];
                return assetRegistry.updateAll(assets);
            })
            .then(function () {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(2);
                assets.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                assets[0].stringValue.should.equal('ciao mondo');
                assets[0].stringValues.should.deep.equal([ 'ciao', 'mondo' ]);
                assets[1].stringValue.should.equal('hei maailma');
                assets[1].stringValues.should.deep.equal([ 'hei', 'maailma' ]);
            });
    });

    it('should remove an asset from an asset registry', () => {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function (asset) {
                return assetRegistry.get('dogeAsset1');
            })
            .then(function (asset) {
                validateAsset(asset, 'dogeAsset1');
                return assetRegistry.remove('dogeAsset1');
            })
            .then(function (asset) {
                return assetRegistry.get('dogeAsset1');
            })
            .then(function () {
                throw new Error('should not get here');
            })
            .catch(function (error) {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should bulk remove assets from an asset registry', () => {
        let assetRegistry;
        return client
            .addAssetRegistry('myregistry', 'my new asset registry')
            .then(function (result) {
                assetRegistry = result;
                let asset1 = createAsset('dogeAsset1');
                let asset2 = createAsset('dogeAsset2');
                return assetRegistry.addAll([asset1, asset2]);
            })
            .then(function (asset) {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(2);
                assets.sort((a, b) => {
                    return a.getIdentifier().localeCompare(b.getIdentifier());
                });
                validateAsset(assets[0], 'dogeAsset1');
                validateAsset(assets[1], 'dogeAsset2');
                return assetRegistry.removeAll(['dogeAsset1', assets[1]]);
            })
            .then(function (asset) {
                return assetRegistry.getAll();
            })
            .then(function (assets) {
                assets.length.should.equal(0);
            });
    });

    it('should store assets containing assets in an asset registry', () => {
        let assetRegistry;
        let assetContainerRegistry;
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset2');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset3');
                return assetRegistry.add(asset);
            })
            .then(function () {
                return client.getAssetRegistry('systest.assets.SimpleAssetContainer');
            })
            .then(function (result) {
                assetContainerRegistry = result;
                let assetContainer = createAssetContainer();
                assetContainer.simpleAsset = createAsset('dogeAsset1');
                assetContainer.simpleAssets = [
                    createAsset('dogeAsset2'),
                    createAsset('dogeAsset3')
                ];
                return assetContainerRegistry.add(assetContainer);
            })
            .then(function () {
                return assetContainerRegistry.getAll();
            })
            .then(function (assetContainers) {
                assetContainers.length.should.equal(1);
                validateAssetContainer(assetContainers[0], 'dogeAssetContainer');
                return assetContainerRegistry.get('dogeAssetContainer');
            })
            .then(function (assetContainer) {
                validateAssetContainer(assetContainer, 'dogeAssetContainer');
            });
    });

    it('should store assets containing asset relationships in an asset registry', () => {
        let assetRegistry;
        let assetContainerRegistry;
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset2');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset3');
                return assetRegistry.add(asset);
            })
            .then(function () {
                return client.getAssetRegistry('systest.assets.SimpleAssetRelationshipContainer');
            })
            .then(function (result) {
                assetContainerRegistry = result;
                let assetContainer = createAssetRelationshipContainer();
                let factory = client.getBusinessNetwork().getFactory();
                assetContainer.simpleAsset = factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset1');
                assetContainer.simpleAssets = [
                    factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset2'),
                    factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset3')
                ];
                return assetContainerRegistry.add(assetContainer);
            })
            .then(function () {
                return assetContainerRegistry.getAll();
            })
            .then(function (assetContainers) {
                assetContainers.length.should.equal(1);
                validateAssetRelationshipContainer(assetContainers[0], 'dogeAssetRelationshipContainer');
                return assetContainerRegistry.get('dogeAssetRelationshipContainer');
            })
            .then(function (assetContainer) {
                validateAssetRelationshipContainer(assetContainer, 'dogeAssetRelationshipContainer');
            });
    });

    it('should resolve assets containing asset relationships from an asset registry', () => {
        let assetRegistry;
        let assetContainerRegistry;
        return client
            .getAssetRegistry('systest.assets.SimpleAsset')
            .then(function (result) {
                assetRegistry = result;
                let asset = createAsset('dogeAsset1');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset2');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = createAsset('dogeAsset3');
                return assetRegistry.add(asset);
            })
            .then(function () {
                return client.getAssetRegistry('systest.assets.SimpleAssetRelationshipContainer');
            })
            .then(function (result) {
                assetContainerRegistry = result;
                let assetContainer = createAssetRelationshipContainer();
                let factory = client.getBusinessNetwork().getFactory();
                assetContainer.simpleAsset = factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset1');
                assetContainer.simpleAssets = [
                    factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset2'),
                    factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset3')
                ];
                return assetContainerRegistry.add(assetContainer);
            })
            .then(function () {
                return assetContainerRegistry.resolveAll();
            })
            .then(function (assetContainers) {
                assetContainers.length.should.equal(1);
                validateResolvedAssetContainer(assetContainers[0], 'dogeAssetRelationshipContainer');
                return assetContainerRegistry.resolve('dogeAssetRelationshipContainer');
            })
            .then(function (assetContainer) {
                validateResolvedAssetContainer(assetContainer, 'dogeAssetRelationshipContainer');
            });
    });

    it('should resolve assets containing circular relationships from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let assetRegistry;
        return client
            .getAssetRegistry('systest.assets.SimpleAssetCircle')
            .then(function (result) {
                assetRegistry = result;
                let asset = factory.newResource('systest.assets', 'SimpleAssetCircle', 'circle1');
                asset.next = factory.newRelationship('systest.assets', 'SimpleAssetCircle', 'circle2');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = factory.newResource('systest.assets', 'SimpleAssetCircle', 'circle2');
                asset.next = factory.newRelationship('systest.assets', 'SimpleAssetCircle', 'circle3');
                return assetRegistry.add(asset);
            })
            .then(function () {
                let asset = factory.newResource('systest.assets', 'SimpleAssetCircle', 'circle3');
                asset.next = factory.newRelationship('systest.assets', 'SimpleAssetCircle', 'circle1');
                return assetRegistry.add(asset);
            })
            .then(function () {
                return assetRegistry.resolveAll();
            })
            .then(function (assets) {
                assets.sort((a, b) => {
                    return a.assetId.localeCompare(b.assetId);
                });
                assets.length.should.equal(3);
                assets[0].next.next.assetId.should.equal('circle3');
                assets[1].next.next.assetId.should.equal('circle1');
                assets[2].next.next.assetId.should.equal('circle2');
                return assetRegistry.resolve('circle1');
            })
            .then(function (asset) {
                asset.next.next.assetId.should.equal('circle3');
            });
    });

});
