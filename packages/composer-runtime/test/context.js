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
const AccessController = require('../lib/accesscontroller');
const AclManager = require('composer-common').AclManager;
const Api = require('../lib/api');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const CompiledAclBundle = require('../lib/compiledaclbundle');
const CompiledQueryBundle = require('../lib/compiledquerybundle');
const CompiledScriptBundle = require('../lib/compiledscriptbundle');
const Context = require('../lib/context');
const Container = require('../lib/container');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const EventService = require('../lib/eventservice');
const Factory = require('composer-common').Factory;
const HTTPService = require('../lib/httpservice');
const IdentityManager = require('../lib/identitymanager');
const IdentityService = require('../lib/identityservice');
const Introspector = require('composer-common').Introspector;
const ModelManager = require('composer-common').ModelManager;
const QueryCompiler = require('../lib/querycompiler');
const RegistryManager = require('../lib/registrymanager');
const ResourceManager = require('../lib/resourcemanager');
const NetworkManager = require('../lib/networkmanager');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const ScriptCompiler = require('../lib/scriptcompiler');
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const TransactionLogger = require('../lib/transactionlogger');
const LoggingService = require('../lib/loggingservice');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('Context', () => {

    let mockBusinessNetworkDefinition;
    let mockEngine;
    let context;
    let sandbox;

    beforeEach(() => {
        mockEngine = sinon.createStubInstance(Engine);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        context = new Context(mockEngine);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should store the engine', () => {
            context.engine.should.equal(mockEngine);
        });

    });

    describe('#getFunction', () => {

        it('should return the current function', () => {
            context.function = 'suchfunc';
            context.getFunction().should.equal('suchfunc');
        });

    });

    describe('#getArguments', () => {

        it('should return the current arguments', () => {
            context.arguments = ['arg1', 'arg2'];
            context.getArguments().should.deep.equal(['arg1', 'arg2']);
        });

    });

    describe('#loadBusinessNetworkRecord', () => {

        it('should load the business record', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);
            mockDataCollection.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
            sandbox.stub(context, 'getDataService').returns(mockDataService);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            return context.loadBusinessNetworkRecord()
                .then((businessNetworkRecord) => {
                    businessNetworkRecord.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                });
        });

        it('should not load the business record twice', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);
            mockDataCollection.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
            sandbox.stub(context, 'getDataService').returns(mockDataService);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            return context.loadBusinessNetworkRecord()
                .then((businessNetworkRecord) => {
                    businessNetworkRecord.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    return context.loadBusinessNetworkRecord();
                })
                .then((businessNetworkRecord) => {
                    businessNetworkRecord.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledOnce(mockDataCollection.get);
                });
        });

        it('should throw an error if the business network has been undeployed', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);
            mockDataCollection.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', undeployed: true });
            sandbox.stub(context, 'getDataService').returns(mockDataService);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            return context.loadBusinessNetworkRecord()
                .should.be.rejectedWith(/The business network has been undeployed/);
        });

    });

    describe('#loadBusinessNetworkDefinition', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        let mockBusinessNetworkDefinition;

        beforeEach(() => {
            mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        });

        it('should load the business network if it is not already in the cache', () => {
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            return context.loadBusinessNetworkDefinition(businessNetworkRecord)
                .then((businessNetworkDefinition) => {
                    businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                });
        });

        it('should not load the business network if it is already in the cache', () => {
            Context.cacheBusinessNetwork('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').rejects();
            return context.loadBusinessNetworkDefinition(businessNetworkRecord)
                .then((businessNetworkDefinition) => {
                    businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                });
        });

        it('should handle any errors thrown loading the business network', () => {
            Context.cacheBusinessNetwork('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', null);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').rejects(new Error('such error'));
            return context.loadBusinessNetworkDefinition(businessNetworkRecord)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#loadCompiledScriptBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        let mockScriptCompiler;
        let mockCompiledScriptBundle;

        beforeEach(() => {
            mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockScriptCompiler.compile.returns(mockCompiledScriptBundle);
            context.scriptCompiler = mockScriptCompiler;
        });

        it('should load the compiled script bundle if it is not already in the cache', () => {
            return context.loadCompiledScriptBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledScriptBundle) => {
                    compiledScriptBundle.should.equal(mockCompiledScriptBundle);
                });
        });

        it('should not load the compiled script bundle if it is already in the cache', () => {
            Context.cacheCompiledScriptBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledScriptBundle);
            mockScriptCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledScriptBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledScriptBundle) => {
                    compiledScriptBundle.should.equal(mockCompiledScriptBundle);
                });
        });

        it('should handle any errors thrown loading the compiled script bundle', () => {
            Context.cacheCompiledScriptBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', null);
            mockScriptCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledScriptBundle(businessNetworkRecord, businessNetworkDefinition)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#loadCompiledQueryBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        let mockQueryCompiler;
        let mockCompiledQueryBundle;

        beforeEach(() => {
            mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockQueryCompiler.compile.returns(mockCompiledQueryBundle);
            context.queryCompiler = mockQueryCompiler;
        });

        it('should load the compiled query bundle if it is not already in the cache', () => {
            return context.loadCompiledQueryBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledQueryBundle) => {
                    compiledQueryBundle.should.equal(mockCompiledQueryBundle);
                });
        });

        it('should not load the compiled query bundle if it is already in the cache', () => {
            Context.cacheCompiledQueryBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledQueryBundle);
            mockQueryCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledQueryBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledQueryBundle) => {
                    compiledQueryBundle.should.equal(mockCompiledQueryBundle);
                });
        });

        it('should handle any errors thrown loading the compiled query bundle', () => {
            Context.cacheCompiledQueryBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', null);
            mockQueryCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledQueryBundle(businessNetworkRecord, businessNetworkDefinition)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#loadCompiledAclBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        let mockAclCompiler;
        let mockCompiledAclBundle;

        beforeEach(() => {
            mockAclCompiler = sinon.createStubInstance(AclCompiler);
            mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            mockAclCompiler.compile.returns(mockCompiledAclBundle);
            context.aclCompiler = mockAclCompiler;
        });

        it('should load the compiled ACL bundle if it is not already in the cache', () => {
            return context.loadCompiledAclBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledAclBundle) => {
                    compiledAclBundle.should.equal(mockCompiledAclBundle);
                });
        });

        it('should not load the compiled ACL bundle if it is already in the cache', () => {
            Context.cacheCompiledAclBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockCompiledAclBundle);
            mockAclCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledAclBundle(businessNetworkRecord, businessNetworkDefinition)
                .then((compiledAclBundle) => {
                    compiledAclBundle.should.equal(mockCompiledAclBundle);
                });
        });

        it('should handle any errors thrown loading the compiled ACL bundle', () => {
            Context.cacheCompiledAclBundle('dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', null);
            mockAclCompiler.compile.throws(new Error('such error'));
            return context.loadCompiledAclBundle(businessNetworkRecord, businessNetworkDefinition)
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#getIdentity', () => {

        let mockIdentity;

        beforeEach(() => {
            mockIdentity = sinon.createStubInstance(Resource);
        });

        it('should get the current identity', () => {
            context.currentIdentity = mockIdentity;
            context.getIdentity().should.equal(mockIdentity);
        });

    });

    describe('#setIdentity', () => {

        let mockIdentity;

        beforeEach(() => {
            mockIdentity = sinon.createStubInstance(Resource);
        });

        it('should set the current identity', () => {
            context.setIdentity(mockIdentity);
            context.currentIdentity.should.equal(mockIdentity);
        });

        it('should throw if a current identity has been set', () => {
            context.setIdentity(mockIdentity);
            context.currentIdentity.should.equal(mockIdentity);
            (() => {
                context.setIdentity(mockIdentity);
            }).should.throw(/A current identity has already been specified/);
        });

    });

    describe('#loadCurrentParticipant', () => {

        let mockIdentityManager;
        let mockIdentityService;
        let mockIdentity;
        let mockParticipant;

        beforeEach(() => {
            mockIdentityManager = sinon.createStubInstance(IdentityManager);
            sinon.stub(context, 'getIdentityManager').returns(mockIdentityManager);
            mockIdentityService = sinon.createStubInstance(IdentityService);
            sinon.stub(context, 'getIdentityService').returns(mockIdentityService);
            mockIdentity = sinon.createStubInstance(Resource);
            mockParticipant = sinon.createStubInstance(Resource);
        });

        it('should get the identity, validate it, and get the participant', () => {
            mockIdentityManager.getIdentity.resolves(mockIdentity);
            mockIdentityManager.getParticipant.withArgs(mockIdentity).resolves(mockParticipant);
            return context.loadCurrentParticipant()
                .should.eventually.be.equal(mockParticipant)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.validateIdentity);
                    sinon.assert.calledWith(mockIdentityManager.validateIdentity, mockIdentity);
                });
        });

        it('should ignore an activation required message when calling the activate current identity transaction', () => {
            mockIdentityManager.getIdentity.resolves(mockIdentity);
            mockIdentityManager.getParticipant.withArgs(mockIdentity).resolves(mockParticipant);
            context.function = 'submitTransaction';
            context.arguments = [
                JSON.stringify({ $class: 'org.hyperledger.composer.system.ActivateCurrentIdentity', transactionId: '45b17dfd-827e-4458-84e0-a3e30e2aa9e6' })
            ];
            const error = new Error('such error');
            error.activationRequired = true;
            mockIdentityManager.validateIdentity.withArgs(mockIdentity).throws(error);
            return context.loadCurrentParticipant()
                .should.eventually.be.null
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.validateIdentity);
                    sinon.assert.calledWith(mockIdentityManager.validateIdentity, mockIdentity);
                });
        });

        it('should throw an activation required message when calling another transaction', () => {
            mockIdentityManager.getIdentity.resolves(mockIdentity);
            mockIdentityManager.getParticipant.withArgs(mockIdentity).resolves(mockParticipant);
            context.function = 'submitTransaction';
            context.arguments = [
                '45ea5b75-cc00-40bb-afad-4952ad97d469',
                JSON.stringify({ $class: 'org.hyperledger.composer.system.BindIdentity', transactionId: '45b17dfd-827e-4458-84e0-a3e30e2aa9e6' })
            ];
            const error = new Error('such error');
            error.activationRequired = true;
            mockIdentityManager.validateIdentity.withArgs(mockIdentity).throws(error);
            return context.loadCurrentParticipant()
                .should.be.rejectedWith(/such error/);
        });

        it('should throw an activation required message when calling another function', () => {
            mockIdentityManager.getIdentity.resolves(mockIdentity);
            mockIdentityManager.getParticipant.withArgs(mockIdentity).resolves(mockParticipant);
            context.function = 'bindIdentity';
            const error = new Error('such error');
            error.activationRequired = true;
            mockIdentityManager.validateIdentity.withArgs(mockIdentity).throws(error);
            return context.loadCurrentParticipant()
                .should.be.rejectedWith(/such error/);
        });

        it('should throw an non-activation required message', () => {
            mockIdentityManager.getIdentity.resolves(mockIdentity);
            mockIdentityManager.getParticipant.withArgs(mockIdentity).resolves(mockParticipant);
            mockIdentityManager.validateIdentity.withArgs(mockIdentity).throws(new Error('such error'));
            return context.loadCurrentParticipant()
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#findBusinessNetworkDefinition', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);

        beforeEach(() => {
            sinon.stub(context, 'loadBusinessNetworkRecord').resolves(businessNetworkRecord);
            sinon.stub(context, 'loadBusinessNetworkDefinition').resolves(businessNetworkDefinition);
        });

        it('should load the business network definition if not specified', () => {
            return context.findBusinessNetworkDefinition()
                .then((foundBusinessNetworkDefinition) => {
                    sinon.assert.calledOnce(context.loadBusinessNetworkDefinition);
                    sinon.assert.calledWith(context.loadBusinessNetworkDefinition, businessNetworkRecord);
                    foundBusinessNetworkDefinition.should.equal(businessNetworkDefinition);
                });
        });

        it('should use the business network definition in the options', () => {
            const options = {
                businessNetworkDefinition: sinon.createStubInstance(BusinessNetworkDefinition)
            };
            return context.findBusinessNetworkDefinition(options)
                .then((foundBusinessNetworkDefinition) => {
                    foundBusinessNetworkDefinition.should.equal(options.businessNetworkDefinition);
                });
        });

    });

    describe('#findCompiledScriptBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        const compiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);

        beforeEach(() => {
            sinon.stub(context, 'loadBusinessNetworkRecord').resolves(businessNetworkRecord);
            sinon.stub(context, 'loadCompiledScriptBundle').resolves(compiledScriptBundle);
        });

        it('should load the compiled script bundle if not specified', () => {
            return context.findCompiledScriptBundle(businessNetworkDefinition)
                .then((foundCompiledScriptBundle) => {
                    sinon.assert.calledOnce(context.loadCompiledScriptBundle);
                    sinon.assert.calledWith(context.loadCompiledScriptBundle, businessNetworkRecord, businessNetworkDefinition);
                    foundCompiledScriptBundle.should.equal(compiledScriptBundle);
                });
        });

        it('should use the compiled script bundle in the options', () => {
            const options = {
                compiledScriptBundle: sinon.createStubInstance(CompiledScriptBundle)
            };
            return context.findCompiledScriptBundle(businessNetworkDefinition, options)
                .then((foundCompiledScriptBundle) => {
                    foundCompiledScriptBundle.should.equal(options.compiledScriptBundle);
                });
        });

    });

    describe('#findCompiledQueryBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        const compiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);

        beforeEach(() => {
            sinon.stub(context, 'loadBusinessNetworkRecord').resolves(businessNetworkRecord);
            sinon.stub(context, 'loadCompiledQueryBundle').resolves(compiledQueryBundle);
        });

        it('should load the compiled query bundle if not specified', () => {
            return context.findCompiledQueryBundle(businessNetworkDefinition)
                .then((foundCompiledQueryBundle) => {
                    sinon.assert.calledOnce(context.loadCompiledQueryBundle);
                    sinon.assert.calledWith(context.loadCompiledQueryBundle, businessNetworkRecord, businessNetworkDefinition);
                    foundCompiledQueryBundle.should.equal(compiledQueryBundle);
                });
        });

        it('should use the compiled query bundle in the options', () => {
            const options = {
                compiledQueryBundle: sinon.createStubInstance(CompiledQueryBundle)
            };
            return context.findCompiledQueryBundle(businessNetworkDefinition, options)
                .then((foundCompiledQueryBundle) => {
                    foundCompiledQueryBundle.should.equal(options.compiledQueryBundle);
                });
        });

    });

    describe('#findCompiledAclBundle', () => {

        const businessNetworkRecord = { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' };
        const businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        const compiledAclBundle = sinon.createStubInstance(CompiledAclBundle);

        beforeEach(() => {
            sinon.stub(context, 'loadBusinessNetworkRecord').resolves(businessNetworkRecord);
            sinon.stub(context, 'loadCompiledAclBundle').resolves(compiledAclBundle);
        });

        it('should load the compiled ACL bundle if not specified', () => {
            return context.findCompiledAclBundle(businessNetworkDefinition)
                .then((foundCompiledAclBundle) => {
                    sinon.assert.calledOnce(context.loadCompiledAclBundle);
                    sinon.assert.calledWith(context.loadCompiledAclBundle, businessNetworkRecord, businessNetworkDefinition);
                    foundCompiledAclBundle.should.equal(compiledAclBundle);
                });
        });

        it('should use the compiled ACL bundle in the options', () => {
            const options = {
                compiledAclBundle: sinon.createStubInstance(CompiledAclBundle)
            };
            return context.findCompiledAclBundle(businessNetworkDefinition, options)
                .then((foundCompiledAclBundle) => {
                    foundCompiledAclBundle.should.equal(options.compiledAclBundle);
                });
        });

    });

    describe('#initialize', () => {

        let mockBusinessNetworkDefinition, mockCompiledScriptBundle, mockCompiledQueryBundle, mockSystemRegistries, mockCompiledAclBundle;

        beforeEach(() => {
            mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            sinon.stub(context, 'findBusinessNetworkDefinition').resolves(mockBusinessNetworkDefinition);
            sinon.stub(context, 'findCompiledScriptBundle').resolves(mockCompiledScriptBundle);
            sinon.stub(context, 'findCompiledQueryBundle').resolves(mockCompiledQueryBundle);
            sinon.stub(context, 'findCompiledAclBundle').resolves(mockCompiledAclBundle);
            sinon.stub(context, 'loadCurrentParticipant').resolves(null);
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            mockSystemRegistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockSystemRegistries);
            sinon.stub(context, 'initializeInner').resolves();
        });

        it('should initialize the context', () => {
            const options = {};
            return context.initialize(options)
                .then(() => {
                    sinon.assert.calledOnce(context.findBusinessNetworkDefinition);
                    sinon.assert.calledWith(context.findBusinessNetworkDefinition, options);
                    sinon.assert.calledOnce(context.findCompiledScriptBundle);
                    sinon.assert.calledWith(context.findCompiledScriptBundle, mockBusinessNetworkDefinition, options);
                    sinon.assert.calledOnce(context.findCompiledQueryBundle);
                    sinon.assert.calledWith(context.findCompiledQueryBundle, mockBusinessNetworkDefinition, options);
                    sinon.assert.calledOnce(context.findCompiledAclBundle);
                    sinon.assert.calledWith(context.findCompiledAclBundle, mockBusinessNetworkDefinition, options);
                    context.businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                    context.compiledScriptBundle.should.equal(mockCompiledScriptBundle);
                    context.compiledQueryBundle.should.equal(mockCompiledQueryBundle);
                    context.compiledAclBundle.should.equal(mockCompiledAclBundle);
                    sinon.assert.calledOnce(context.loadCurrentParticipant);
                    should.equal(context.participant, null);
                    context.sysregistries.should.equal(mockSystemRegistries);
                    sinon.assert.calledOnce(context.initializeInner);
                });
        });

        it('should not initialize the context with the current participant if deploying', () => {
            return context.initialize({ function: 'init' })
                .then(() => {
                    sinon.assert.notCalled(context.loadCurrentParticipant);
                    should.equal(context.participant, null);
                });
        });

        it('should initialize the context with the current participant if found', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            context.loadCurrentParticipant.resolves(mockParticipant);
            return context.initialize()
                .then(() => {
                    context.participant.should.equal(mockParticipant);
                });
        });
        it('should  initialize the context with the correct loggingservices', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            context.loadCurrentParticipant.resolves(mockParticipant);
            let mockContainer = sinon.createStubInstance(Container);
            let mockLoggingService = sinon.createStubInstance(LoggingService);
            mockContainer.getLoggingService.returns(mockLoggingService);
            return context.initialize({ container: mockContainer })
                .then(() => {
                    context.getLoggingService().should.deep.equal(mockLoggingService);
                });
        });
        it('should not initialize the context with the current participant if reinitializing', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            context.loadCurrentParticipant.resolves(mockParticipant);
            let mockContainer = sinon.createStubInstance(Container);

            mockContainer.getLoggingService.returns();
            return context.initialize({ reinitialize: true })
                .then(() => {
                    should.equal(context.participant, null);
                });
        });

        it('should initialize the context with a specified system registries collection', () => {
            let mockSystemRegistries2 = sinon.createStubInstance(DataCollection);
            return context.initialize({ sysregistries: mockSystemRegistries2 })
                .then(() => {
                    context.sysregistries.should.equal(mockSystemRegistries2);
                });
        });

        it('should initialize the context with the specified container', () => {
            let mockContainer = sinon.createStubInstance(Container);
            return context.initialize({ container: mockContainer })
                .then(() => {
                    context.getContainer().should.equal(mockContainer);
                });
        });

        it('should initialize the context with the specified function name', () => {
            return context.initialize({ function: 'suchfunc' })
                .then(() => {
                    context.function.should.equal('suchfunc');
                });
        });

        it('should initialize the context with the original function name if no function name specified', () => {
            context.function = 'suchfunc';
            return context.initialize({})
                .then(() => {
                    context.function.should.equal('suchfunc');
                });
        });

        it('should initialize the context with the specified arguments', () => {
            return context.initialize({ arguments: ['sucharg1', 'sucharg2'] })
                .then(() => {
                    context.arguments.should.deep.equal(['sucharg1', 'sucharg2']);
                });
        });

        it('should initialize the context with the original function name if no function name specified', () => {
            context.arguments = ['sucharg1', 'sucharg2'];
            return context.initialize({})
                .then(() => {
                    context.arguments.should.deep.equal(['sucharg1', 'sucharg2']);
                });
        });

    });

    describe('#initializeInner', () => {

        it('should call _initializeInner and handle no error', () => {
            sinon.stub(context, '_initializeInner').yields(null);
            return context.initializeInner()
                .then(() => {
                    sinon.assert.calledWith(context._initializeInner);
                });
        });

        it('should call _initializeInner and handle an error', () => {
            sinon.stub(context, '_initializeInner').yields(new Error('error'));
            return context.initializeInner()
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(context._initializeInner);
                });
        });

    });

    describe('#_initializeInner', () => {

        it('should not throw', () => {
            const cb = sinon.stub();
            context._initializeInner(cb);
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, null);
        });

    });

    describe('#getServices', () => {

        it('should return all of the services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            sinon.stub(context, 'getEventService').returns(mockEventService);
            sinon.stub(context, 'getIdentityService').returns(mockIdentityService);
            sinon.stub(context, 'getHTTPService').returns(mockHTTPService);
            context.getServices().should.deep.equal([
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ]);
        });

    });

    describe('#getDataService', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getDataService();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getIdentityService', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getIdentityService();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getEventService', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getEventService();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getHTTPService', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getHTTPService();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getModelManager', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getModelManager();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks model manager', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getModelManager.returns(mockModelManager);
            context.getModelManager().should.equal(mockModelManager);
        });

    });

    describe('#getScriptManager', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getScriptManager();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks script manager', () => {
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            context.getScriptManager().should.equal(mockScriptManager);
        });

    });

    describe('#getAclManager', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getAclManager();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks ACL manager', () => {
            let mockAclManager = sinon.createStubInstance(AclManager);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getAclManager.returns(mockAclManager);
            context.getAclManager().should.equal(mockAclManager);
        });

    });

    describe('#getFactory', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getFactory();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks model manager', () => {
            let mockFactory = sinon.createStubInstance(Factory);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getFactory.returns(mockFactory);
            context.getFactory().should.equal(mockFactory);
        });

    });

    describe('#getSerializer', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getSerializer();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks model manager', () => {
            let mockSerializer = sinon.createStubInstance(Serializer);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getSerializer.returns(mockSerializer);
            context.getSerializer().should.equal(mockSerializer);
        });

    });

    describe('#getIntrospector', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getIntrospector();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the business networks model manager', () => {
            let mockIntrospector = sinon.createStubInstance(Introspector);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getIntrospector.returns(mockIntrospector);
            context.getIntrospector().should.equal(mockIntrospector);
        });

    });

    describe('#getRegistryManager', () => {

        it('should return a new registry manager', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            let mockIntrospector = sinon.createStubInstance(Introspector);
            sinon.stub(context, 'getIntrospector').returns(mockIntrospector);
            let mockSerializer = sinon.createStubInstance(Serializer);
            sinon.stub(context, 'getSerializer').returns(mockSerializer);
            let mockAccessController = sinon.createStubInstance(AccessController);
            sinon.stub(context, 'getAccessController').returns(mockAccessController);
            let mockSystemRegistries = sinon.createStubInstance(DataCollection);
            sinon.stub(context, 'getSystemRegistries').returns(mockSystemRegistries);
            let mockFactory = sinon.createStubInstance(Factory);
            sinon.stub(context, 'getFactory').returns(mockFactory);
            context.getRegistryManager().should.be.an.instanceOf(RegistryManager);
        });

        it('should return an existing registry manager', () => {
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            context.registryManager = mockRegistryManager;
            context.getRegistryManager().should.equal(mockRegistryManager);
        });

    });

    describe('#getResolver', () => {

        it('should return a new registry manager', () => {
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockIntrospector = sinon.createStubInstance(Introspector);
            sinon.stub(context, 'getIntrospector').returns(mockIntrospector);
            let mockFactory = sinon.createStubInstance(Factory);
            sinon.stub(context, 'getFactory').returns(mockFactory);
            context.getResolver().should.be.an.instanceOf(Resolver);
        });

        it('should return an existing registry manager', () => {
            let mockResolver = sinon.createStubInstance(Resolver);
            context.resolver = mockResolver;
            context.getResolver().should.equal(mockResolver);
        });

    });
    describe('#getApi', () => {

        it('should return a new API', () => {
            let mockFactory = sinon.createStubInstance(Factory);
            sinon.stub(context, 'getFactory').returns(mockFactory);
            let mockParticipant = sinon.createStubInstance(Resource);
            sinon.stub(context, 'getParticipant').returns(mockParticipant);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockEventService = sinon.createStubInstance(EventService);
            sinon.stub(context, 'getEventService').returns(mockEventService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            sinon.stub(context, 'getHTTPService').returns(mockHTTPService);
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            context.businessNetworkDefinition = mockBusinessNetworkDefinition;
            context.getApi().should.be.an.instanceOf(Api);
        });

        it('should return an existing API', () => {
            let mockApi = sinon.createStubInstance(Api);
            context.api = mockApi;
            context.getApi().should.equal(mockApi);
        });

    });

    describe('#getIdentityManager', () => {

        it('should return a new identity manager', () => {
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            sinon.stub(context, 'getIdentityService').returns(mockIdentityService);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockFactory = sinon.createStubInstance(Factory);
            sinon.stub(context, 'getFactory').returns(mockFactory);
            context.getIdentityManager().should.be.an.instanceOf(IdentityManager);
        });

        it('should return an existing registry manager', () => {
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            context.identityManager = mockIdentityManager;
            context.getIdentityManager().should.equal(mockIdentityManager);
        });

    });

    describe('#getResourceManager', () => {

        it('should return a new resource manager', () => {
            let mockSerializer = sinon.createStubInstance(Serializer);
            sinon.stub(context, 'getSerializer').returns(mockSerializer);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            sinon.stub(context, 'getIdentityService').returns(mockIdentityService);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockFactory = sinon.createStubInstance(Factory);
            sinon.stub(context, 'getFactory').returns(mockFactory);
            let mockResolver = sinon.createStubInstance(Resolver);
            sinon.stub(context,'getResolver').returns(mockResolver);
            context.getResourceManager().should.be.an.instanceOf(ResourceManager);
        });

        it('should return an existing resource manager', () => {
            let mockResourceManager = sinon.createStubInstance(ResourceManager);
            context.resourceManager = mockResourceManager;
            context.getResourceManager().should.equal(mockResourceManager);
        });

    });

    describe('#getParticipant', () => {

        it('should return the current participant', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            context.participant = mockParticipant;
            context.getParticipant().should.equal(mockParticipant);
        });

    });

    describe('#setParticipant', () => {

        it('should set the current participant and create a participant logger', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            context.setParticipant(mockParticipant);
            context.participant.should.equal(mockParticipant);
            sinon.assert.calledOnce(mockAccessController.setParticipant);
            sinon.assert.calledWith(mockAccessController.setParticipant, mockParticipant);
        });

        it('should throw if a participant has already been set', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            context.setParticipant(mockParticipant);
            (() => {
                context.setParticipant(mockParticipant);
            }).should.throw(/A current participant has already been specified/);
        });

    });

    describe('#getTransaction', () => {

        it('should return the current transaction', () => {
            let mockTransaction = sinon.createStubInstance(Resource);
            context.transaction = mockTransaction;
            context.getTransaction().should.equal(mockTransaction);
        });

    });

    describe('#setTransaction', () => {

        it('should set the current transaction and create a transaction logger', () => {
            let mockTransaction = sinon.createStubInstance(Resource);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockSerializer = sinon.createStubInstance(Serializer);
            sinon.stub(context, 'getSerializer').returns(mockSerializer);
            context.setTransaction(mockTransaction);
            context.transaction.should.equal(mockTransaction);
            context.transactionLogger.should.be.an.instanceOf(TransactionLogger);
            sinon.assert.calledOnce(mockAccessController.setTransaction);
            sinon.assert.calledWith(mockAccessController.setTransaction, mockTransaction);
        });

        it('should throw if a transaction has already been set', () => {
            let mockTransaction = sinon.createStubInstance(Resource);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockSerializer = sinon.createStubInstance(Serializer);
            sinon.stub(context, 'getSerializer').returns(mockSerializer);
            context.setTransaction(mockTransaction);
            (() => {
                context.setTransaction(mockTransaction);
            }).should.throw(/A current transaction has already been specified/);
        });

    });

    describe('#clearTransaction', () => {

        it('should clear the current transaction', () => {
            let mockTransaction = sinon.createStubInstance(Resource);
            let mockTransactionLogger = sinon.createStubInstance(TransactionLogger);
            context.transaction = mockTransaction;
            context.transactionLogger = mockTransactionLogger;
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            context.clearTransaction();
            should.equal(context.transaction, null);
            should.equal(context.transactionLogger, null);
            sinon.assert.calledOnce(mockAccessController.setTransaction);
            sinon.assert.calledWith(mockAccessController.setTransaction, null);
        });

    });

    describe('#getAccessController', () => {

        it('should return a new access controller', () => {
            let mockAclManager = sinon.createStubInstance(AclManager);
            sinon.stub(context, 'getAclManager').returns(mockAclManager);
            context.getAccessController().should.be.an.instanceOf(AccessController);
        });

        it('should return an existing query executor', () => {
            let mockAccessController = sinon.createStubInstance(AccessController);
            context.accessController = mockAccessController;
            context.getAccessController().should.equal(mockAccessController);
        });

    });

    describe('#getSystemRegistries', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getSystemRegistries();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the system registries data collection', () => {
            let mockSystemRegistries = sinon.createStubInstance(DataCollection);
            context.sysregistries = mockSystemRegistries;
            context.getSystemRegistries().should.equal(mockSystemRegistries);
        });

    });

    describe('#getEventNumber', () => {
        it('should get the current event number', () => {
            context.getEventNumber().should.equal(0);
        });
    });

    describe('#incrementEventNumber', () => {
        it('should get the incremenet current event number', () => {
            context.incrementEventNumber();
            context.getEventNumber().should.equal(1);
        });
    });

    describe('#getScriptCompiler', () => {

        it('should return a new script compiler', () => {
            context.getScriptCompiler().should.be.an.instanceOf(ScriptCompiler);
        });

        it('should return an existing script compiler', () => {
            let mockScriptCompiler = sinon.createStubInstance(ScriptCompiler);
            context.scriptCompiler = mockScriptCompiler;
            context.getScriptCompiler().should.equal(mockScriptCompiler);
        });

    });

    describe('#getCompiledScriptBundle', () => {

        it('should return the compiled script bundle', () => {
            let mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            context.compiledScriptBundle = mockCompiledScriptBundle;
            context.getCompiledScriptBundle().should.equal(mockCompiledScriptBundle);
        });

    });

    describe('#getQueryCompiler', () => {

        it('should return a new query compiler', () => {
            context.getQueryCompiler().should.be.an.instanceOf(QueryCompiler);
        });

        it('should return an existing query compiler', () => {
            let mockQueryCompiler = sinon.createStubInstance(QueryCompiler);
            context.queryCompiler = mockQueryCompiler;
            context.getQueryCompiler().should.equal(mockQueryCompiler);
        });

    });

    describe('#getCompiledQueryBundle', () => {

        it('should return the compiled query bundle', () => {
            let mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
            context.compiledQueryBundle = mockCompiledQueryBundle;
            context.getCompiledQueryBundle().should.equal(mockCompiledQueryBundle);
        });

    });

    describe('#getAclCompiler', () => {

        it('should return a new ACL compiler', () => {
            context.getAclCompiler().should.be.an.instanceOf(AclCompiler);
        });

        it('should return an existing ACL compiler', () => {
            let mockAclCompiler = sinon.createStubInstance(AclCompiler);
            context.aclCompiler = mockAclCompiler;
            context.getAclCompiler().should.equal(mockAclCompiler);
        });

    });

    describe('#getCompiledAclBundle', () => {

        it('should return the compiled query bundle', () => {
            let mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
            context.compiledAclBundle = mockCompiledAclBundle;
            context.getCompiledAclBundle().should.equal(mockCompiledAclBundle);
        });

    });

    describe('#getTransactionHandlers', () => {

        it('should return the compiled query bundle', () => {
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            let mockResourceManager = sinon.createStubInstance(ResourceManager);
            let mockNetworkManager = sinon.createStubInstance(NetworkManager);
            context.identityManager = mockIdentityManager;
            context.resourceManager = mockResourceManager;
            context.getTransactionHandlers().should.have.lengthOf(3);
            context.getTransactionHandlers().should.include(mockIdentityManager);
            context.getTransactionHandlers().should.include(mockResourceManager);
            context.getTransactionHandlers().should.include(mockNetworkManager);
        });

    });

    describe('#transactionStart', () => {

        it('should notify all services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            let services = [
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ];
            sinon.stub(context, 'getServices').returns(services);
            return context.transactionStart(true)
                .then(() => {
                    services.forEach((service) => {
                        sinon.assert.calledOnce(service.transactionStart);
                        sinon.assert.calledWith(service.transactionStart, true);
                    });
                });
        });

    });

    describe('#transactionPrepare', () => {

        it('should notify all services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            let services = [
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ];
            sinon.stub(context, 'getServices').returns(services);
            return context.transactionPrepare()
                .then(() => {
                    services.forEach((service) => {
                        sinon.assert.calledOnce(service.transactionPrepare);
                        sinon.assert.calledWith(service.transactionPrepare);
                    });
                });
        });

    });

    describe('#transactionRollback', () => {

        it('should notify all services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            let services = [
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ];
            sinon.stub(context, 'getServices').returns(services);
            return context.transactionRollback()
                .then(() => {
                    services.forEach((service) => {
                        sinon.assert.calledOnce(service.transactionRollback);
                        sinon.assert.calledWith(service.transactionRollback);
                    });
                });
        });

    });

    describe('#transactionCommit', () => {

        it('should notify all services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            let services = [
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ];
            sinon.stub(context, 'getServices').returns(services);
            return context.transactionCommit()
                .then(() => {
                    services.forEach((service) => {
                        sinon.assert.calledOnce(service.transactionCommit);
                        sinon.assert.calledWith(service.transactionCommit);
                    });
                });
        });

    });

    describe('#transactionEnd', () => {

        it('should notify all services', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockEventService = sinon.createStubInstance(EventService);
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            let mockHTTPService = sinon.createStubInstance(HTTPService);
            let services = [
                mockDataService,
                mockEventService,
                mockIdentityService,
                mockHTTPService
            ];
            sinon.stub(context, 'getServices').returns(services);
            return context.transactionEnd()
                .then(() => {
                    services.forEach((service) => {
                        sinon.assert.calledOnce(service.transactionEnd);
                        sinon.assert.calledWith(service.transactionEnd);
                    });
                });
        });

    });

});
