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
const LoggingService = require('../lib/loggingservice');
const QueryCompiler = require('../lib/querycompiler');
const RegistryManager = require('../lib/registrymanager');
const ScriptCompiler = require('../lib/scriptcompiler');
const ScriptManager = require('composer-common').ScriptManager;
const version = require('../package.json').version;
const Serializer = require('composer-common').Serializer;
const AccessController = require('../lib/accesscontroller');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('EngineBusinessNetworks', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let sandbox;
    let mockSerializer, mockAccessController;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(Serializer);


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
        mockContext.getSerializer.returns(mockSerializer);
        mockDataService = sinon.createStubInstance(DataService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);

        mockAccessController = sinon.createStubInstance(AccessController);
        mockContext.getAccessController.returns(mockAccessController);

        engine = new Engine(mockContainer);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getBusinessNetwork", expecting "\[\]"/);
        });

        it('should return the business network archive', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            sysdata.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            return engine.query(mockContext, 'getBusinessNetwork', [])
                .then((result) => {
                    result.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                });
        });

    });

    describe('#undeployBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'undeployBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "undeployBusinessNetwork", expecting "\[\]"/);
        });

        it('should set the undeploy flag on a business network', () => {
            let businessNetwork = { data: 'data', hash: 'hash' };
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            sysdata.get.withArgs('businessnetwork').resolves(businessNetwork);

            return engine.invoke(mockContext, 'undeployBusinessNetwork', [])
                .then(() => {
                    sinon.assert.calledTwice(sysdata.get);
                    sinon.assert.calledWith(sysdata.get, 'businessnetwork');
                    sinon.assert.calledWith(sysdata.get, 'metanetwork');
                    businessNetwork.undeploy = true;
                    sinon.assert.calledOnce(sysdata.update);
                    sinon.assert.calledWith(sysdata.update, 'businessnetwork', businessNetwork);
                });
        });
    });

    describe('#updateBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'updateBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "updateBusinessNetwork", expecting "\[\"businessNetworkArchive\"\]"/);
        });

        it('should update the business network archive and create default registries', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            sysdata.update.withArgs('businessnetwork', { data: 'aGVsbG8gd29ybGQ=' }).resolves();
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            mockBusinessNetworkDefinition.getScriptManager.returns(mockScriptManager);
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
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            sandbox.stub(Context, 'cacheCompiledQueryBundle');
            sandbox.stub(Context, 'cacheCompiledAclBundle');
            mockRegistryManager.createDefaults.resolves();
            return engine.invoke(mockContext, 'updateBusinessNetwork', ['aGVsbG8gd29ybGQ='])
                .then((result) => {
                    sinon.assert.calledOnce(sysdata.update);
                    sinon.assert.calledWith(sysdata.update, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledOnce(Context.cacheBusinessNetwork);
                    sinon.assert.calledWith(Context.cacheBusinessNetwork, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetworkDefinition);
                    sinon.assert.calledOnce(Context.cacheCompiledScriptBundle);
                    sinon.assert.calledWith(Context.cacheCompiledScriptBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledScriptBundle);
                    sinon.assert.calledOnce(Context.cacheCompiledQueryBundle);
                    sinon.assert.calledWith(Context.cacheCompiledQueryBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledQueryBundle);
                    sinon.assert.calledOnce(Context.cacheCompiledAclBundle);
                    sinon.assert.calledWith(Context.cacheCompiledAclBundle, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledAclBundle);
                    sinon.assert.calledTwice(mockContext.initialize);
                    // Initialize.
                    sinon.assert.calledWith(mockContext.initialize);
                    // Reinitialize.
                    sinon.assert.calledWith(mockContext.initialize, {
                        businessNetworkDefinition: mockBusinessNetworkDefinition,
                        compiledScriptBundle: mockCompiledScriptBundle,
                        compiledQueryBundle: mockCompiledQueryBundle,
                        compiledAclBundle: mockCompiledAclBundle,
                        reinitialize: true
                    });
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                });
        });

    });

    describe('#resetBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'resetBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "resetBusinessNetwork", expecting "\[\]"/);
        });

        it('should delete all registries and resources', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.resolves([{
                type: 'Asset',
                registryId: 'sheeps'
            }, {
                type: 'Participants',
                registryId: 'farmers'
            }]);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            mockDataService.deleteCollection.resolves();
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').resolves();
            mockRegistryManager.createDefaults.resolves();
            return engine.invoke(mockContext, 'resetBusinessNetwork', [])
                .then(() => {
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Participants:farmers');
                    sinon.assert.calledWith(mockDataCollection.remove, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataCollection.remove, 'Participants:farmers');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                });
        });

    });

});
