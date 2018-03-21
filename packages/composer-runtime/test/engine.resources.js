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

});
