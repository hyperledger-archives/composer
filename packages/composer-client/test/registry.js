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

const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const Resource = require('composer-common').Resource;
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const BusinessNetworkConnection = require('../lib/businessnetworkconnection.js');
const Util = require('composer-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('Registry', () => {

    let sandbox;
    let mockSecurityContext;
    let mockModelManager;
    let mockFactory;
    let mockSerializer;
    let registry;
    let mockBNC;
    let mockTransaction;


    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockFactory = sinon.createStubInstance(Factory);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockBNC = sinon.createStubInstance(BusinessNetworkConnection);
        mockTransaction = sinon.createStubInstance(TransactionDeclaration);
        mockFactory.newTransaction.returns(mockTransaction);

        registry = new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, mockSerializer,mockBNC);
        sandbox.stub(Util, 'securityCheck');
        sandbox.stub(Util, 'invokeChainCode').resolves();
        sandbox.stub(Util, 'queryChainCode').resolves();
        mockBNC.submitTransaction.resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllRegistries', () => {

        it('should throw when registryType not specified', () => {
            (() => {
                Registry.getAllRegistries(mockSecurityContext, null);
            }).should.throw(/registryType not specified/);
        });

        it('should invoke the chain-code and return the list of asset registries', () => {

            // Set up the responses from the chain-code.
            const registries = [
                {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
            ];
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(registries)));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getAllRegistries(mockSecurityContext, 'Doge')
                .then((result) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getAllRegistries', ['Doge']);

                    // Check that the asset registries were returned correctly.
                    result.should.deep.equal(registries);

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('failed to invoke chain-code'));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getAllRegistries(mockSecurityContext, 'Doge')
                .should.be.rejectedWith(/failed to invoke chain-code/);

        });

    });

    describe('#getRegistry', () => {

        it('should throw when registryType not specified', () => {
            (() => {
                Registry.getRegistry(mockSecurityContext, null, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', () => {
            (() => {
                Registry.getRegistry(mockSecurityContext, 'Doge', null);
            }).should.throw(/id not specified/);
        });

        it('should invoke the chain-code and return the asset registry', () => {

            // Set up the responses from the chain-code.
            const registry = {
                id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'
            };
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(registry)));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .then((result) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the asset registries were returned correctly.
                    result.should.deep.equal(registry);

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('failed to invoke chain-code'));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .should.be.rejectedWith(/failed to invoke chain-code/);

        });

    });

    describe('#existsRegistry', () => {

        it('should throw when registryType not specified', () => {
            (() => {
                Registry.existsRegistry(mockSecurityContext, null, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', () => {
            (() => {
                Registry.existsRegistry(mockSecurityContext, 'Doge', null);
            }).should.throw(/id not specified/);
        });

        it('should invoke the chain-code and determine whether the asset registry exists', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(true)));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .existsRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .then((exists) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'existsRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d']);

                    // Check that the exists methods returns true value.
                    exists.should.equal.true;

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('failed to invoke chain-code'));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .getRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d')
                .should.be.rejectedWith(/failed to invoke chain-code/);

        });

    });

    describe('#addRegistry', () => {

        it('should throw when registryType not specified', () => {
            (() => {
                Registry.addRegistry(mockSecurityContext, null, 'such id', 'doge registry');
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', () => {
            (() => {
                Registry.addRegistry(mockSecurityContext, 'Doge', null, 'doge registry');
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', () => {
            (() => {
                Registry.addRegistry(mockSecurityContext, 'Doge', 'such id', null);
            }).should.throw(/name not specified/);
        });

        it('should invoke the chain-code and return the asset registry', () => {

            // Set up the responses from the chain-code.
            Util.invokeChainCode.resolves();

            // Invoke the getAllAssetRegistries function.
            return Registry
                .addRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry')
                .then((registry) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, mockSecurityContext, 'addRegistry', ['Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry']);

                    // Check that the asset registry was returned successfully.
                    registry.should.deep.equal({
                        id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d',
                        name: 'doge registry'
                    });

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.invokeChainCode.rejects(new Error('failed to invoke chain-code'));

            // Invoke the getAllAssetRegistries function.
            return Registry
                .addRegistry(mockSecurityContext, 'Doge', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'doge registry')
                .should.be.rejectedWith(/failed to invoke chain-code/);

        });

    });


    describe('#constructor', () => {

        it('should throw when registryType not specified', () => {
            (() => {
                new Registry(null, 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/registryType not specified/);
        });

        it('should throw when id not specified', () => {
            (() => {
                new Registry('Doge', null, 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', () => {
            (() => {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', null, mockSecurityContext, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when securityContext not specified', () => {
            (() => {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', null, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/securityContext not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (() => {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', mockSecurityContext, null, mockFactory, mockSerializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (() => {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', mockSecurityContext, mockModelManager, null, mockSerializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (() => {
                new Registry('Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, null);
            }).should.throw(/serializer not specified/);
        });

    });

    describe('#addAll', () => {

        it('should throw when resources not specified', () => {
            (() => {
                registry.addAll(null);
            }).should.throw(/resources not specified/);
        });

        it('should invoke the addAll transaction', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('DOGE_1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('DOGE_2');

            mockTransaction.resources = [mockResource1, mockResource2];
            return registry.addAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);
                });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.add(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#add', () => {

        it('should throw when resource not specified', () => {
            (() => {
                registry.add(null);
            }).should.throw(/resource not specified/);
        });

        it('should invoke the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');

            return registry.add(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);                });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.add(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#updateAll', () => {

        it('should throw when resources not specified', () => {
            (() => {
                registry.updateAll(null);
            }).should.throw(/resources not specified/);
        });

        it('should invoke the chaincode', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('DOGE_1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('DOGE_2');

            mockTransaction.resources = [mockResource1, mockResource2];
            return registry.updateAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);
                });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.update(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#update', () => {

        it('should throw when resource not specified', () => {
            (() => {
                registry.update(null);
            }).should.throw(/resource not specified/);
        });

        it('should invoke the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');

            mockTransaction.resources = [mockResource];

            return registry.update(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);               });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.update(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#removeAll', () => {

        it('should throw when resources not specified', () => {
            (() => {
                registry.removeAll(null);
            }).should.throw(/resources not specified/);
        });

        it('should invoke the chaincode with a resource', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('DOGE_1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('DOGE_2');
            return registry.removeAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);                });
        });

        it('should invoke the chaincode with an identifier', () => {
            return registry.removeAll(['DOGE_1', 'DOGE_2'])
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);                 });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.update(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#remove', () => {

        it('should throw when resource not specified', () => {
            (() => {
                registry.remove(null);
            }).should.throw(/resource not specified/);
        });

        it('should invoke the chaincode with a resource', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            return registry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);                  });
        });

        it('should invoke the chaincode with an identifier', () => {
            return registry.remove('DOGE_1')
                .then(() => {
                    sinon.assert.calledOnce(mockBNC.submitTransaction);
                    sinon.assert.calledWith(mockBNC.submitTransaction,mockTransaction);                  });
        });

        it('should handle an error from the chaincode', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockBNC.submitTransaction.rejects(new Error('such error'));
            return registry.update(mockResource)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#getAll', () => {

        it('should query the chain-code', () => {

            // Create the asset registry and other test data.
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            mockSerializer.fromJSON.onFirstCall().returns(asset1);
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            mockSerializer.fromJSON.onSecondCall().returns(asset2);

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(
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
            )));

            // Invoke the add function.
            return registry
                .getAll()
                .then((assets) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getAllResourcesInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.be.an.instanceOf(Resource);
                    assets[0].getIdentifier().should.equal('dogecar1');
                    assets[1].getIdentifier().should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .getAll()
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#get', () => {

        it('should throw when id not specified', () => {
            (function () {
                registry.get(null);
            }).should.throw(/id not specified/);
        });

        it('should query the chain-code', () => {

            // Create the asset registry and other test data.
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            mockSerializer.fromJSON.onFirstCall().returns(asset1);

            // Set up the responses from the chain-code.
            let data = { $class: 'org.acme.Doge', assetId: 'dogecar1' };
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(data)));

            // Invoke the add function.
            return registry
                .get('dogecar1')
                .then((asset) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'getResourceInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'dogecar1']);

                    // Check that the assets were returned successfully.
                    asset.should.be.an.instanceOf(Resource);
                    asset.getIdentifier().should.equal('dogecar1');
                    sinon.assert.calledWith(mockSerializer.fromJSON, data);

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .get('dogecar1')
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#exists', () => {

        it('should throw when id not specified', () => {
            (function () {
                registry.exists(null);
            }).should.throw(/id not specified/);
        });

        it('should query the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(true)));

            // Invoke the add function.
            return registry
                .exists('dogecar1')
                .then((exists) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'existsResourceInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'dogecar1']);

                    // Check that the assets were returned successfully.
                    exists.should.equal.true;

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .exists('dogecar1')
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#find', () => {

        it('should throw when expression not specified', () => {
            (() => {
                registry.find(null);
            }).should.throw(/expression not specified/);
        });

        it('should query the chain-code', () => {

            // Create the asset registry and other test data.
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('dogecar1');
            mockSerializer.fromJSON.onFirstCall().returns(asset1);
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('dogecar2');
            mockSerializer.fromJSON.onSecondCall().returns(asset2);

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(
                [
                    {
                        'id':'fake id',
                    },
                    {
                        'id':'fake id 2'
                    }
                ]
            )));

            // Invoke the add function.
            return registry
                .find('assetId = \'fred\'')
                .then((assets) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'findResourcesInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'assetId = \'fred\'']);

                    // Check that the assets were returned successfully.
                    assets.should.be.an('array');
                    assets.should.have.lengthOf(2);
                    assets.should.all.be.an.instanceOf(Resource);
                    assets[0].getIdentifier().should.equal('dogecar1');
                    assets[1].getIdentifier().should.equal('dogecar2');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .find('assetId = \'fred\'')
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#query', () => {

        it('should throw when expression not specified', () => {
            (() => {
                registry.query(null);
            }).should.throw(/expression not specified/);
        });

        it('should query the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(
                [
                    {'$class':'org.doge.Doge', 'assetId':'dogecar1'},
                    {'$class':'org.doge.Doge', 'assetId':'dogecar2'}
                ]
            )));

            // Invoke the add function.
            return registry
                .query('assetId = \'fred\'')
                .then((assets) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'queryResourcesInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'assetId = \'fred\'']);

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

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .query('assetId = \'fred\'')
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#resolveAll', () => {

        it('should query the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(
                [
                    {'$class':'org.doge.Doge', 'assetId':'dogecar1'},
                    {'$class':'org.doge.Doge', 'assetId':'dogecar2'}
                ]
            )));

            // Invoke the add function.
            return registry
                .resolveAll()
                .then((assets) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'resolveAllResourcesInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039']);

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

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .resolveAll()
                .should.be.rejectedWith(/such error/);

        });

    });

    describe('#resolve', () => {

        it('should throw when id not specified', () => {
            (() => {
                registry.resolve(null);
            }).should.throw(/id not specified/);
        });

        it('should query the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.resolves(Buffer.from(JSON.stringify(
                {'$class':'org.doge.Doge', 'assetId':'dogecar1'}
            )));

            // Invoke the add function.
            return registry
                .resolve('dogecar1')
                .then((asset) => {

                    // Check that the query was made successfully.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Util.queryChainCode);
                    sinon.assert.calledWith(Util.queryChainCode, mockSecurityContext, 'resolveResourceInRegistry', ['Doge', 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'dogecar1']);

                    // Check that the assets were returned successfully.
                    asset.should.not.be.an.instanceOf(Resource);
                    asset.should.be.an('object');
                    asset.assetId.should.equal('dogecar1');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            Util.queryChainCode.rejects(new Error('such error'));

            // Invoke the add function.
            return registry
                .resolve('dogecar1')
                .should.be.rejectedWith(/such error/);

        });

    });

});
