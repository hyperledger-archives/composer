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

const AssetRegistry = require('../lib/assetregistry');
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const Util = require('composer-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('AssetRegistry', () => {

    let sandbox;
    let mockSecurityContext;
    let modelManager;
    let factory;
    let serializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        modelManager = sinon.createStubInstance(ModelManager);
        factory = sinon.createStubInstance(Factory);
        serializer = sinon.createStubInstance(Serializer);
        sandbox.stub(Util, 'securityCheck');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllAssetRegistries', () => {

        it('should throw when modelManager not specified', () => {
            (() => {
                AssetRegistry.getAllAssetRegistries(mockSecurityContext, null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                AssetRegistry.getAllAssetRegistries(mockSecurityContext, modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                AssetRegistry.getAllAssetRegistries(mockSecurityContext, modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the list of asset registries', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries').resolves([
                {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
            ]);

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAllAssetRegistries(mockSecurityContext, modelManager, factory, serializer)
                .then((assetRegistries) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getAllRegistries);
                    sinon.assert.calledWith(Registry.getAllRegistries, mockSecurityContext, 'Asset');

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

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries').rejects(new Error('such error'));

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAllAssetRegistries(mockSecurityContext, modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#getAssetRegistry', () => {

        it('should throw when id not specified', () => {
            (() => {
                AssetRegistry.getAssetRegistry(mockSecurityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                AssetRegistry.getAssetRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                AssetRegistry.getAssetRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                AssetRegistry.getAssetRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the asset registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').resolves({id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'});

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAssetRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then((assetRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, mockSecurityContext, 'Asset', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the asset registries were returned correctly.
                    assetRegistry.should.be.an.instanceOf(AssetRegistry);
                    assetRegistry.id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    assetRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry').rejects(new Error('such error'));

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .getAssetRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#assetRegistryExists', () => {

        it('should throw when id not specified', () => {
            (() => {
                AssetRegistry.assetRegistryExists(mockSecurityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                AssetRegistry.assetRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                AssetRegistry.assetRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                AssetRegistry.assetRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return whether an asset registry exists', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'existsRegistry').resolves(true);

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .assetRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then((exists) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.existsRegistry);
                    sinon.assert.calledWith(Registry.existsRegistry, mockSecurityContext, 'Asset', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the existence was returned as true.
                    exists.should.equal.true;
                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'existsRegistry').rejects(new Error('such error'));

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .assetRegistryExists(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#addAssetRegistry', () => {

        it('should throw when id not specified', () => {
            (() => {
                AssetRegistry.addAssetRegistry(mockSecurityContext, null, 'doge registry', modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', () => {
            (() => {
                AssetRegistry.addAssetRegistry(mockSecurityContext, 'suchid', null, modelManager, factory, serializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                AssetRegistry.addAssetRegistry(mockSecurityContext, 'suchid', 'doge registry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                AssetRegistry.addAssetRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                AssetRegistry.addAssetRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the asset registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry').resolves();

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .addAssetRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then((assetRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.addRegistry);
                    sinon.assert.calledWith(Registry.addRegistry, mockSecurityContext, 'Asset', 'suchid', 'doge registry');

                    // Check that the asset registry was returned successfully.
                    assetRegistry.should.be.an.instanceOf(AssetRegistry);
                    assetRegistry.id.should.equal('suchid');
                    assetRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry').rejects(new Error('such error'));

            // Invoke the getAllAssetRegistries function.
            return AssetRegistry
                .addAssetRegistry(mockSecurityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .should.be.rejectedWith(/such error/);

        });

    });

});
