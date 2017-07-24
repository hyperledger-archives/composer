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
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const ScriptManager = require('composer-common').ScriptManager;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('CompiledScriptBundle', () => {

    let modelManager;
    let factory;
    let transactions;
    let scriptManager;
    let functionDeclarations;
    let mockApi;
    let mockGeneratorFunction;
    let bundle;
    let compiledScriptBundle;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        transaction TestTransaction {
        }
        transaction TestTransaction2 {
        }
        transaction TestTransaction3 {
        }
        transaction TestTransaction4 {
        }`);
        factory = new Factory(modelManager);
        transactions = [
            factory.newResource('org.acme', 'TestTransaction', '1'),
            factory.newResource('org.acme', 'TestTransaction2', '1'),
            factory.newResource('org.acme', 'TestTransaction3', '1'),
            factory.newResource('org.acme', 'TestTransaction4', '1')
        ];
        scriptManager = new ScriptManager(modelManager);
        scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
            }

            /**
             * @param {org.acme.TestTransaction3} transaction The transaction to call.
             * @transaction
             */
            function doIt3a(transaction) {
            }

            /**
             * @param {org.acme.TestTransaction3} transaction The transaction to call.
             * @transaction
             */
            function doIt3b(transaction) {
            }`));
        scriptManager.addScript(scriptManager.createScript('script2', 'JS', `
            function onTestTransaction2(transaction) {
            }`));
        functionDeclarations = [];
        scriptManager.getScripts().forEach((script) => {
            script.getFunctionDeclarations().forEach((functionDeclaration) => {
                functionDeclarations.push(functionDeclaration);
            });
        });
        mockApi = sinon.createStubInstance(Api);
        bundle = {
            doIt: sinon.stub(),
            doIt2: sinon.stub().resolves(),
            doIt3a: sinon.stub(),
            doIt3b: sinon.stub(),
            doIt4a: sinon.stub().resolves(),
            doIt4b: sinon.stub().resolves()
        };
        mockGeneratorFunction = sinon.stub().returns(bundle);
        compiledScriptBundle = new CompiledScriptBundle(functionDeclarations, mockGeneratorFunction);
    });

    describe('#execute', () => {

        it('should not throw if no functions could be found', () => {
            sinon.stub(compiledScriptBundle, 'findFunctionNames').returns([]);
            return compiledScriptBundle.execute(mockApi, transactions[0])
                .should.eventually.be.equal(0);
        });

        it('should call a single function', () => {
            sinon.stub(compiledScriptBundle, 'findFunctionNames').returns(['doIt']);
            return compiledScriptBundle.execute(mockApi, transactions[0])
                .should.eventually.be.equal(1)
                .then(() => {
                    sinon.assert.calledOnce(mockGeneratorFunction);
                    sinon.assert.calledWith(mockGeneratorFunction, mockApi);
                    sinon.assert.calledOnce(bundle.doIt);
                    sinon.assert.calledWith(bundle.doIt, transactions[0]);
                });
        });

        it('should call a single function returning a promise', () => {
            sinon.stub(compiledScriptBundle, 'findFunctionNames').returns(['doIt2']);
            return compiledScriptBundle.execute(mockApi, transactions[0])
                .should.eventually.be.equal(1)
                .then(() => {
                    sinon.assert.calledOnce(mockGeneratorFunction);
                    sinon.assert.calledWith(mockGeneratorFunction, mockApi);
                    sinon.assert.calledOnce(bundle.doIt2);
                    sinon.assert.calledWith(bundle.doIt2, transactions[0]);
                });
        });

        it('should call multiple functions', () => {
            sinon.stub(compiledScriptBundle, 'findFunctionNames').returns(['doIt3a', 'doIt3b']);
            return compiledScriptBundle.execute(mockApi, transactions[0])
                .should.eventually.be.equal(2)
                .then(() => {
                    sinon.assert.calledOnce(mockGeneratorFunction);
                    sinon.assert.calledWith(mockGeneratorFunction, mockApi);
                    sinon.assert.calledOnce(bundle.doIt3a);
                    sinon.assert.calledWith(bundle.doIt3a, transactions[0]);
                    sinon.assert.calledOnce(bundle.doIt3b);
                    sinon.assert.calledWith(bundle.doIt3b, transactions[0]);
                });
        });

        it('should call multiple functions returning a promise', () => {
            sinon.stub(compiledScriptBundle, 'findFunctionNames').returns(['doIt4a', 'doIt4b']);
            return compiledScriptBundle.execute(mockApi, transactions[0])
                .should.eventually.be.equal(2)
                .then(() => {
                    sinon.assert.calledOnce(mockGeneratorFunction);
                    sinon.assert.calledWith(mockGeneratorFunction, mockApi);
                    sinon.assert.calledOnce(bundle.doIt4a);
                    sinon.assert.calledWith(bundle.doIt4a, transactions[0]);
                    sinon.assert.calledOnce(bundle.doIt4b);
                    sinon.assert.calledWith(bundle.doIt4b, transactions[0]);
                });
        });

    });

    describe('#findFunctionNames', () => {

        it('should find a single annotated function', () => {
            compiledScriptBundle.findFunctionNames(transactions[0]).should.deep.equal(['doIt']);
        });

        it('should find a single legacy named function', () => {
            compiledScriptBundle.findFunctionNames(transactions[1]).should.deep.equal(['onTestTransaction2']);
        });

        it('should find multiple annotated functions', () => {
            compiledScriptBundle.findFunctionNames(transactions[2]).should.deep.equal(['doIt3a', 'doIt3b']);
        });

        it('should cope with no matching functions', () => {
            compiledScriptBundle.findFunctionNames(transactions[3]).should.deep.equal([]);
        });

    });

});
