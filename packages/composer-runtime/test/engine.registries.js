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

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('EngineRegistries', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockRegistryManager;
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
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
    });

    describe('#getAllRegistries', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'getAllRegistries', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getAllRegistries", expecting "\["registryType","includeSystem"\]"/);
        });

        it('should return all of the registries', () => {
            let mockRegistry1 = sinon.createStubInstance(Registry);
            let mockRegistry2 = sinon.createStubInstance(Registry);
            mockRegistryManager.getAll.withArgs('Asset').resolves([mockRegistry1, mockRegistry2]);
            return engine.query(mockContext, 'getAllRegistries', ['Asset','false'])
                .then((registries) => {
                    registries.should.have.lengthOf(2);
                    registries.should.all.be.an.instanceOf(Registry);
                });
        });

    });

    describe('#getRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'getRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getRegistry", expecting "\["registryType","registryId"]"/);
        });

        it('should return all of the registries', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'doges').resolves(mockRegistry);
            return engine.query(mockContext, 'getRegistry', ['Asset', 'doges'])
                .then((registry) => {
                    registry.should.be.an.instanceOf(Registry);
                });
        });

    });

    describe('#existsRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'existsRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "existsRegistry", expecting "\["registryType","registryId"]"/);
        });

        it('should determine existence of registry', () => {
            mockRegistryManager.exists.withArgs('Asset', 'doges').resolves(true);
            return engine.query(mockContext, 'existsRegistry', ['Asset', 'doges'])
                .then((exists) => {
                    exists.should.be.true;
                });
        });

    });

    describe('#addRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'addRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addRegistry", expecting "\["registryType","registryId","registryName"]"/);
        });

        it('should add the registry', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.add.withArgs('Asset', 'doges', 'The doges registry').resolves(mockRegistry);
            return engine.query(mockContext, 'addRegistry', ['Asset', 'doges', 'The doges registry'])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistryManager.add);
                });
        });

    });

});
