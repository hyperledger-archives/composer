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
const Factory = require('composer-common').Factory;
const JSTransactionExecutor = require('../lib/jstransactionexecutor');
const ModelManager = require('composer-common').ModelManager;
const RegistryManager = require('../lib/registrymanager');
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('JSTransactionExecutor', () => {

    let executor;
    let modelManager;
    let factory;
    let transaction;
    let resolvedTransaction;
    let participant;
    let scriptManager;
    let mockRegistryManager;
    let mockSerializer;
    let api;

    beforeEach(() => {
        executor = new JSTransactionExecutor();
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        participant TestParticipant identified by participantId {
            o String participantId
        }
        transaction TestTransaction identified by transactionId {
            o String transactionId
        }
        transaction TestTransaction2 identified by transactionId {
            o String transactionId
        }`);
        factory = new Factory(modelManager);
        transaction = factory.newResource('org.acme', 'TestTransaction', '1');
        resolvedTransaction = factory.newResource('org.acme', 'TestTransaction', '1_RESOLVED');
        participant = factory.newResource('org.acme', 'TestParticipant', '1');
        scriptManager = new ScriptManager(modelManager);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockSerializer = sinon.createStubInstance(Serializer);
        api = new Api(factory, mockSerializer, participant, mockRegistryManager);
    });

    afterEach(() => {
        delete global.$testResult;
    });

    describe('#getType', () => {

        it('should return the correct type', () => {
            executor.getType().should.equal('JS');
        });

    });

    describe('#execute', () => {

        it('should throw if no functions could be found', () => {
            sinon.stub(executor, 'findFunctionNames').returns([]);
            (() => {
                executor.execute(api, scriptManager, transaction, resolvedTransaction);
            }).should.throw(/Could not find any functions/);
        });

        it('should execute a single transaction processor function', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt']);
            let stub = sinon.stub();
            sinon.stub(executor, 'compileScripts').returns([stub]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .then(() => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, resolvedTransaction);
                });
        });

        it('should execute a single transaction processor function and bind the API methods', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt']);
            let stub = sinon.spy(new Function(`
                getCurrentParticipant().getFullyQualifiedIdentifier().should.equal('org.acme.TestParticipant#1');
            `));
            sinon.stub(executor, 'compileScripts').returns([stub]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .then(() => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, resolvedTransaction);
                });
        });

        it('should execute multiple transaction processor functions', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt', 'doIt2']);
            let stub1 = sinon.stub();
            let stub2 = sinon.stub();
            sinon.stub(executor, 'compileScripts').returns([stub1, stub2]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .then(() => {
                    sinon.assert.calledOnce(stub1);
                    sinon.assert.calledWith(stub1, resolvedTransaction);
                    sinon.assert.calledOnce(stub2);
                    sinon.assert.calledWith(stub2, resolvedTransaction);
                });
        });

        it('should execute multiple transaction processor functions and bind the API methods', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt', 'doIt2']);
            let stub1 = sinon.spy(new Function(`
                getCurrentParticipant().getFullyQualifiedIdentifier().should.equal('org.acme.TestParticipant#1');
            `));
            let stub2 = sinon.spy(new Function(`
                getCurrentParticipant().getFullyQualifiedIdentifier().should.equal('org.acme.TestParticipant#1');
            `));
            sinon.stub(executor, 'compileScripts').returns([stub1, stub2]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .then(() => {
                    sinon.assert.calledOnce(stub1);
                    sinon.assert.calledWith(stub1, resolvedTransaction);
                    sinon.assert.calledOnce(stub2);
                    sinon.assert.calledWith(stub2, resolvedTransaction);
                });
        });

        it('should execute a single transaction processor function and handle a promise', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt']);
            let stub = sinon.spy(new Function(`
                return Promise.reject('test error');
            `));
            sinon.stub(executor, 'compileScripts').returns([stub]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .should.be.rejectedWith(/test error/);
        });

        it('should execute multiple transaction processor functions and handle promises', () => {
            sinon.stub(executor, 'findFunctionNames').returns(['doIt']);
            let stub1 = sinon.spy(new Function(`
                return Promise.resolve();
            `));
            let stub2 = sinon.spy(new Function(`
                return Promise.reject('test error');
            `));
            sinon.stub(executor, 'compileScripts').returns([stub1, stub2]);
            return executor.execute(api, scriptManager, transaction, resolvedTransaction)
                .should.be.rejectedWith(/test error/)
                .then(() => {
                    sinon.assert.calledOnce(stub1);
                    sinon.assert.calledWith(stub1, resolvedTransaction);
                });
        });

    });

    describe('#findFunctionNames', () => {

        it('should find a transaction processor function annotated with @transaction', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal(['doIt']);
        });

        it('should find two transaction processor functions annotated with @transaction in a single script', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
            }

            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt2(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal(['doIt', 'doIt2']);
        });

        it('should find two transaction processor functions annotated with @transaction in multiple scripts', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
            }`));
            scriptManager.addScript(scriptManager.createScript('script2', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt2(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal(['doIt', 'doIt2']);
        });

        it('should ignore transaction processor functions annotated with @transaction with the wrong type', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction2} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
            }

            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt2(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal(['doIt2']);
        });

        it('should find a transaction processor function named on<transactionType>', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function onTestTransaction(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal(['onTestTransaction']);
        });

        it('should ignore transaction processor functions named on<transactionType> with the wrong type', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function onTestTransaction2(transaction) {
            }
            `));
            executor.findFunctionNames(scriptManager, transaction).should.deep.equal([]);
        });

    });

    describe('#compileScripts', () => {

        it('should compile a function for a single script and single function', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function doIt(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier();
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt']);
            functions.should.have.lengthOf(1);
            functions[0](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1');
        });

        it('should compile multiple functions for a single script and multiple functions', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function doIt(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + '_FIRST';
            }
            function doIt2(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + '_SECOND';
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt', 'doIt2']);
            functions.should.have.lengthOf(2);
            functions[0](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_FIRST');
            functions[1](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_SECOND');
        });

        it('should compile multiple functions for multiple script and multiple functions', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function doIt(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + '_FIRST';
            }`));
            scriptManager.addScript(scriptManager.createScript('script2', 'JS', `
            function doIt2(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + '_SECOND';
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt', 'doIt2']);
            functions.should.have.lengthOf(2);
            functions[0](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_FIRST');
            functions[1](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_SECOND');
        });

        it('should bring the contents of a single script in scope for a single function', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function utilFunc(transaction) {
                global.$testResult = transaction.getFullyQualifiedIdentifier();
            }
            function doIt(transaction) {
                utilFunc(transaction);
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt']);
            functions.should.have.lengthOf(1);
            functions[0](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1');
        });

        it('should bring the contents of a single script in scope for multiple functions', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function utilFunc(transaction, arg) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + arg;
            }
            function doIt(transaction) {
                utilFunc(transaction, '_FIRST');
            }
            function doIt2(transaction) {
                utilFunc(transaction, '_SECOND');
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt', 'doIt2']);
            functions.should.have.lengthOf(2);
            functions[0](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_FIRST');
            functions[1](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_SECOND');
        });

        it('should bring the contents of multiple scripts in scope for multiple functions', () => {
            scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            function utilFunc(transaction, arg) {
                global.$testResult = transaction.getFullyQualifiedIdentifier() + arg;
            }
            function doIt(transaction) {
                utilFunc2(transaction, '_FIRST');
            }`));
            scriptManager.addScript(scriptManager.createScript('script2', 'JS', `
            function utilFunc2(transaction, arg) {
                global.$testResult = arg + transaction.getFullyQualifiedIdentifier();
            }
            function doIt2(transaction) {
                utilFunc(transaction, '_SECOND');
            }`));
            let functions = executor.compileScripts(scriptManager, ['doIt', 'doIt2']);
            functions.should.have.lengthOf(2);
            functions[0](transaction);
            global.$testResult.should.equal('_FIRSTorg.acme.TestTransaction#1');
            functions[1](transaction);
            global.$testResult.should.equal('org.acme.TestTransaction#1_SECOND');
        });

    });

});
