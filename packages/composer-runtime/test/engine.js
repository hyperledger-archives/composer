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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const CompiledAclBundle = require('../lib/compiledaclbundle');
const CompiledQueryBundle = require('../lib/compiledquerybundle');
const CompiledScriptBundle = require('../lib/compiledscriptbundle');
const Container = require('../lib/container');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const Factory = require('composer-common').Factory;
const Logger = require('composer-common').Logger;
const LoggingService = require('../lib/loggingservice');
const ModelManager = require('composer-common').ModelManager;
const QueryCompiler = require('../lib/querycompiler');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;
const ScriptCompiler = require('../lib/scriptcompiler');
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


const LOG = Logger.getLog('Engine');

describe('Engine', () => {

    let modelManager;
    let factory;
    let serializer;
    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
        mockDataService = sinon.createStubInstance(DataService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.initialize.resolves();
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getContainer', () => {

        it('should return the container', () => {
            engine.getContainer().should.equal(mockContainer);
        });

    });

    describe('#installLogger', () => {

        it('should install a logger for debug level logging', () => {
            LOG.debug('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/hello.*world/));
        });

        it('should install a logger for warn level logging', () => {
            LOG.warn('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logWarning, sinon.match(/hello.*world/));
        });

        it('should install a logger for info level logging', () => {
            LOG.info('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logInfo, sinon.match(/hello.*world/));
        });

        it('should install a logger for verbose level logging', () => {
            LOG.verbose('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/hello.*world/));
        });

        it('should install a logger for error level logging', () => {
            LOG.error('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logError, sinon.match(/hello.*world/));
        });

        it('should format multiple arguments into a comma separated list', () => {
            LOG.debug('installLogger', 'hello', 'world', 'i', 'am', 'simon');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/world, i, am, simon/));
        });

    });

    describe('#init', () => {

        let tx;
        let json;

        beforeEach(() => {
            tx = factory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork');
            tx.businessNetworkArchive = 'aGVsbG8gd29ybGQ=';
            json = serializer.toJSON(tx);
            sinon.stub(engine, 'submitTransaction').resolves();
        });

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.init(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should throw for invalid arguments', () => {
            (() => {
                engine.init(mockContext, 'init', ['no', 'args', 'supported']);
            }).should.throw(/Invalid arguments "\["no","args","supported"\]" to function "init", expecting "\[\"serializedResource\"\]"/);
        });

        it('should throw for a missing $class', () => {
            delete json.$class;
            (() => {
                engine.init(mockContext, 'init', [JSON.stringify(json)]);
            }).should.throw(/The transaction data specified is not valid/);
        });

        it('should throw for an invalid $class', () => {
            json.$class = 'WoopWoop';
            (() => {
                engine.init(mockContext, 'init', [JSON.stringify(json)]);
            }).should.throw(/The transaction data specified is not valid/);
        });

        it('should throw for a missing businessNetworkArchive', () => {
            delete json.businessNetworkArchive;
            (() => {
                engine.init(mockContext, 'init', [JSON.stringify(json)]);
            }).should.throw(/The business network archive specified is not valid/);
        });

        it('should throw for an empty businessNetworkArchive', () => {
            json.businessNetworkArchive = '';
            (() => {
                engine.init(mockContext, 'init', [JSON.stringify(json)]);
            }).should.throw(/The business network archive specified is not valid/);
        });

        it('should accept upgrade function', () => {
            return engine.init(mockContext, 'upgrade');
        });

        it('should enable logging if logging specified on the init', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            mockContext.getAclCompiler.returns(mockAclCompiler);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.ensure.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            sandbox.stub(Context, 'cacheCompiledQueryBundle');
            sandbox.stub(Context, 'cacheCompiledAclBundle');
            mockRegistryManager.createDefaults.resolves();
            mockContext.getParticipant.returns(null);
            json.logLevel = 'DEBUG';
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.calledOnce(mockLoggingService.setLogLevel);
                    sinon.assert.calledWith(mockLoggingService.setLogLevel, 'DEBUG');

                    sinon.assert.calledTwice(mockDataService.ensureCollection);
                    sinon.assert.calledWith(mockDataService.ensureCollection, '$sysdata');
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, sinon.match((archive) => {
                        return archive.compare(Buffer.from('hello world')) === 0;
                    }));
                    sinon.assert.calledOnce(mockScriptCompiler.compile);
                    sinon.assert.calledWith(mockScriptCompiler.compile, mockScriptManager);
                    sinon.assert.calledTwice(sysdata.add);
                    sinon.assert.calledWith(sysdata.add, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledWith(Context.cacheBusinessNetwork, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetworkDefinition);
                    sinon.assert.calledWith(sysdata.add, 'metanetwork', { '$class': 'org.hyperledger.composer.system.Network', 'networkId':'test' });
                    sinon.assert.calledOnce(Context.cacheBusinessNetwork);
                    sinon.assert.calledWith(Context.cacheBusinessNetwork, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(Context.cacheCompiledScriptBundle);
                    sinon.assert.calledWith(Context.cacheCompiledScriptBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledScriptBundle);
                    sinon.assert.calledOnce(Context.cacheCompiledQueryBundle);
                    sinon.assert.calledWith(Context.cacheCompiledQueryBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledQueryBundle);
                    sinon.assert.calledOnce(Context.cacheCompiledAclBundle);
                    sinon.assert.calledWith(Context.cacheCompiledAclBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledAclBundle);
                    sinon.assert.calledWith(mockDataService.ensureCollection, '$sysregistries');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        function: 'init',
                        arguments: [JSON.stringify(json)],
                        businessNetworkDefinition: mockBusinessNetworkDefinition,
                        compiledScriptBundle: mockCompiledScriptBundle,
                        compiledQueryBundle: mockCompiledQueryBundle,
                        compiledAclBundle: mockCompiledAclBundle,
                        sysregistries: sysregistries,
                        container: sinon.match.any
                    });
                    sinon.assert.calledOnce(engine.submitTransaction);
                    const txs = engine.submitTransaction.args.map((arg) => {
                        return JSON.parse(arg[1]);
                    });
                    txs[0].$class.should.equal('org.hyperledger.composer.system.StartBusinessNetwork');
                    txs[0].transactionId.should.equal(json.transactionId);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should create system collections and default registries', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            mockContext.getAclCompiler.returns(mockAclCompiler);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);

            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.notCalled(mockLoggingService.setLogLevel);
                    sinon.assert.calledTwice(mockDataService.ensureCollection);
                    sinon.assert.calledWith(mockDataService.ensureCollection, '$sysdata');
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, sinon.match((archive) => {
                        return archive.compare(Buffer.from('hello world')) === 0;
                    }));
                    sinon.assert.calledOnce(mockScriptCompiler.compile);
                    sinon.assert.calledWith(mockScriptCompiler.compile, mockScriptManager);
                    sinon.assert.calledTwice(sysdata.add);
                    sinon.assert.calledWith(sysdata.add, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledWith(sysdata.add, 'metanetwork', { '$class': 'org.hyperledger.composer.system.Network', 'networkId':'test' });
                    sinon.assert.calledOnce(Context.cacheBusinessNetwork);
                    sinon.assert.calledWith(Context.cacheBusinessNetwork, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(Context.cacheCompiledScriptBundle);
                    sinon.assert.calledWith(Context.cacheCompiledScriptBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledScriptBundle);
                    sinon.assert.calledWith(mockDataService.ensureCollection, '$sysregistries');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        function: 'init',
                        arguments: [JSON.stringify(json)],
                        businessNetworkDefinition: mockBusinessNetworkDefinition,
                        compiledScriptBundle: mockCompiledScriptBundle,
                        compiledQueryBundle: mockCompiledQueryBundle,
                        compiledAclBundle: mockCompiledAclBundle,
                        sysregistries: sysregistries,
                        container: sinon.match.any
                    });
                    sinon.assert.calledOnce(engine.submitTransaction);
                    const txs = engine.submitTransaction.args.map((arg) => {
                        return JSON.parse(arg[1]);
                    });
                    txs[0].$class.should.equal('org.hyperledger.composer.system.StartBusinessNetwork');
                    txs[0].transactionId.should.equal(json.transactionId);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should reuse the cached compiled script bundle', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.throws(new Error('should not be called'));
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            Context.cacheCompiledScriptBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledScriptBundle);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            mockContext.getAclCompiler.returns(mockAclCompiler);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.ensure.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.notCalled(Context.cacheCompiledScriptBundle);
                });
        });

        it('should reuse the cached compiled query bundle', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.throws(new Error('should not be called'));
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            Context.cacheCompiledQueryBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledQueryBundle);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            mockContext.getAclCompiler.returns(mockAclCompiler);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.ensure.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledQueryBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.notCalled(Context.cacheCompiledQueryBundle);
                });
        });

        it('should reuse the cached compiled ACL bundle', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.throws(new Error('should not be called'));
            mockContext.getAclCompiler.returns(mockAclCompiler);
            Context.cacheCompiledAclBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledAclBundle);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.ensure.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledAclBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.notCalled(Context.cacheCompiledAclBundle);
                });
        });

        it('should throw if an error occurs', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves(mockDataCollection);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').rejects();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .should.be.rejected
                .then(() => {
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should execute any specified bootstrap transactions', () => {
            json.bootstrapTransactions = [
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#doges',
                    resources: [
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        },
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        }
                    ]
                },
                {
                    $class: 'org.hyperledger.composer.system.BindIdentity',
                    participant: 'resource:org.acme.SampleParticipant#PARTICIPANT_1',
                    certificate: '----BEGIN CERTIFICATE\nsuch certificate\n----END CERTIFICATE-----\n'
                }
            ];
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            mockBusinessNetworkDefinition.getIdentifier.returns('test');
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            mockContext.getScriptCompiler.returns(mockScriptCompiler);
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            mockContext.getQueryCompiler.returns(mockQueryCompiler);
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            mockContext.getAclCompiler.returns(mockAclCompiler);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', [JSON.stringify(json)])
                .then(() => {
                    sinon.assert.calledThrice(engine.submitTransaction);
                    const txs = engine.submitTransaction.args.map((arg) => {
                        return JSON.parse(arg[1]);
                    });
                    txs[0].$class.should.equal('org.hyperledger.composer.system.AddParticipant');
                    txs[0].transactionId.should.equal(json.transactionId + '#0');
                    txs[1].$class.should.equal('org.hyperledger.composer.system.BindIdentity');
                    txs[1].transactionId.should.equal(json.transactionId + '#1');
                    txs[2].$class.should.equal('org.hyperledger.composer.system.StartBusinessNetwork');
                    txs[2].transactionId.should.equal(json.transactionId);
                });
        });

    });

    describe('#_init', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'init').resolves();
            engine._init(mockContext, 'init', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'init').rejects(new Error('error'));
            engine._init(mockContext, 'init', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#invoke', () => {

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.invoke(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should initialize the context and call the function', () => {
            engine.test = sinon.stub().resolves();
            return engine.invoke(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        function: 'test',
                        container: {},
                        arguments: []
                    });
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should handle an error from calling the function', () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            return engine.invoke(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/)
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

    });

    describe('#_invoke', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'invoke').resolves();
            engine._invoke(mockContext, 'test', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'invoke').rejects(new Error('error'));
            engine._invoke(mockContext, 'test', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#query', () => {

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.query(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should initialize the context and call the function', () => {
            engine.test = sinon.stub().resolves({});
            return engine.query(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledWith(mockContext.initialize, {
                        function: 'test',
                        container: {},
                        arguments: []
                    });
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, true);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should handle an error from calling the function', () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            return engine.query(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/)
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, true);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

    });

    describe('#_query', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'query').resolves();
            engine._query(mockContext, 'test', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'query').rejects(new Error('error'));
            engine._query(mockContext, 'test', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#ping', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'ping', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "ping", expecting "\[\]"/);
        });

        it('should return an object containing the version', () => {
            return engine.query(mockContext, 'ping', [])
                .then((result) => {
                    result.should.deep.equal({
                        version: version,
                        participant: null
                    });
                });
        });

        it('should return an object containing the current participant', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockContext.getParticipant.returns(mockParticipant);
            return engine.query(mockContext, 'ping', [])
                .then((result) => {
                    result.should.deep.equal({
                        version: version,
                        participant: 'org.doge.Doge#DOGE_1'
                    });
                });
        });

    });

});
