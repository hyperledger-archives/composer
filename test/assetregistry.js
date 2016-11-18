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

const AssetRegistry = require('../lib/assetregistry');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const Registry = require('../lib/registry');
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const Util = require('@ibm/ibm-concerto-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('AssetRegistry', function () {

    let securityContext;
    let sandbox;
    let modelManager;
    let factory;
    let serializer;

    before(function () {
        securityContext = new SecurityContext('suchuser', 'suchpassword');
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        modelManager = sinon.createStubInstance(ModelManager);
        factory = sinon.createStubInstance(Factory);
        serializer = sinon.createStubInstance(Serializer);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#getAllAssetRegistries', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.resolve([]);
            });
            return AssetRegistry
                .getAllAssetRegistries(securityContext, modelManager, factory, serializer)
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                AssetRegistry.getAllAssetRegistries(securityContext, null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                AssetRegistry.getAllAssetRegistries(securityContext, modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                AssetRegistry.getAllAssetRegistries(securityContext, modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the list of asset registries', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.resolve(
                    [
                        {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                        {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
                    ]
                );
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAllAssetRegistries(securityContext, modelManager, factory, serializer)
                .then(function (assetRegistries) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.getAllRegistries);
                    sinon.assert.calledWith(Registry.getAllRegistries, securityContext, 'Asset');

                    // Check that the asset registries were returned correctly.
                    assetRegistries.should.be.an('array');
                    assetRegistries.should.have.lengthOf(2);
                    assetRegistries.should.all.be.an.instanceOf(AssetRegistry);
                    assetRegistries[0].id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    assetRegistries[0].name.should.equal('doge registry');
                    assetRegistries[1].id.should.equal('6165d4c2-73ee-43a6-b5b5-bac512a4894e');
                    assetRegistries[1].name.should.equal('wow such registry');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAllAssetRegistries(securityContext, modelManager, factory, serializer)
                .then(function (assetRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#getAssetRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.reject(new Error('fake error'));
            });
            return AssetRegistry
                .getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .catch(function () {

                })
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when id not specified', function () {
            (function () {
                AssetRegistry.getAssetRegistry(securityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                AssetRegistry.getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                AssetRegistry.getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                AssetRegistry.getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the asset registry', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.resolve(
                    {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'}
                );
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then(function (assetRegistry) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, securityContext, 'Asset', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the asset registries were returned correctly.
                    assetRegistry.should.be.an.instanceOf(AssetRegistry);
                    assetRegistry.id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    assetRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAssetRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then(function (assetRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addAssetRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.resolve();
            });
            return AssetRegistry
                .addAssetRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when id not specified', function () {
            (function () {
                AssetRegistry.addAssetRegistry(securityContext, null, 'doge registry', modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', function () {
            (function () {
                AssetRegistry.addAssetRegistry(securityContext, 'suchid', null, modelManager, factory, serializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                AssetRegistry.addAssetRegistry(securityContext, 'suchid', 'doge registry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                AssetRegistry.addAssetRegistry(securityContext, 'suchid', 'doge registry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                AssetRegistry.addAssetRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the asset registry', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.resolve();
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .addAssetRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function (assetRegistry) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.addRegistry);
                    sinon.assert.calledWith(Registry.addRegistry, securityContext, 'Asset', 'suchid', 'doge registry');

                    // Check that the asset registry was returned successfully.
                    assetRegistry.should.be.an.instanceOf(AssetRegistry);
                    assetRegistry.id.should.equal('suchid');
                    assetRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .addAssetRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#constructor', function () {

        it('should throw when modelManager not specified', function () {
            (function () {
                new AssetRegistry('suchid', 'wowsuchregistry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                new AssetRegistry('suchid', 'wowsuchregistry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                new AssetRegistry('suchid', 'wowsuchregistry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should create a new asset registry', function () {
            let assetRegistry = new AssetRegistry('suchid', 'wowsuchregistry', modelManager, factory, serializer);
            assetRegistry.modelManager.should.equal(modelManager);
            assetRegistry.factory.should.equal(factory);
            assetRegistry.serializer.should.equal(serializer);
            assetRegistry.id.should.equal('suchid');
            assetRegistry.name.should.equal('wowsuchregistry');
        });

    });

    describe('#add', function () {

        it('should throw when asset not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.add(securityContext, null);
            }).should.throw(/asset not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .add(securityContext, asset)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry.add(securityContext, asset);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .add(securityContext, asset)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addAll', function () {

        it('should throw when assets not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.addAll(securityContext, null);
            }).should.throw(/assets not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .addAll(securityContext, [asset1, asset2])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry.addAll(securityContext, [asset1, asset2]);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .addAll(securityContext, [asset1, asset2])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#update', function () {

        it('should throw when asset not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.update(securityContext, null);
            }).should.throw(/asset not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .update(securityContext, asset)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry.update(securityContext, asset);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .update(securityContext, asset)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#updateAll', function () {

        it('should throw when assets not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.updateAll(securityContext, null);
            }).should.throw(/assets not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .updateAll(securityContext, [asset1, asset2])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry.updateAll(securityContext, [asset1, asset2]);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .updateAll(securityContext, [asset1, asset2])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#remove', function () {

        it('should throw when asset not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.remove(securityContext, null);
            }).should.throw(/asset not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .remove(securityContext, 'dogecar1')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code when given an ID', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry.remove(securityContext, 'dogecar1');

        });

        it('should invoke the chain-code when given an asset', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');
            return registry.remove(securityContext, asset);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset = sinon.createStubInstance(Resource);
            asset.getIdentifier.returns('dogecar1');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .remove(securityContext, asset)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#removeAll', function () {

        it('should throw when assets not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.removeAll(securityContext, null);
            }).should.throw(/assets not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .removeAll(securityContext, ['dogecar1', 'dogecar2'])
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code when given an ID', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry.removeAll(securityContext, ['dogecar1', 'dogecar2']);

        });

        it('should invoke the chain-code when given an asset', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            return registry.removeAll(securityContext, [asset1, asset2]);

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            const json = '{"fake":"json for the test"}';
            serializer.toJSON.returns(json);
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .removeAll(securityContext, [asset1, asset2])
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#getAll', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify([])));
            });
            return registry
                .getAll(securityContext)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            serializer.fromJSON.onFirstCall().returns(asset1);
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            serializer.fromJSON.onSecondCall().returns(asset2);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {
                                'id':'fake id',
                                'data' : '{}'
                            },
                            {
                                'id':'fake id 2',
                                'data' : '{}'
                            }
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function (assets) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getAllResourcesInRegistry', ['Asset', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.be.an.instanceOf(Resource);
                    assets[0].getIdentifier().should.equal('dogecar1');
                    assets[1].getIdentifier().should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#find', function () {

        it('should throw when expression not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.find(securityContext, null);
            }).should.throw(/expression not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify([])));
            });
            return registry
                .find(securityContext, 'assetId = \'fred\'')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            serializer.fromJSON.onFirstCall().returns(asset1);
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            serializer.fromJSON.onSecondCall().returns(asset2);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {
                                'id':'fake id',
                                'data' : '{}'
                            },
                            {
                                'id':'fake id 2',
                                'data' : '{}'
                            }
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .find(securityContext, 'assetId = \'fred\'')
                .then(function (assets) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'findAssetsInAssetRegistry', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'assetId = \'fred\'']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.be.an.instanceOf(Resource);
                    assets[0].getIdentifier().should.equal('dogecar1');
                    assets[1].getIdentifier().should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .find(securityContext, 'assetId = \'fred\'')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#query', function () {

        it('should throw when expression not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.query(securityContext, null);
            }).should.throw(/expression not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify([])));
            });
            return registry
                .query(securityContext, 'assetId = \'fred\'')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {
                                'id':'dogecar1',
                                'data' : '{"$class":"org.doge.Doge", "assetId":"dogecar1"}'
                            },
                            {
                                'id':'dogecar2',
                                'data' : '{"$class":"org.doge.Doge", "assetId":"dogecar2"}'
                            }
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .query(securityContext, 'assetId = \'fred\'')
                .then(function (assets) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'queryAssetsInAssetRegistry', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'assetId = \'fred\'']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.not.be.an.instanceOf(Resource);
                    assets[0].should.be.an('object');
                    assets[1].should.be.an('object');
                    assets[0].assetId.should.equal('dogecar1');
                    assets[1].assetId.should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .query(securityContext, 'assetId = \'fred\'')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#resolveAll', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify([])));
            });
            return registry
                .resolveAll(securityContext)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {
                                'id':'dogecar1',
                                'data' : '{"$class":"org.doge.Doge", "assetId":"dogecar1"}'
                            },
                            {
                                'id':'dogecar2',
                                'data' : '{"$class":"org.doge.Doge", "assetId":"dogecar2"}'
                            }
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .resolveAll(securityContext)
                .then(function (assets) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'resolveAllAssetsInAssetRegistry', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.not.be.an.instanceOf(Resource);
                    assets[0].should.be.an('object');
                    assets[1].should.be.an('object');
                    assets[0].assetId.should.equal('dogecar1');
                    assets[1].assetId.should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .resolveAll(securityContext)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#get', function () {

        it('should throw when id not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.get(securityContext, null);
            }).should.throw(/id not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify({'id':'fake id','data' : '{}'})));
            });
            return registry
                .get(securityContext, 'dogecar1')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            serializer.fromJSON.onFirstCall().returns(asset1);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        {'id':'fake id','data' : '{}'}
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function (asset) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getResourceInRegistry', ['Asset', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1']);

                    // Check that the assets were returned successfully.
                    asset.should.be.an.instanceOf(Resource);
                    asset.getIdentifier().should.equal('dogecar1');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#resolve', function () {

        it('should throw when id not specified', function () {
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (function () {
                registry.resolve(securityContext, null);
            }).should.throw(/id not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(Buffer.from(JSON.stringify({'id':'fake id','data' : '{}'})));
            });
            return registry
                .resolve(securityContext, 'dogecar1')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should query the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        {'id':'dogecar1','data' : '{"$class":"org.doge.Doge", "assetId":"dogecar1"}'}
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .resolve(securityContext, 'dogecar1')
                .then(function (asset) {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, securityContext, 'resolveAssetInAssetRegistry', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'dogecar1']);

                    // Check that the assets were returned successfully.
                    asset.should.not.be.an.instanceOf(Resource);
                    asset.should.be.an('object');
                    asset.assetId.should.equal('dogecar1');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the asset registry and other test data.
            let registry = new AssetRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .resolve(securityContext, 'dogecar1')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

});
