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
const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const EventService = require('../lib/eventservice');
const { ModelManager, ReturnsDecoratorFactory, ReadOnlyDecoratorFactory, ScriptManager } = require('composer-common');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');
const ScriptCompiler = require('../lib/scriptcompiler');
const TransactionHandler = require('../lib/transactionhandler');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('EngineTransactions', () => {

    let modelManager;
    let factory;
    let serializer;
    let eventService;
    let scriptManager;
    let scriptCompiler;
    let compiledScriptBundle;

    let mockContainer;
    let mockLoggingService;
    let mockResolver;
    let mockApi;
    let mockRegistryManager;
    let mockContext;
    let engine;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addDecoratorFactory(new ReturnsDecoratorFactory());
        modelManager.addDecoratorFactory(new ReadOnlyDecoratorFactory());
        modelManager.addModelFile(`
        namespace org.acme
        asset MyAsset identified by assetId {
            o String assetId
            o String value
        }
        concept MyConcept {
            o String value
            --> MyAsset asset optional
        }
        participant MyParticipant identified by participantId {
            o String participantId
        }
        transaction MyTransactionNoFunctions {
            o String value
        }
        transaction MyTransaction {
            o String value
        }
        transaction MyTransactionMultipleFunctions {
            o String value
        }
        @returns(String)
        transaction MyTransactionMultipleFunctionsThatReturnsString {
            o String value
        }
        event MyEvent {

        }
        @returns(MyAsset)
        @readonly
        transaction MyTransactionThatReturnsAsset {
            o String value
        }
        @returns(MyAsset[])
        @readonly
        transaction MyTransactionThatReturnsAssetArray {
            o String value
        }
        @returns(MyConcept)
        transaction MyTransactionThatReturnsConcept {
            o String value
        }
        @returns(MyConcept[])
        transaction MyTransactionThatReturnsConceptArray {
            o String value
        }
        @returns(DateTime)
        transaction MyTransactionThatReturnsDateTime {
            o String value
        }
        @returns(Integer)
        transaction MyTransactionThatReturnsInteger {
            o String value
        }
        @returns(Long)
        transaction MyTransactionThatReturnsLong {
            o String value
        }
        @returns(Double)
        transaction MyTransactionThatReturnsDouble {
            o String value
        }
        @returns(Boolean)
        transaction MyTransactionThatReturnsBoolean {
            o String value
        }
        @returns(String)
        transaction MyTransactionThatReturnsString {
            o String value
        }
        @returns(String[])
        transaction MyTransactionThatReturnsStringArray {
            o String value
        }
        @returns(Double[])
        transaction MyTransactionThatReturnsDoubleArray {
            o String value
        }
        enum MyEnum {
            o WOW
            o SUCH
            o MANY
            o MUCH
        }
        @returns(MyEnum)
        transaction MyTransactionThatReturnsEnum {
            o String value
        }
        @returns(MyEnum[])
        transaction MyTransactionThatReturnsEnumArray {
            o String value
        }
        `);
        factory = modelManager.getFactory();
        serializer = modelManager.getSerializer();
        eventService = new EventService();
        scriptManager = new ScriptManager(modelManager);
        scriptCompiler = new ScriptCompiler();
        scriptManager.addScript(scriptManager.createScript('test.js', 'JS', `
        'use strict';
        /**
         * @param {org.acme.MyTransaction} t the transaction
         * @transaction
         */
        async function handleMyTransaction(t) {

        }
        /**
         * @param {org.acme.MyTransactionMultipleFunctions} t the transaction
         * @transaction
         */
        async function handleMyTransactionMultipleFunctions1(t) {

        }
        /**
         * @param {org.acme.MyTransactionMultipleFunctions} t the transaction
         * @transaction
         */
        async function handleMyTransactionMultipleFunctions2(t) {

        }
        /**
         * @param {org.acme.MyTransactionThatReturnsString} t the transaction
         * @transaction
         */
        async function handleMyTransactionThatReturnsString(t) {
            return 'hello world';
        }
        /**
         * @param {org.acme.MyTransactionMultipleFunctionsThatReturnsString} t the transaction
         * @transaction
         */
        async function handleMyTransactionMultipleFunctionsThatReturnsString1(t) {
            return 'hello world';
        }
        /**
         * @param {org.acme.MyTransactionMultipleFunctionsThatReturnsString} t the transaction
         * @transaction
         */
        async function handleMyTransactionMultipleFunctionsThatReturnsString2(t) {

        }
        `));
        compiledScriptBundle = scriptCompiler.compile(scriptManager);

        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockResolver = sinon.createStubInstance(Resolver);
        mockApi = sinon.createStubInstance(Api);
        Api.getMethodNames().forEach(methodName => mockApi[methodName] = sinon.stub());
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext = sinon.createStubInstance(Context);
        mockContext.getFactory.returns(factory);
        mockContext.getSerializer.returns(serializer);
        mockContext.getEventService.returns(eventService);
        mockContext.getResolver.returns(mockResolver);
        mockContext.getTransactionHandlers.returns([]);
        mockContext.getCompiledScriptBundle.returns(compiledScriptBundle);
        mockContext.getApi.returns(mockApi);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
    });

    describe('#submitTransaction', () => {

        let mockTransactionRegistry;
        let mockHistorian;

        beforeEach(() => {
            mockTransactionRegistry = sinon.createStubInstance(Registry);
            mockHistorian = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.hyperledger.composer.system.HistorianRecord').resolves(mockHistorian);
        });

        it('should throw if the arguments are not correct', async () => {
            await engine.invoke(mockContext, 'submitTransaction', ['no', 'args', 'supported', 'here'])
                .should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "submitTransaction", expecting "\["serializedResource"\]"/);
        });

        it('should execute a transaction that does not return a value and write to historian if flag undefined', async () => {
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransaction').resolves(mockTransactionRegistry);
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransaction');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransaction',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]);
            should.equal(result, undefined);
            sinon.assert.calledOnce(mockTransactionRegistry.testAdd);
            sinon.assert.calledWith(mockTransactionRegistry.testAdd, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'));
            sinon.assert.calledOnce(mockHistorian.testAdd);
            sinon.assert.calledWith(mockHistorian.testAdd, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'));
            sinon.assert.calledOnce(mockTransactionRegistry.add);
            sinon.assert.calledWith(mockTransactionRegistry.add, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'), { noTest: true });
            sinon.assert.calledOnce(mockHistorian.add);
            sinon.assert.calledWith(mockHistorian.add, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'), { noTest: true, validate: false });
        });

        it('should execute a transaction that does not return a value and write to historian if explicitly requested', async () => {
            mockContext.historianEnabled = true;
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransaction').resolves(mockTransactionRegistry);
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransaction');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransaction',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]);
            should.equal(result, undefined);
            sinon.assert.calledOnce(mockTransactionRegistry.testAdd);
            sinon.assert.calledWith(mockTransactionRegistry.testAdd, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'));
            sinon.assert.calledOnce(mockHistorian.testAdd);
            sinon.assert.calledWith(mockHistorian.testAdd, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'));
            sinon.assert.calledOnce(mockTransactionRegistry.add);
            sinon.assert.calledWith(mockTransactionRegistry.add, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'), { noTest: true });
            sinon.assert.calledOnce(mockHistorian.add);
            sinon.assert.calledWith(mockHistorian.add, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'), { noTest: true, validate: false });
        });

        it('should not write to historian if disabled', async () => {
            mockContext.historianEnabled = false;
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransaction').resolves(mockTransactionRegistry);
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransaction');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransaction',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]);
            should.equal(result, undefined);
            sinon.assert.calledOnce(mockTransactionRegistry.testAdd);
            sinon.assert.calledWith(mockTransactionRegistry.testAdd, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'));
            sinon.assert.notCalled(mockHistorian.testAdd);
            sinon.assert.calledOnce(mockTransactionRegistry.add);
            sinon.assert.calledWith(mockTransactionRegistry.add, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransaction#TX_1'), { noTest: true });
            sinon.assert.notCalled(mockHistorian.add);
        });

        it('should execute a transaction that returns a value', async () => {
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransactionThatReturnsString').resolves(mockTransactionRegistry);
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransactionThatReturnsString',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]);
            should.equal(result, 'hello world');
            sinon.assert.calledOnce(mockTransactionRegistry.testAdd);
            sinon.assert.calledWith(mockTransactionRegistry.testAdd, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransactionThatReturnsString#TX_1'));
            sinon.assert.calledOnce(mockHistorian.testAdd);
            sinon.assert.calledWith(mockHistorian.testAdd, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'));
            sinon.assert.calledOnce(mockTransactionRegistry.add);
            sinon.assert.calledWith(mockTransactionRegistry.add, sinon.match(transaction => transaction.getFullyQualifiedIdentifier() === 'org.acme.MyTransactionThatReturnsString#TX_1'), { noTest: true });
            sinon.assert.calledOnce(mockHistorian.add);
            sinon.assert.calledWith(mockHistorian.add, sinon.match(historianRecord => historianRecord.getFullyQualifiedIdentifier() === 'org.hyperledger.composer.system.HistorianRecord#TX_1'), { noTest: true, validate: false });
        });

        it('should throw if the transaction cannot be added to the transaction registry', async () => {
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransaction').resolves(mockTransactionRegistry);
            mockTransactionRegistry.testAdd.returns(new Error('such error'));
            await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransaction',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]).should.be.rejectedWith(/such error/);
        });

        it('should throw if the historian record cannot be added to the historian', async () => {
            mockRegistryManager.get.withArgs('Transaction', 'org.acme.MyTransaction').resolves(mockTransactionRegistry);
            mockHistorian.testAdd.returns(new Error('such error'));
            await engine.invoke(mockContext, 'submitTransaction', [JSON.stringify({
                $class: 'org.acme.MyTransaction',
                transactionId: 'TX_1',
                timestamp: new Date(0).toISOString(),
                value: 'hello world'
            })]).should.be.rejectedWith(/such error/);
        });

        it('should correctly identify a readonly decorator', () => {
            let transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            let result = transaction.getClassDeclaration().getDecorator('readonly');
            should.not.exist(result);

            transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsAsset');
            result = transaction.getClassDeclaration().getDecorator('readonly');
            should.exist(result);
            result.name.should.equal('readonly');
        });

    });

    describe('#_executeTransaction', () => {

        it('should call a single transaction handler', async () => {
            const mockTransactionHandler = sinon.createStubInstance(TransactionHandler);
            mockContext.getTransactionHandlers.returns([mockTransactionHandler]);
            mockTransactionHandler.execute.resolves(1);
            const transaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            mockResolver.resolve.resolves(resolvedTransaction);
            await engine._executeTransaction(mockContext, transaction);
            sinon.assert.calledOnce(mockTransactionHandler.execute);
            sinon.assert.calledWith(mockTransactionHandler.execute, mockApi, resolvedTransaction);
        });

        it('should call multiple transaction handlers', async () => {
            const mockTransactionHandler1 = sinon.createStubInstance(TransactionHandler);
            const mockTransactionHandler2 = sinon.createStubInstance(TransactionHandler);
            mockContext.getTransactionHandlers.returns([mockTransactionHandler1, mockTransactionHandler2]);
            mockTransactionHandler1.execute.resolves(1);
            mockTransactionHandler2.execute.resolves(0);
            const transaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            mockResolver.resolve.resolves(resolvedTransaction);
            await engine._executeTransaction(mockContext, transaction);
            sinon.assert.calledOnce(mockTransactionHandler1.execute);
            sinon.assert.calledWith(mockTransactionHandler1.execute, mockApi, resolvedTransaction);
            sinon.assert.calledOnce(mockTransactionHandler2.execute);
            sinon.assert.calledWith(mockTransactionHandler2.execute, mockApi, resolvedTransaction);
        });

        it('should throw if no functions exist for the specified transaction', async () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionNoFunctions');
            mockResolver.resolve.resolves(resolvedTransaction);
            await engine._executeTransaction(mockContext, transaction)
                .should.be.rejectedWith(/Could not find any functions to execute/);
        });

        it('should execute a transaction with a single handler', async () => {
            const spy = sinon.spy(compiledScriptBundle, 'execute');
            const transaction = factory.newTransaction('org.acme', 'MyTransaction');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransaction');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine._executeTransaction(mockContext, transaction);
            should.equal(result, undefined);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, mockApi, resolvedTransaction);
        });

        it('should execute a transaction with multiple handlers', async () => {
            const spy = sinon.spy(compiledScriptBundle, 'execute');
            const transaction = factory.newTransaction('org.acme', 'MyTransactionMultipleFunctions');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionMultipleFunctions');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine._executeTransaction(mockContext, transaction);
            should.equal(result, undefined);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, mockApi, resolvedTransaction);
        });

        it('should execute a transaction that returns a value with a single handler', async () => {
            const spy = sinon.spy(compiledScriptBundle, 'execute');
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine._executeTransaction(mockContext, transaction);
            should.equal(result, 'hello world');
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, mockApi, resolvedTransaction);
        });

        it('should execute a transaction that returns a value with multiple handlers', async () => {
            const spy = sinon.spy(compiledScriptBundle, 'execute');
            const transaction = factory.newTransaction('org.acme', 'MyTransactionMultipleFunctionsThatReturnsString');
            const resolvedTransaction = factory.newTransaction('org.acme', 'MyTransactionMultipleFunctionsThatReturnsString');
            mockResolver.resolve.resolves(resolvedTransaction);
            const result = await engine._executeTransaction(mockContext, transaction);
            should.equal(result, 'hello world');
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, mockApi, resolvedTransaction);
        });

    });

    describe('#_createHistorianRecord', () => {

        let participant;
        let identity;
        let transaction;

        beforeEach(() => {
            participant = factory.newResource('org.acme', 'MyParticipant', 'P_1');
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'I_1');
            transaction = factory.newTransaction('org.acme', 'MyTransaction', 'TX_1');
            transaction.timestamp = new Date(0);
        });

        it('should create a historian record without a participant or identity', () => {
            const record = engine._createHistorianRecord(mockContext, transaction);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction'
            });
        });

        it('should create a historian record with a participant, but without an identity', () => {
            mockContext.getParticipant.returns(participant);
            const record = engine._createHistorianRecord(mockContext, transaction);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                participantInvoking: 'resource:org.acme.MyParticipant#P_1'
            });
        });

        it('should create a historian record without a participant, but with an identity', () => {
            mockContext.getIdentity.returns(identity);
            const record = engine._createHistorianRecord(mockContext, transaction);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                identityUsed: 'resource:org.hyperledger.composer.system.Identity#I_1'
            });
        });

        it('should create a historian record with a participant and an identity', () => {
            mockContext.getParticipant.returns(participant);
            mockContext.getIdentity.returns(identity);
            const record = engine._createHistorianRecord(mockContext, transaction);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                participantInvoking: 'resource:org.acme.MyParticipant#P_1',
                identityUsed: 'resource:org.hyperledger.composer.system.Identity#I_1'
            });
        });

    });

    describe('#_updateHistorianRecord', () => {

        let record;

        beforeEach(() => {
            record = serializer.fromJSON({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction'
            });
        });

        it('should update a historian record with no emitted events', () => {
            engine._updateHistorianRecord(mockContext, record);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                eventsEmitted: []
            });
        });

        it('should update a historian record with a single emitted event', () => {
            const event1 = factory.newEvent('org.acme', 'MyEvent', 'EV_1');
            event1.timestamp = new Date(0);
            eventService.emit(serializer.toJSON(event1));
            engine._updateHistorianRecord(mockContext, record);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                eventsEmitted: [{
                    $class: 'org.acme.MyEvent',
                    eventId: 'EV_1',
                    timestamp: '1970-01-01T00:00:00.000Z'
                }]
            });
        });

        it('should update a historian record with multiple emitted events', () => {
            const event1 = factory.newEvent('org.acme', 'MyEvent', 'EV_1');
            event1.timestamp = new Date(0);
            eventService.emit(serializer.toJSON(event1));
            const event2 = factory.newEvent('org.acme', 'MyEvent', 'EV_2');
            event2.timestamp = new Date(0);
            eventService.emit(serializer.toJSON(event2));
            engine._updateHistorianRecord(mockContext, record);
            serializer.toJSON(record).should.deep.equal({
                $class: 'org.hyperledger.composer.system.HistorianRecord',
                transactionId: 'TX_1',
                transactionInvoked: 'resource:org.acme.MyTransaction#TX_1',
                transactionTimestamp: '1970-01-01T00:00:00.000Z',
                transactionType: 'org.acme.MyTransaction',
                eventsEmitted: [{
                    $class: 'org.acme.MyEvent',
                    eventId: 'EV_1',
                    timestamp: '1970-01-01T00:00:00.000Z'
                }, {
                    $class: 'org.acme.MyEvent',
                    eventId: 'EV_2',
                    timestamp: '1970-01-01T00:00:00.000Z'
                }]
            });
        });

    });

    describe('#_processReturnValues', () => {

        it('should handle no expected return value with no return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransaction');
            should.equal(engine._processReturnValues(mockContext, transaction, [undefined]), undefined);
        });

        it('should handle no expected return value and ignore a return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransaction');
            should.equal(engine._processReturnValues(mockContext, transaction, ['hello world']), undefined);
        });

        it('should handle a string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            engine._processReturnValues(mockContext, transaction, ['hello world']).should.equal('hello world');
        });

        it('should handle an enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            engine._processReturnValues(mockContext, transaction, ['WOW']).should.equal('WOW');
        });

        it('should handle a concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            engine._processReturnValues(mockContext, transaction, [concept]).should.deep.equal({
                $class: 'org.acme.MyConcept',
                value: 'hello world'
            });
        });

        it('should throw if a return value required but return value was not provided', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                engine._processReturnValues(mockContext, transaction, [undefined]);
            }).should.throw(/but nothing was returned by any functions/);
        });

        it('should throw if a return value required but multiple return values were provided', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                engine._processReturnValues(mockContext, transaction, ['hello', 'world']);
            }).should.throw(/but more than one function returned a value/);
        });

    });

    describe('#_processComplexReturnValue', () => {

        it('should handle a concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            engine._processComplexReturnValue(mockContext, transaction, concept).should.deep.equal({
                $class: 'org.acme.MyConcept',
                value: 'hello world'
            });
        });

        it('should handle a concept return value with a relationship to an asset that is a relationship', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            concept.asset = factory.newRelationship('org.acme', 'MyAsset', '1234');
            engine._processComplexReturnValue(mockContext, transaction, concept).should.deep.equal({
                $class: 'org.acme.MyConcept',
                value: 'hello world',
                asset: 'resource:org.acme.MyAsset#1234'
            });
        });

        it('should handle a concept return value with a relationship to an asset that is a resource', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            concept.asset = factory.newResource('org.acme', 'MyAsset', '1234');
            concept.asset.value = 'hello dogez';
            engine._processComplexReturnValue(mockContext, transaction, concept).should.deep.equal({
                $class: 'org.acme.MyConcept',
                value: 'hello world',
                asset: 'resource:org.acme.MyAsset#1234'
            });
        });

        it('should handle a concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            const concept1 = factory.newConcept('org.acme', 'MyConcept');
            concept1.value = 'hello world';
            const concept2 = factory.newConcept('org.acme', 'MyConcept');
            concept2.value = 'purple mushroom';
            engine._processComplexReturnValue(mockContext, transaction, [concept1, concept2]).should.deep.equal([{
                $class: 'org.acme.MyConcept',
                value: 'hello world'
            }, {
                $class: 'org.acme.MyConcept',
                value: 'purple mushroom'
            }]);
        });

        it('should handle a concept return value that is not readonly but contains a $original component', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newConcept('org.acme', 'MyConcept');
            concept.value = 'hello world';
            concept.$original = 'not to be seen';
            engine._processComplexReturnValue(mockContext, transaction, concept).should.deep.equal({
                $class: 'org.acme.MyConcept',
                value: 'hello world'
            });
        });

        it('should handle a readonly Asset return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsAsset');
            const asset = factory.newResource('org.acme', 'MyAsset','001');
            asset.value = 'hello world';
            asset.$original = 'penguin';
            engine._processComplexReturnValue(mockContext, transaction, asset).should.equal('penguin');
        });

        it('should handle a readonly Asset[] return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsAssetArray');
            const asset1 = factory.newResource('org.acme', 'MyAsset','001');
            asset1.value = 'hello world';
            asset1.$original = 'penguin';
            const asset2 = factory.newResource('org.acme', 'MyAsset','002');
            asset2.value = 'hello again world';
            asset2.$original = 'power';
            engine._processComplexReturnValue(mockContext, transaction, [asset1, asset2]).should.deep.equal(['penguin', 'power']);
        });

        it('should throw for an invalid (wrong type) concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            (() => {
                engine._processComplexReturnValue(mockContext, transaction, 'hello world');
            }).should.throw(/but a non-typed value was returned/);
        });

        it('should throw for an invalid (wrong element type) concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            (() => {
                engine._processComplexReturnValue(mockContext, transaction, ['hello world']);
            }).should.throw(/but a non-typed value was returned/);
        });

        it('should throw for an invalid (wrong array type) concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            (() => {
                engine._processComplexReturnValue(mockContext, transaction, undefined);
            }).should.throw(/but a value of type undefined was returned/);
        });

        it('should throw for a non-matching concept return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConcept');
            const concept = factory.newTransaction('org.acme', 'MyTransaction');
            (() => {
                engine._processComplexReturnValue(mockContext, transaction, concept);
            }).should.throw(/but a value of type MyTransaction was returned/);
        });

        it('should throw for a non-matching concept array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsConceptArray');
            const concept1 = factory.newConcept('org.acme', 'MyConcept');
            concept1.value = 'hello world';
            const concept2 = factory.newTransaction('org.acme', 'MyTransaction');
            (() => {
                engine._processComplexReturnValue(mockContext, transaction, [concept1, concept2]);
            }).should.throw(/but a value of type MyTransaction was returned/);
        });

    });

    describe('#_processEnumReturnValue', () => {

        it('should handle an enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            engine._processEnumReturnValue(mockContext, transaction, 'WOW').should.equal('WOW');
        });

        it('should throw for an invalid enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            (() => {
                engine._processEnumReturnValue(mockContext, transaction, undefined);
            }).should.throw(/return value of type MyEnum was expected/);
        });

        it('should throw for an undefined enum return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnum');
            (() => {
                engine._processEnumReturnValue(mockContext, transaction, 'CATZ RULE');
            }).should.throw(/return value of type MyEnum was expected/);
        });

        it('should handle an enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            engine._processEnumReturnValue(mockContext, transaction, ['SUCH', 'MANY']).should.deep.equal(['SUCH', 'MANY']);
        });

        it('should throw for an invalid enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            (() => {
                engine._processEnumReturnValue(mockContext, transaction, undefined);
            }).should.throw(/return value of type MyEnum\[\] was expected/);
        });

        it('should throw for an undefined enum array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsEnumArray');
            (() => {
                engine._processEnumReturnValue(mockContext, transaction, ['CATZ', 'RULE']);
            }).should.throw(/return value of type MyEnum\[\] was expected/);
        });

    });

    describe('#_processPrimitiveReturnValue', () => {

        it('should handle a date/time return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDateTime');
            engine._processPrimitiveReturnValue(mockContext, transaction, new Date(0)).should.equal('1970-01-01T00:00:00.000Z');
        });

        it('should throw for an invalid date/time return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDateTime');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, 'not a string');
            }).should.throw(/return value of type DateTime was expected/);
        });

        it('should handle an integer return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsInteger');
            engine._processPrimitiveReturnValue(mockContext, transaction, 16384).should.equal(16384);
        });

        it('should throw for an invalid integer return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsInteger');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, 'not a string');
            }).should.throw(/return value of type Integer was expected/);
        });

        it('should handle a long return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsLong');
            engine._processPrimitiveReturnValue(mockContext, transaction, 10000000000).should.equal(10000000000);
        });

        it('should throw for an invalid long return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsLong');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, 'not a string');
            }).should.throw(/return value of type Long was expected/);
        });

        it('should handle a double return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDouble');
            engine._processPrimitiveReturnValue(mockContext, transaction, 3.142).should.equal(3.142);
        });

        it('should throw for an invalid double return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDouble');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, 'not a string');
            }).should.throw(/return value of type Double was expected/);
        });

        it('should handle a boolean return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsBoolean');
            engine._processPrimitiveReturnValue(mockContext, transaction, true).should.equal(true);
        });

        it('should throw for an invalid boolean return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsBoolean');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, 'not a string');
            }).should.throw(/return value of type Boolean was expected/);
        });

        it('should handle a string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            engine._processPrimitiveReturnValue(mockContext, transaction, 'hello world').should.equal('hello world');
        });

        it('should throw for an invalid string return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsString');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, undefined);
            }).should.throw(/return value of type String was expected/);
        });

        it('should handle a string array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsStringArray');
            engine._processPrimitiveReturnValue(mockContext, transaction, ['hello', 'world']).should.deep.equal(['hello', 'world']);
        });

        it('should throw for an invalid string array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsStringArray');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, undefined);
            }).should.throw(/return value of type String\[\] was expected/);
        });

        it('should handle a double array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDoubleArray');
            engine._processPrimitiveReturnValue(mockContext, transaction, [3.142, 1.234]).should.deep.equal([3.142, 1.234]);
        });

        it('should throw for an invalid double array return value', () => {
            const transaction = factory.newTransaction('org.acme', 'MyTransactionThatReturnsDoubleArray');
            (() => {
                engine._processPrimitiveReturnValue(mockContext, transaction, [3.142, 'hello']);
            }).should.throw(/return value of type Double\[\] was expected/);
        });

    });

});
