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
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const QueryCompiler = require('../lib/querycompiler');
const RegistryManager = require('../lib/registrymanager');
const ScriptCompiler = require('../lib/scriptcompiler');
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const AccessController = require('../lib/accesscontroller');
const Api = require('../lib/api');
const Factory = require('composer-common').Factory;
const IdentityService = require('../lib/identityservice');
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const NetworkManager = require('../lib/networkmanager');
const Resolver = require('../lib/resolver');
const LoggingService = require('../lib/loggingservice');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('NetworkManager', () => {

    let mockApi;
    let mockContext;
    let mockIdentityService;
    let mockRegistryManager;
    let mockRegistry;
    let mockSystemRegistry;
    let modelManager;
    let mockResolver;
    let mockDataService;
    let factory;
    let mockDataCollection;
    let sandbox;
    let mockSerializer;
    let networkManager;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(Serializer);
        mockApi = sinon.createStubInstance(Api);
        mockContext = sinon.createStubInstance(Context);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockContext.getIdentityService.returns(mockIdentityService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockResolver  = sinon.createStubInstance(Resolver);
        mockContext.getResolver.returns(mockResolver);
        mockResolver.resolve.resolves( {type:'Asset',registryId: 'a.n.other.registry'});
        mockDataService = sinon.createStubInstance(DataService);
        mockContext.getDataService.returns(mockDataService);
        mockDataCollection = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.resolves(mockDataCollection);
        mockContext.getSerializer.returns(mockSerializer);
        mockRegistry = sinon.createStubInstance(Registry);
        mockSystemRegistry = sinon.createStubInstance(Registry);
        mockSystemRegistry.system=true;
        mockRegistryManager.get.withArgs('Asset', 'a.n.other.registry').resolves(mockRegistry);
        modelManager = new ModelManager();

        modelManager.addModelFile(`
        namespace org.acme
        participant SampleParticipant identified by participantId {
            o String participantId
        }
        `);
        factory = new Factory(modelManager);
        mockContext.getFactory.returns(factory);

        networkManager = new NetworkManager(mockContext);


        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#startBusinessNetwork', () => {

        it('should do nothing', () => {
            const mockApi = sinon.createStubInstance(Api);
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork');
            return networkManager.execute(mockApi, tx);
        });

    });

    describe('#updateBusinessNetwork', () => {

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

            let mockAccessController = sinon.createStubInstance(AccessController);
            mockContext.getAccessController.returns(mockAccessController);
            mockAccessController.check.resolves();

            let mockSerializer = sinon.createStubInstance(Serializer);
            mockContext.getSerializer.returns(mockSerializer);
            mockSerializer.toJSON.returns({key:'value'});
            sandbox.stub(Context, 'cacheBusinessNetwork');
            sandbox.stub(Context, 'cacheCompiledScriptBundle');
            sandbox.stub(Context, 'cacheCompiledQueryBundle');
            sandbox.stub(Context, 'cacheCompiledAclBundle');
            mockRegistryManager.createDefaults.resolves();
            return networkManager.updateBusinessNetwork(mockApi, {businessNetworkArchive:'aGVsbG8gd29ybGQ='})
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
                    sinon.assert.calledOnce(mockContext.initialize);
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

        it('should delete all registries and resources', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.resolves([{
                type: 'Asset',
                registryId: 'sheeps'
            }, {
                type: 'Participants',
                registryId: 'farmers'
            }]);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            mockDataService.deleteCollection.resolves();
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').resolves();
            mockRegistryManager.createDefaults.resolves();
            mockRegistryManager.remove.returns;
            let mockAccessController = sinon.createStubInstance(AccessController);
            mockContext.getAccessController.returns(mockAccessController);
            mockAccessController.check.resolves();
            mockRegistryManager.getAll.resolves([mockRegistry,mockSystemRegistry]);
            return networkManager.resetBusinessNetwork(mockApi, {})
                        .then(() => {
                            sinon.assert.calledThrice(mockRegistryManager.remove);
                            sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                        });
        });

    });

    describe('#setLogLevel', () => {

        it('good path', ()=>{
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.resolves([{
                type: 'Asset',
                registryId: 'metanetwork'
            }]);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);

            mockDataService.deleteCollection.resolves();
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').resolves();
            mockRegistryManager.createDefaults.resolves();
            mockRegistryManager.remove.returns;

            let mockLoggingService = sinon.createStubInstance(LoggingService);
            mockLoggingService.setLogLevel.returns();
            mockContext.getLoggingService.returns(mockLoggingService);
            let mockAccessController = sinon.createStubInstance(AccessController);
            mockContext.getAccessController.returns(mockAccessController);
            mockAccessController.check.resolves();
            mockRegistryManager.getAll.resolves([mockRegistry]);
            return networkManager.setLogLevel(mockApi, {newLogLevel:'level'})
                        .then(() => {
                            sinon.assert.calledWith(mockLoggingService.setLogLevel,'level');
                        });
        });



    });
});

/*
        it('should delete all registries and resources', () => {
            sinon.stub(engine, '_resetRegistries').resolves();
            mockRegistryManager.createDefaults.resolves();
            return engine.invoke(mockContext, 'resetBusinessNetwork', [])
                .then(() => {
                    sinon.assert.calledThrice(engine._resetRegistries);
                    sinon.assert.calledWith(engine._resetRegistries, mockContext, 'Asset');
                    sinon.assert.calledWith(engine._resetRegistries, mockContext, 'Participant');
                    sinon.assert.calledWith(engine._resetRegistries, mockContext, 'Transaction');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                    sinon.assert.calledWith(mockRegistryManager.createDefaults, true);
                });
        });*/