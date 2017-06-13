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

const AccessController = require('../lib/accesscontroller');
const AclManager = require('composer-common').AclManager;
const Api = require('../lib/api');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const CompiledScriptBundle = require('../lib/compiledscriptbundle');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const EventService = require('../lib/eventservice');
const HTTPService = require('../lib/httpservice');
const Factory = require('composer-common').Factory;
const IdentityManager = require('../lib/identitymanager');
const IdentityService = require('../lib/identityservice');
const Introspector = require('composer-common').Introspector;
const ModelManager = require('composer-common').ModelManager;
const QueryExecutor = require('../lib/queryexecutor');
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const ScriptCompiler = require('../lib/scriptcompiler');
const ScriptManager = require('composer-common').ScriptManager;
const Serializer = require('composer-common').Serializer;
const TransactionLogger = require('../lib/transactionlogger');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

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

    describe('#loadCurrentParticipant', () => {

        it('should return null if no identity is specified', () => {
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            sandbox.stub(context, 'getIdentityService').returns(mockIdentityService);
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            sandbox.stub(context, 'getIdentityManager').returns(mockIdentityManager);
            mockIdentityService.getCurrentUserID.returns(null);
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockIdentityManager.getParticipant.withArgs('dogeid1').resolves(mockParticipant);
            return context.loadCurrentParticipant()
                .should.eventually.be.equal(null);
        });

        it('should load the current participant if an identity is specified', () => {
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            sandbox.stub(context, 'getIdentityService').returns(mockIdentityService);
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            sandbox.stub(context, 'getIdentityManager').returns(mockIdentityManager);
            mockIdentityService.getCurrentUserID.returns('dogeid1');
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockIdentityManager.getParticipant.withArgs('dogeid1').resolves(mockParticipant);
            return context.loadCurrentParticipant()
                .should.eventually.be.equal(mockParticipant);
        });

        it('should throw an error if an invalid identity is specified', () => {
            let mockIdentityService = sinon.createStubInstance(IdentityService);
            sandbox.stub(context, 'getIdentityService').returns(mockIdentityService);
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            sandbox.stub(context, 'getIdentityManager').returns(mockIdentityManager);
            mockIdentityService.getCurrentUserID.returns('dogeid1');
            mockIdentityManager.getParticipant.withArgs('dogeid1').rejects(new Error('no such participant'));
            return context.loadCurrentParticipant()
                .should.be.rejectedWith(/The identity may be invalid or may have been revoked/);
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

    describe('#initialize', () => {

        let mockBusinessNetworkDefinition, mockCompiledScriptBundle, mockSystemRegistries, mockSystemIdentities;

        beforeEach(() => {
            mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            mockCompiledScriptBundle = sinon.createStubInstance(CompiledScriptBundle);
            sinon.stub(context, 'findBusinessNetworkDefinition').resolves(mockBusinessNetworkDefinition);
            sinon.stub(context, 'findCompiledScriptBundle').resolves(mockCompiledScriptBundle);
            sinon.stub(context, 'loadCurrentParticipant').resolves(null);
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            mockSystemRegistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockSystemRegistries);
            mockSystemIdentities = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysidentities').resolves(mockSystemIdentities);
        });

        it('should initialize the context', () => {
            const options = {};
            return context.initialize(options)
                .then(() => {
                    sinon.assert.calledOnce(context.findBusinessNetworkDefinition);
                    sinon.assert.calledWith(context.findBusinessNetworkDefinition, options);
                    sinon.assert.calledOnce(context.findCompiledScriptBundle);
                    sinon.assert.calledWith(context.findCompiledScriptBundle, mockBusinessNetworkDefinition, options);
                    context.businessNetworkDefinition.should.equal(mockBusinessNetworkDefinition);
                    context.compiledScriptBundle.should.equal(mockCompiledScriptBundle);
                    sinon.assert.calledOnce(context.loadCurrentParticipant);
                    should.equal(context.participant, null);
                    context.sysregistries.should.equal(mockSystemRegistries);
                    context.sysidentities.should.equal(mockSystemIdentities);
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

        it('should not initialize the context with the current participant if reinitializing', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            context.loadCurrentParticipant.resolves(mockParticipant);
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

        it('should initialize the context with a specified system identities collection', () => {
            let mockSystemIdentities2 = sinon.createStubInstance(DataCollection);
            return context.initialize({ sysidentities: mockSystemIdentities2 })
                .then(() => {
                    context.sysidentities.should.equal(mockSystemIdentities2);
                });
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
            context.businessNetworkDefinition = mockBusinessNetworkDefinition;
            context.getApi().should.be.an.instanceOf(Api);
        });

        it('should return an existing API', () => {
            let mockApi = sinon.createStubInstance(Api);
            context.api = mockApi;
            context.getApi().should.equal(mockApi);
        });

    });

    describe('#getQueryExecutor', () => {

        it('should return a new query executor', () => {
            let mockResolver = sinon.createStubInstance(Resolver);
            sinon.stub(context, 'getResolver').returns(mockResolver);
            context.getQueryExecutor().should.be.an.instanceOf(QueryExecutor);
        });

        it('should return an existing query executor', () => {
            let mockQueryExecutor = sinon.createStubInstance(QueryExecutor);
            context.queryExecutor = mockQueryExecutor;
            context.getQueryExecutor().should.equal(mockQueryExecutor);
        });

    });

    describe('#getIdentityManager', () => {

        it('should return a new identity manager', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            sinon.stub(context, 'getRegistryManager').returns(mockRegistryManager);
            let mockSystemIdentities = sinon.createStubInstance(DataCollection);
            sinon.stub(context, 'getSystemIdentities').returns(mockSystemIdentities);
            context.getIdentityManager().should.be.an.instanceOf(IdentityManager);
        });

        it('should return an existing registry manager', () => {
            let mockIdentityManager = sinon.createStubInstance(IdentityManager);
            context.identityManager = mockIdentityManager;
            context.getIdentityManager().should.equal(mockIdentityManager);
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

    describe('#getSystemIdentities', () => {

        it('should throw if not initialized', () => {
            (() => {
                context.getSystemIdentities();
            }).should.throw(/must call initialize before calling this function/);
        });

        it('should return the system identities data collection', () => {
            let mockSystemIdentities = sinon.createStubInstance(DataCollection);
            context.sysidentities = mockSystemIdentities;
            context.getSystemIdentities().should.equal(mockSystemIdentities);
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

        it('should return an existing registry manager', () => {
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

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            context.toJSON().should.deep.equal({});
        });

    });

});
