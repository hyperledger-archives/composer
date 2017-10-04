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

const Api = require('../lib/api');
const CompiledScriptBundle = require('../lib/compiledscriptbundle');
const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const ResourceManager = require('../lib/resourcemanager');
const IdentityManager = require('../lib/identitymanager');
const EventService = require('../lib/eventservice');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const Factory = require('composer-common').Factory;

const TransactionHandler = require('../lib/transactionhandler');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('EngineTransactions', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let engine;
    let mockRegistryManager;
    let mockResourceManager;
    let mockSerializer;
    let mockResolver;
    let mockApi;
    let mockScriptManager;
    let mockCompiledScriptBundle;
    let mockRegistry,mockHistorian;
    let mockTransactionHandler1;
    let mockTransactionHandler2;
    let mockFactory;
    let mockIdentityManager;
    let mockParticipant;
    let mockEventService;
    let mockIdentity;

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
        engine = new Engine(mockContainer);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockResourceManager = sinon.createStubInstance(ResourceManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockContext.getResourceManager.returns(mockResourceManager);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockContext.getSerializer.returns(mockSerializer);
        mockResolver = sinon.createStubInstance(Resolver);
        mockContext.getResolver.returns(mockResolver);
        mockApi = sinon.createStubInstance(Api);
        mockContext.getApi.returns(mockApi);
        mockScriptManager = sinon.createStubInstance(ScriptManager);
        mockContext.getScriptManager.returns(mockScriptManager);
        mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
        mockCompiledScriptBundle.execute.resolves(0);
        mockContext.getCompiledScriptBundle.returns(mockCompiledScriptBundle);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Transaction', sinon.match.any).resolves(mockRegistry);
        mockHistorian = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'org.hyperledger.composer.system.HistorianRecord').resolves(mockHistorian);
        mockTransactionHandler1 = sinon.createStubInstance(TransactionHandler);
        mockTransactionHandler1.execute.resolves(0);
        mockTransactionHandler2 = sinon.createStubInstance(TransactionHandler);
        mockTransactionHandler2.execute.resolves(0);
        mockContext.getTransactionHandlers.returns([mockTransactionHandler1, mockTransactionHandler2]);
        mockFactory = sinon.createStubInstance(Factory);
        mockContext.getFactory.returns(mockFactory);
        mockFactory.newResource.returns({});
        mockFactory.newRelationship.returns({});

        mockIdentityManager = sinon.createStubInstance(IdentityManager);
        mockContext.getIdentityManager.returns(mockIdentityManager);

        mockIdentity = sinon.createStubInstance(Resource);
        mockIdentity.getIdentifier.returns('1234');
        mockIdentityManager.getIdentity.resolves(mockIdentity);
        mockParticipant = sinon.createStubInstance(Resource);
        mockEventService = sinon.createStubInstance(EventService);

    });

    describe('#submitTransaction', () => {

        let fakeJSON;
        let mockResolvedTransaction;
        let mockTransaction;

        beforeEach(() => {
            fakeJSON = { fake: 'data', $class :'org.acme.tx' };
            mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.$resolved = false;
            mockResolvedTransaction = sinon.createStubInstance(Resource);
            mockTransaction.$resolved = true;
            mockSerializer.fromJSON.withArgs(fakeJSON).onFirstCall().returns(mockTransaction);
            mockResolver.resolve.withArgs(mockTransaction).resolves(mockResolvedTransaction);
        });

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'submitTransaction', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "submitTransaction", expecting "\["serializedResource"\]"/);
        });

        it('should throw if no handlers for the transaction', () => {
            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .should.be.rejectedWith(/Could not find any functions to execute for transaction/);
        });

        it('should execute the transaction using a system handler', () => {
            mockTransactionHandler1.execute.resolves(1);
            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                    sinon.assert.calledOnce(mockContext.setTransaction);
                    sinon.assert.calledWith(mockContext.setTransaction, mockTransaction);
                    sinon.assert.calledOnce(mockContext.clearTransaction);
                });
        });

        it('should execute the transaction using multiple system handlers', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockTransactionHandler2.execute.resolves(1);
            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockTransactionHandler2.execute);
                    mockTransactionHandler2.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler2.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

        it('should execute the transaction using a user handler', () => {
            mockCompiledScriptBundle.execute.resolves(1);
            return engine.invoke(mockContext, 'submitTransaction', [ JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledScriptBundle.execute);
                    mockCompiledScriptBundle.execute.args[0][0].should.equal(mockApi);
                    mockCompiledScriptBundle.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                    sinon.assert.calledOnce(mockContext.setTransaction);
                    sinon.assert.calledWith(mockContext.setTransaction, mockTransaction);
                    sinon.assert.calledOnce(mockContext.clearTransaction);
                });
        });

        it('should execute the transaction using multiple system handlers and a user handler', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockTransactionHandler2.execute.resolves(1);
            mockCompiledScriptBundle.execute.resolves(1);
            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockTransactionHandler2.execute);
                    mockTransactionHandler2.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler2.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockCompiledScriptBundle.execute);
                    mockCompiledScriptBundle.execute.args[0][0].should.equal(mockApi);
                    mockCompiledScriptBundle.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

        it('should execute the transaction using a system handler (historian record other paths)', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockParticipant.getIdentifier.returns('fred');


            mockContext.getParticipant.returns(mockParticipant);
            mockContext.getEventService.returns(mockEventService);
            mockEventService.getEvents.returns([]);


            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

        it('should execute the transaction using a system handler (historian no events)', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockParticipant.getIdentifier.returns('fred');


            mockContext.getParticipant.returns(mockParticipant);
            mockContext.getEventService.returns(mockEventService);
            mockEventService.getEvents.returns(null);


            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

        it('should execute the transaction using a system handler (historian record other paths #2)', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockParticipant.getIdentifier.returns('fred');


            mockContext.getParticipant.returns(mockParticipant);
            mockContext.getEventService.returns(mockEventService);
            mockEventService.getEvents.returns([ {data:'really'}  ]);
            mockSerializer.fromJSON.returns({data:'jsonified'});

            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

        it('should execute the transaction using a system handler (historian record other paths #2)', () => {
            mockTransactionHandler1.execute.resolves(1);
            mockParticipant.getIdentifier.returns('fred');

            mockContext.getIdentity.returns(mockIdentity);
            mockContext.getParticipant.returns(mockParticipant);
            mockContext.getEventService.returns(mockEventService);
            mockEventService.getEvents.returns([ {data:'really'}  ]);
            mockSerializer.fromJSON.returns({data:'jsonified'});

            return engine.invoke(mockContext, 'submitTransaction', [JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionHandler1.execute);
                    mockTransactionHandler1.execute.args[0][0].should.equal(mockApi);
                    mockTransactionHandler1.execute.args[0][1].should.equal(mockResolvedTransaction);
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, mockTransaction);
                });
        });

    });

});
