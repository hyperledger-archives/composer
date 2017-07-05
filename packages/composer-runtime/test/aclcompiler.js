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

const AclCompiler = require('../lib/aclcompiler');
const AclManager = require('composer-common').AclManager;
const assert = require('assert');
const ModelManager = require('composer-common').ModelManager;
const path = require('path');
const Resource = require('composer-common').Resource;
const ScriptManager = require('composer-common').ScriptManager;
const SourceMapConsumer = require('source-map').SourceMapConsumer;
const SourceNode = require('source-map').SourceNode;

require('chai').should();
const sinon = require('sinon');

describe('AclCompiler', () => {

    let modelManager;
    let scriptManager;
    let aclManager;
    let aclRules;
    let functionDeclarations;
    let aclCompiler;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        asset TestAsset identified by assetId {
            o String assetId
        }
        participant TestParticipant identified by participantId {
            o String participantId
        }
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
            function doIt() {
                assert.ok(true);
                return true;
            }

            function doIt3a() {
            }

            function doIt3b() {
            }

            function testItAll(r, p, t) {
                assert.ok(r, p, t);
            }`));
        functionDeclarations = [];
        scriptManager.getScripts().forEach((script) => {
            script.getFunctionDeclarations().forEach((functionDeclaration) => {
                functionDeclarations.push(functionDeclaration);
            });
        });
        aclManager = new AclManager(modelManager);
        aclManager.setAclFile(aclManager.createAclFile('permissions.acl', `
        rule R1 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (true)
            action: ALLOW
        }
        rule R2 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R3 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource(THERES): "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R4 {
            description: "test acl rule"
            participant: "ANY"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R5 {
            description: "test acl rule"
            participant(THEPART): "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R6 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction: "org.acme.TestTransaction"
            condition: (doIt())
            action: ALLOW
        }
        rule R7 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction(THETX): "org.acme.TestTransaction"
            condition: (doIt())
            action: ALLOW
        }
        rule R8 {
            description: "test acl rule"
            participant(p): "org.acme.TestParticipant"
            operation: ALL
            resource(r): "org.acme.TestAsset"
            transaction(t): "org.acme.TestTransaction"
            condition: (testItAll(r, p, t))
            action: ALLOW
        }
        rule R9 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction: "org.acme.TestTransaction"
            condition: (testItAll(__resource, __participant, __transaction))
            action: ALLOW
        }
        `));
        aclRules = aclManager.getAclRules();
        aclCompiler = new AclCompiler();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#compile', () => {

        it('should compile all of the ACL rules in the specified ACL manager into a bundle', () => {
            sandbox.stub(assert, 'ok');
            const compiledAclBundle = aclCompiler.compile(aclManager, scriptManager);
            const aclRules = compiledAclBundle.aclRules;
            const generatorFunction = compiledAclBundle.generatorFunction;
            aclRules.should.have.lengthOf(9);
            generatorFunction.should.be.a('function');
            const result = generatorFunction();
            result.should.be.an('object');
            result.R1.should.be.a('function');
            result.R1().should.be.true;
            result.R2.should.be.a('function');
            result.R2().should.be.true;
            sinon.assert.calledOnce(assert.ok);
            sinon.assert.calledWith(assert.ok, true);
            result.R3.should.be.a('function');
            result.R4.should.be.a('function');
            result.R5.should.be.a('function');
            result.R6.should.be.a('function');
            result.R7.should.be.a('function');
            result.R8.should.be.a('function');
            result.R9.should.be.a('function');
        });

        it('should generate functions with correctly bound variables', () => {
            sandbox.stub(assert, 'ok');
            const compiledAclBundle = aclCompiler.compile(aclManager, scriptManager);
            const generatorFunction = compiledAclBundle.generatorFunction;
            const result = generatorFunction();
            const mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.participantId = 'P1';
            const mockAsset = sinon.createStubInstance(Resource);
            mockAsset.assetId = 'A1';
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.transactionId = 'T1';
            result.R8(mockAsset, mockParticipant, mockTransaction);
            sinon.assert.calledOnce(assert.ok);
            sinon.assert.calledWith(assert.ok, mockAsset, mockParticipant, mockTransaction);
        });

        it('should generate functions with default bound variables', () => {
            sandbox.stub(assert, 'ok');
            const compiledAclBundle = aclCompiler.compile(aclManager, scriptManager);
            const generatorFunction = compiledAclBundle.generatorFunction;
            const result = generatorFunction();
            const mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.participantId = 'P1';
            const mockAsset = sinon.createStubInstance(Resource);
            mockAsset.assetId = 'A1';
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.transactionId = 'T1';
            result.R9(mockAsset, mockParticipant, mockTransaction);
            sinon.assert.calledOnce(assert.ok);
            sinon.assert.calledWith(assert.ok, mockAsset, mockParticipant, mockTransaction);
        });

    });

    describe('#processAclManager', () => {

        it('should process all of the ACL rules in the specified ACL manager', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            aclCompiler.processAclManager(context, aclManager);
            sinon.assert.callCount(context.rootNode.add, 3 * aclRules.length);
            context.aclRules.should.deep.equal(aclRules);
        });

    });

    describe('#processAclRule', () => {

        it('should process the specified ACL rule', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[0];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            context.aclRules.should.deep.equal([ aclRule ]);
        });

        it('should process an ACL rule with a resource binding', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[2];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match(/function R3\(THERES,__participant,__transaction\) {/));
            context.aclRules.should.deep.equal([ aclRule ]);
        });

        it('should process an ACL rule with an unbound participant', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[3];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match(/function R4\(__resource,__participant,__transaction\) {/));
            context.aclRules.should.deep.equal([ aclRule ]);
        });

        it('should process an ACL rule with a participant binding', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[4];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match(/function R5\(__resource,THEPART,__transaction\) {/));
            context.aclRules.should.deep.equal([ aclRule ]);
        });

        it('should process an ACL rule with an unbound transaction', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[5];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match(/function R6\(__resource,__participant,__transaction\) {/));
            context.aclRules.should.deep.equal([ aclRule ]);
        });

        it('should process an ACL rule with a transaction binding', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                },
                aclRules: []
            };
            const aclRule = aclRules[6];
            aclCompiler.processAclRule(context, aclRule);
            sinon.assert.calledThrice(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match(/function R7\(__resource,__participant,THETX\) {/));
            context.aclRules.should.deep.equal([ aclRule ]);
        });

    });

    describe('#processScriptManager', () => {

        it('should process all of the scripts in the specified script manager', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                }
            };
            aclCompiler.processScriptManager(context, scriptManager);
            sinon.assert.calledOnce(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match.instanceOf(SourceNode));
        });

    });

    describe('#processScript', () => {

        it('should process the specified script', () => {
            const context = {
                rootNode: {
                    add: sinon.stub()
                }
            };
            const script = scriptManager.getScript('script1');
            aclCompiler.processScript(context, script);
            sinon.assert.calledOnce(context.rootNode.add);
            sinon.assert.calledWith(context.rootNode.add, sinon.match.instanceOf(SourceNode));
        });

    });

    describe('#convertScriptToSourceMap', () => {

        it('should convert a script into a valid source map', () => {
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceMap = aclCompiler.convertScriptToSourceMap(context, script);
            sourceMap.should.be.a('string');
            const sourceMapConsumer = new SourceMapConsumer(sourceMap);
            const mappings = [];
            sourceMapConsumer.eachMapping((mapping) => {
                mappings.push(mapping);
            });
            mappings.should.have.lengthOf(51);
            sourceMapConsumer.sourceContentFor(path.resolve(process.cwd(), 'script1')).should.match(/function doIt\(\) {/);
        });

    });

    describe('#convertScriptToScriptNode', () => {

        it('should convert a script into a source node', () => {
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceNode = aclCompiler.convertScriptToScriptNode(context, script);
            sourceNode.should.be.an.instanceOf(SourceNode);
            const result = sourceNode.toStringWithSourceMap();
            result.code.should.equal(script.getContents());
            const sourceMap = result.map.toString();
            sourceMap.should.be.a('string');
        });

        it('should allow the script to be transformed', () => {
            aclCompiler.transformScript = (sourceFileName, sourceCode, sourceMap) => {
                return {
                    sourceFileName: sourceFileName,
                    sourceCode: sourceCode.replace(/function/, /FANCTION/),
                    sourceMap: sourceMap
                };
            };
            const context = {};
            const script = scriptManager.getScript('script1');
            const sourceNode = aclCompiler.convertScriptToScriptNode(context, script);
            sourceNode.should.be.an.instanceOf(SourceNode);
            const result = sourceNode.toStringWithSourceMap();
            result.code.should.match(/FANCTION/);
            const sourceMap = result.map.toString();
            sourceMap.should.be.a('string');
        });

    });

    describe('#transformScript', () => {

        it('should return the script', () => {
            aclCompiler.transformScript('script1', 'eval(true)', 'some map').should.deep.equal({
                sourceCode: 'eval(true)',
                sourceFileName: 'script1',
                sourceMap: 'some map'
            });
        });

    });

});
