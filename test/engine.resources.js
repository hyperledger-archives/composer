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

const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineResources', () => {

    let mockContainer;
    let mockContext;
    let mockRegistry;
    let mockRegistryManager;
    let mockSerializer;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'doges').resolves(mockRegistry);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockContext.getSerializer.returns(mockSerializer);
        engine = new Engine(mockContainer);
    });

    describe('#getAllResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getAllResourcesInRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getAllResourcesInRegistry", expecting "\["registryType","registryId"\]"/);
        });

        it('should return all of the resources', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockRegistry.getAll.withArgs().resolves([mockResource1, mockResource2]);
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource2).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            return engine.invoke(mockContext, 'getAllResourcesInRegistry', ['Asset', 'doges'])
                .then((resources) => {
                    resources.should.deep.equal([{
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    }, {
                        $class: 'org.doge.Doge',
                        assetId: 'doge2'
                    }]);
                });
        });

    });

    describe('#getResourceInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getResourceInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "getResourceInRegistry", expecting "\["registryType","registryId","resourceId"\]"/);
        });

        it('should return the specified resources', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.get.withArgs('doge1').resolves(mockResource);
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return engine.invoke(mockContext, 'getResourceInRegistry', ['Asset', 'doges', 'doge1'])
                .then((resource) => {
                    resource.should.deep.equal({
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                });
        });

    });

    describe('#addAllResourcesToRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addAllResourcesToRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addAllResourcesToRegistry", expecting "\["registryType","registryId","resources"\]"/);
        });

        it('should add the specified resources', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockRegistry.addAll.withArgs([mockResource1, mockResource2]).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource1);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }).returns(mockResource2);
            return engine.invoke(mockContext, 'addAllResourcesToRegistry', ['Asset', 'doges', JSON.stringify([{
                id: 'doge1',
                data: JSON.stringify({
                    $class: 'org.doge.Doge',
                    assetId: 'doge1'
                })
            }, {
                id: 'doge2',
                data: JSON.stringify({
                    $class: 'org.doge.Doge',
                    assetId: 'doge2'
                })
            }])])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.addAll);
                });
        });

    });

    describe('#addResourceToRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addResourceToRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "addResourceToRegistry", expecting "\["registryType","registryId","resourceId","resourceData"\]"/);
        });

        it('should add the specified resource', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.add.withArgs(mockResource).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            return engine.invoke(mockContext, 'addResourceToRegistry', ['Asset', 'doges', 'doge1', JSON.stringify({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            })])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.add);
                });
        });

    });

    describe('#updateAllResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'updateAllResourcesInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "updateAllResourcesInRegistry", expecting "\["registryType","registryId","resources"\]"/);
        });

        it('should update the specified resources', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockRegistry.updateAll.withArgs([mockResource1, mockResource2]).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource1);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }).returns(mockResource2);
            return engine.invoke(mockContext, 'updateAllResourcesInRegistry', ['Asset', 'doges', JSON.stringify([{
                id: 'doge1',
                data: JSON.stringify({
                    $class: 'org.doge.Doge',
                    assetId: 'doge1'
                })
            }, {
                id: 'doge2',
                data: JSON.stringify({
                    $class: 'org.doge.Doge',
                    assetId: 'doge2'
                })
            }])])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.updateAll);
                });
        });

    });

    describe('#updateResourceInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'updateResourceInRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "updateResourceInRegistry", expecting "\["registryType","registryId","resourceId","resourceData"\]"/);
        });

        it('should update the specified resource', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.update.withArgs(mockResource).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            return engine.invoke(mockContext, 'updateResourceInRegistry', ['Asset', 'doges', 'doge1', JSON.stringify({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            })])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.update);
                });
        });

    });

    describe('#removeAllResourcesFromRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'removeAllResourcesFromRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "removeAllResourcesFromRegistry", expecting "\["registryType","registryId","resourceIds"\]"/);
        });

        it('should remove the specified resources', () => {
            mockRegistry.removeAll.withArgs(['doge1', 'doge2']).resolves();
            return engine.invoke(mockContext, 'removeAllResourcesFromRegistry', ['Asset', 'doges', JSON.stringify(['doge1', 'doge2'])])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.removeAll);
                });
        });

    });

    describe('#removeResourceFromRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'removeResourceFromRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "removeResourceFromRegistry", expecting "\["registryType","registryId","resourceId"\]"/);
        });

        it('should remove the specified resource', () => {
            mockRegistry.remove.withArgs('doge1').resolves();
            return engine.invoke(mockContext, 'removeResourceFromRegistry', ['Asset', 'doges', 'doge1'])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.remove);
                });
        });

    });

});
