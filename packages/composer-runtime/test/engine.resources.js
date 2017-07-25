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

const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const QueryExecutor = require('../lib/queryexecutor');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('EngineResources', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockQueryExecutor;
    let mockRegistry;
    let mockRegistryManager;
    let mockResolver;
    let mockSerializer;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'doges').resolves(mockRegistry);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockContext.getSerializer.returns(mockSerializer);
        mockResolver = sinon.createStubInstance(Resolver);
        mockContext.getResolver.returns(mockResolver);
        mockQueryExecutor = sinon.createStubInstance(QueryExecutor);
        mockContext.getQueryExecutor.returns(mockQueryExecutor);
        engine = new Engine(mockContainer);
    });

    describe('#getAllResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'getAllResourcesInRegistry', ['no', 'args', 'supported']);
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
            return engine.query(mockContext, 'getAllResourcesInRegistry', ['Asset', 'doges'])
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
            let result = engine.query(mockContext, 'getResourceInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "getResourceInRegistry", expecting "\["registryType","registryId","resourceId"\]"/);
        });

        it('should return the specified resources', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.get.withArgs('doge1').resolves(mockResource);
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return engine.query(mockContext, 'getResourceInRegistry', ['Asset', 'doges', 'doge1'])
                .then((resource) => {
                    resource.should.deep.equal({
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                });
        });

    });

    describe('#existsResourceInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'existsResourceInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "existsResourceInRegistry", expecting "\["registryType","registryId","resourceId"\]"/);
        });

        it('should return the specified resources', () => {
            mockRegistry.exists.withArgs('doge1').resolves(true);
            return engine.query(mockContext, 'existsResourceInRegistry', ['Asset', 'doges', 'doge1'])
                .then((exists) => {
                    exists.should.equal.true;
                });
        });

    });


    describe('#addAllResourcesToRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addAllResourcesToRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addAllResourcesToRegistry", expecting "\["registryType","registryId","serializedResources"\]"/);
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
            return engine.invoke(mockContext, 'addAllResourcesToRegistry', ['Asset', 'doges', JSON.stringify([
                {
                    $class: 'org.doge.Doge',
                    assetId: 'doge1'
                },
                {
                    $class: 'org.doge.Doge',
                    assetId: 'doge2'
                }
            ])])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.addAll);
                });
        });

    });

    describe('#addResourceToRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addResourceToRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addResourceToRegistry", expecting "\["registryType","registryId","serializedResource"\]"/);
        });

        it('should add the specified resource', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.add.withArgs(mockResource).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            return engine.invoke(mockContext, 'addResourceToRegistry', ['Asset', 'doges', JSON.stringify({
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
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "updateAllResourcesInRegistry", expecting "\["registryType","registryId","serializedResources"\]"/);
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
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }, {
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }])])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistry.updateAll);
                });
        });

    });

    describe('#updateResourceInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'updateResourceInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "updateResourceInRegistry", expecting "\["registryType","registryId","serializedResource"\]"/);
        });

        it('should update the specified resource', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.update.withArgs(mockResource).resolves();
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            return engine.invoke(mockContext, 'updateResourceInRegistry', ['Asset', 'doges', JSON.stringify({
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

    describe('#resolveAllResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'resolveAllResourcesInRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "resolveAllResourcesInRegistry", expecting "\["registryType","registryId"\]"/);
        });

        it('should resolve and return all of the resources', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockRegistry.getAll.withArgs().resolves([mockResource1, mockResource2]);
            mockResolver.resolve.withArgs(mockResource1).resolves(mockResource1);
            mockResolver.resolve.withArgs(mockResource2).resolves(mockResource2);
            mockSerializer.toJSON.withArgs(mockResource1, { permitResourcesForRelationships: true }).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource2, { permitResourcesForRelationships: true }).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            return engine.query(mockContext, 'resolveAllResourcesInRegistry', ['Asset', 'doges'])
                .then((resources) => {
                    sinon.assert.calledTwice(mockResolver.resolve);
                    sinon.assert.calledWith(mockResolver.resolve, mockResource1);
                    sinon.assert.calledWith(mockResolver.resolve, mockResource2);
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

    describe('#resolveResourceInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'resolveResourceInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "resolveResourceInRegistry", expecting "\["registryType","registryId","resourceId"\]"/);
        });

        it('should resolve and return the specified resources', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockRegistry.get.withArgs('doge1').resolves(mockResource);
            mockResolver.resolve.withArgs(mockResource).resolves(mockResource);
            mockSerializer.toJSON.withArgs(mockResource, { permitResourcesForRelationships: true }).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return engine.query(mockContext, 'resolveResourceInRegistry', ['Asset', 'doges', 'doge1'])
                .then((resource) => {
                    sinon.assert.calledOnce(mockResolver.resolve);
                    sinon.assert.calledWith(mockResolver.resolve, mockResource);
                    resource.should.deep.equal({
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                });
        });

    });

    describe('#findResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'findResourcesInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "findResourcesInRegistry", expecting "\["registryType","registryId","expression"\]"/);
        });

        it('should return all of the resources for which the query returns a truthy value', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            let mockResource3 = sinon.createStubInstance(Resource);
            let resources = [mockResource1, mockResource2, mockResource3];
            mockRegistry.getAll.withArgs().resolves([mockResource1, mockResource2, mockResource3]);
            mockQueryExecutor.queryAll.withArgs('some query string', resources).resolves([true, false, true]);
            mockSerializer.toJSON.withArgs(mockResource1, { convertResourcesToRelationships: true }).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource3, { convertResourcesToRelationships: true }).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge3'
            });
            return engine.query(mockContext, 'findResourcesInRegistry', ['Asset', 'doges', 'some query string'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockQueryExecutor.queryAll);
                    resources.should.deep.equal([{
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    }, {
                        $class: 'org.doge.Doge',
                        assetId: 'doge3'
                    }]);
                });
        });

    });

    describe('#queryResourcesInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'queryResourcesInRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "queryResourcesInRegistry", expecting "\["registryType","registryId","expression"\]"/);
        });

        it('should return all of the results for which the query returns a truthy value', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            let mockResource3 = sinon.createStubInstance(Resource);
            let resources = [mockResource1, mockResource2, mockResource3];
            mockRegistry.getAll.withArgs().resolves([mockResource1, mockResource2, mockResource3]);
            mockQueryExecutor.queryAll.withArgs('some query string', resources).resolves([{ assetId: 'DOGE_1'}, false, [1, 2, 3]]);
            return engine.query(mockContext, 'queryResourcesInRegistry', ['Asset', 'doges', 'some query string'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockQueryExecutor.queryAll);
                    resources.should.deep.equal([{ assetId: 'DOGE_1'}, [1, 2, 3]]);
                });
        });

    });

});
