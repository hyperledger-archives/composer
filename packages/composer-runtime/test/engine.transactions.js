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
const EventService = require('../lib/eventservice');
const LoggingService = require('../lib/loggingservice');
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const TransactionExecutor = require('../lib/transactionexecutor');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineTransactions', () => {

    let mockContainer;
    let mockLoggingService;
    let mockEventService;
    let mockContext;
    let engine;
    let mockRegistryManager;
    let mockSerializer;
    let mockResolver;
    let mockApi;
    let mockScriptManager;
    let mockTransactionExecutor;
    let mockRegistry;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        engine = new Engine(mockContainer);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockContext.getSerializer.returns(mockSerializer);
        mockResolver = sinon.createStubInstance(Resolver);
        mockContext.getResolver.returns(mockResolver);
        mockApi = sinon.createStubInstance(Api);
        mockContext.getApi.returns(mockApi);
        mockScriptManager = sinon.createStubInstance(ScriptManager);
        mockContext.getScriptManager.returns(mockScriptManager);
        mockTransactionExecutor = sinon.createStubInstance(TransactionExecutor);
        mockTransactionExecutor.getType.returns('JS');
        mockTransactionExecutor.execute.resolves();
        mockContext.getTransactionExecutors.returns([mockTransactionExecutor]);
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Transaction', 'default').resolves(mockRegistry);
        mockEventService = sinon.createStubInstance(EventService);
        mockContext.getEventService.returns(mockEventService);
    });

    describe('#submitTransaction', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'submitTransaction', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "submitTransaction", expecting "\["registryId","serializedResource"\]"/);
        });

        it('should execute the transaction using one transaction executor', () => {
            const fakeJSON = { fake: 'data' };
            let mockTransaction1 = sinon.createStubInstance(Resource);
            let mockTransaction2 = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs(fakeJSON).onFirstCall().returns(mockTransaction1);
            mockSerializer.fromJSON.withArgs(fakeJSON).onSecondCall().returns(mockTransaction2);
            mockResolver.resolve.withArgs(sinon.match((transaction) => {
                if (transaction) {
                    // Mark the transaction as resolved so we can test it later.
                    transaction.$resolved = true;
                }
                return true;
            })).resolves();
            return engine.invoke(mockContext, 'submitTransaction', ['Transaction:default', JSON.stringify(fakeJSON)])
                .then(() => {
                    sinon.assert.calledOnce(mockTransactionExecutor.execute);
                    sinon.assert.calledWith(mockTransactionExecutor.execute, mockApi, mockScriptManager, sinon.match((transaction) => {
                        // First transaction should be unresolved.
                        transaction.should.be.an.instanceOf(Resource);
                        should.equal(transaction.$resolved, undefined);
                        return true;
                    }), sinon.match((resolvedTransaction) => {
                        // First transaction should be resolved.
                        resolvedTransaction.should.be.an.instanceOf(Resource);
                        resolvedTransaction.$resolved.should.be.true;
                        return true;
                    }));
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, sinon.match((transaction) => {
                        // We should persist the unresolved transaction.
                        transaction.should.be.an.instanceOf(Resource);
                        should.equal(transaction.$resolved, undefined);
                        return true;
                    }));
                    sinon.assert.calledOnce(mockEventService.commit);
                });
        });

        it('should execute the transaction using multiple transaction executors', () => {
            let mockTransactionExecutor1 = sinon.createStubInstance(TransactionExecutor);
            mockTransactionExecutor1.getType.returns('JS');
            mockTransactionExecutor1.execute.resolves();
            let mockTransactionExecutor2 = sinon.createStubInstance(TransactionExecutor);
            mockTransactionExecutor2.getType.returns('dogelang');
            mockTransactionExecutor2.execute.resolves();
            mockContext.getTransactionExecutors.returns([mockTransactionExecutor1, mockTransactionExecutor2]);
            const fakeJSON = { fake: 'data' };
            let mockTransaction1 = sinon.createStubInstance(Resource);
            let mockTransaction2 = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs(fakeJSON).onFirstCall().returns(mockTransaction1);
            mockSerializer.fromJSON.withArgs(fakeJSON).onSecondCall().returns(mockTransaction2);
            mockResolver.resolve.withArgs(sinon.match((transaction) => {
                if (transaction) {
                    // Mark the transaction as resolved so we can test it later.
                    transaction.$resolved = true;
                }
                return true;
            })).resolves();
            return engine.invoke(mockContext, 'submitTransaction', ['Transaction:default', JSON.stringify(fakeJSON)])
                .then(() => {
                    [mockTransactionExecutor1, mockTransactionExecutor2].forEach((mockTransactionExecutor) => {
                        sinon.assert.calledOnce(mockTransactionExecutor.execute);
                        sinon.assert.calledWith(mockTransactionExecutor.execute, mockApi, mockScriptManager, sinon.match((transaction) => {
                            // First transaction should be unresolved.
                            transaction.should.be.an.instanceOf(Resource);
                            should.equal(transaction.$resolved, undefined);
                            return true;
                        }), sinon.match((resolvedTransaction) => {
                            // First transaction should be resolved.
                            resolvedTransaction.should.be.an.instanceOf(Resource);
                            resolvedTransaction.$resolved.should.be.true;
                            return true;
                        }));
                    });
                    sinon.assert.calledOnce(mockRegistry.add);
                    sinon.assert.calledWith(mockRegistry.add, sinon.match((transaction) => {
                        // We should persist the unresolved transaction.
                        transaction.should.be.an.instanceOf(Resource);
                        should.equal(transaction.$resolved, undefined);
                        return true;
                    }));
                    sinon.assert.calledOnce(mockEventService.commit);
                });
        });

    });

});
