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
const assert = require('assert');
const ModelManager = require('composer-common').ModelManager;
const path = require('path');
const ScriptManager = require('composer-common').ScriptManager;
const ScriptCompiler = require('../lib/scriptcompiler');
const SourceMapConsumer = require('source-map').SourceMapConsumer;
const SourceNode = require('source-map').SourceNode;

require('chai').should();
const sinon = require('sinon');

describe('ScriptCompiler', () => {

    let modelManager;
    let scriptManager;
    let functionDeclarations;
    let scriptCompiler;
    let mockApi;
    let sandbox;

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
        scriptManager = new ScriptManager(modelManager);
        scriptManager.addScript(scriptManager.createScript('script1', 'JS', `
            /**
             * @param {org.acme.TestTransaction} transaction The transaction to call.
             * @transaction
             */
            function doIt(transaction) {
                assert.ok(true);
                getFactory();
                emit();
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
        scriptCompiler = new ScriptCompiler();
        mockApi = sinon.createStubInstance(Api);
        Api.getMethodNames().forEach((methodName) => {
            mockApi[methodName] = sinon.stub();
        });
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#compile', () => {

        it('should compile all of the scripts in the specified script manager into a bundle', () => {
            sandbox.stub(assert, 'ok');
            const compiledScriptBundle = scriptCompiler.compile(scriptManager);
            const functionDeclarations = compiledScriptBundle.functionDeclarations;
            const generatorFunction = compiledScriptBundle.generatorFunction;
            functionDeclarations.should.have.lengthOf(4);
            generatorFunction.should.be.a('function');
            const result = generatorFunction(mockApi);
            result.should.be.an('object');
            result.doIt.should.be.a('function');
            result.doIt3a.should.be.a('function');
            result.doIt3b.should.be.a('function');
            result.onTestTransaction2.should.be.a('function');
            result.doIt();
            sinon.assert.calledOnce(assert.ok);
            sinon.assert.calledWith(assert.ok, true);
            sinon.assert.calledOnce(mockApi.getFactory);
            sinon.assert.calledOnce(mockApi.emit);
        });

    });

    describe('#processScriptManager', () => {

        it('should process all of the scripts in the specified script manager', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                functionDeclarations: []
            };
            scriptCompiler.processScriptManager(context, scriptManager);
            sinon.assert.calledTwice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match.instanceOf(SourceNode));
            context.functionDeclarations.map((functionDeclaration) => {
                return functionDeclaration.getName();
            }).should.deep.equal(['doIt', 'doIt3a', 'doIt3b', 'onTestTransaction2']);
        });

    });

    describe('#processScript', () => {

        it('should process the specified script', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                functionDeclarations: []
            };
            const script = scriptManager.getScript('script1');
            scriptCompiler.processScript(context, script);
            sinon.assert.calledOnce(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match.instanceOf(SourceNode));
            context.functionDeclarations.map((functionDeclaration) => {
                return functionDeclaration.getName();
            }).should.deep.equal(['doIt', 'doIt3a', 'doIt3b']);
        });

    });

    describe('#convertScriptToSourceMap', () => {

        it('should convert a script into a valid source map', () => {
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceMap = scriptCompiler.convertScriptToSourceMap(context, script);
            sourceMap.should.be.a('string');
            const sourceMapConsumer = new SourceMapConsumer(sourceMap);
            const mappings = [];
            sourceMapConsumer.eachMapping((mapping) => {
                mappings.push(mapping);
            });
            mappings.should.have.lengthOf(37);
            sourceMapConsumer.sourceContentFor(path.resolve(process.cwd(), 'script1')).should.match(/function doIt3a\(transaction\) {/);
        });

    });

    describe('#convertScriptToScriptNode', () => {

        it('should convert a script into a source node', () => {
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceNode = scriptCompiler.convertScriptToScriptNode(context, script);
            sourceNode.should.be.an.instanceOf(SourceNode);
            const result = sourceNode.toStringWithSourceMap();
            result.code.should.equal(script.getContents());
            const sourceMap = result.map.toString();
            sourceMap.should.be.a('string');
        });

        it('should allow the script to be transformed', () => {
            scriptCompiler.transformScript = (sourceFileName, sourceCode, sourceMap) => {
                return {
                    sourceFileName: sourceFileName,
                    sourceCode: sourceCode.replace(/function/, /FANCTION/),
                    sourceMap: sourceMap
                };
            };
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceNode = scriptCompiler.convertScriptToScriptNode(context, script);
            sourceNode.should.be.an.instanceOf(SourceNode);
            const result = sourceNode.toStringWithSourceMap();
            result.code.should.match(/FANCTION/);
            const sourceMap = result.map.toString();
            sourceMap.should.be.a('string');
        });

    });

    describe('#transformScript', () => {

        it('should return the script', () => {
            scriptCompiler.transformScript('script1', 'eval(true)', 'some map').should.deep.equal({
                sourceCode: 'eval(true)',
                sourceFileName: 'script1',
                sourceMap: 'some map'
            });
        });

    });

});
