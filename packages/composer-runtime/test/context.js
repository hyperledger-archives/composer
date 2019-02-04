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
const InstalledBusinessNetwork = require('../lib/installedbusinessnetwork');
const Introspector = require('composer-common').Introspector;
const QueryCompiler = require('../lib/querycompiler');
const RegistryManager = require('../lib/registrymanager');
const ResourceManager = require('../lib/resourcemanager');
const NetworkManager = require('../lib/networkmanager');
const Resolver = require('../lib/resolver');
const Resource = require('composer-common').Resource;
const Serializer = require('composer-common').Serializer;
const TransactionLogger = require('../lib/transactionlogger');
const LoggingService = require('../lib/loggingservice');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('Context', () => {
    const sandbox = sinon.sandbox.create();
    let mockEngine;
    let testNetworkDefinition;
    let context;

    beforeEach(() => {
        mockEngine = sinon.createStubInstance(Engine);
        testNetworkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
        return InstalledBusinessNetwork.newInstance(testNetworkDefinition)
            .then(installedBusinessNetwork => {
                context = new Context(mockEngine, installedBusinessNetwork);
            });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should throw if no business network provided', () => {
            (() => {
                new Context(mockEngine);
            }).should.throw(/No business network/i);
        });

        it('should disable historian if InstalledBusinessNetwork says disabled', () => {
            const mockInstalledBusinessNetwork = sinon.createStubInstance(InstalledBusinessNetwork);
            mockInstalledBusinessNetwork.historianEnabled = false;
            context = new Context(mockEngine, mockInstalledBusinessNetwork);
            context.historianEnabled.should.be.false;
        });

        it('should enable historian if InstalledBusinessNetwork says enabled', () => {
            const mockInstalledBusinessNetwork = sinon.createStubInstance(InstalledBusinessNetwork);
            mockInstalledBusinessNetwork.historianEnabled = true;
            context = new Context(mockEngine, mockInstalledBusinessNetwork);
            context.historianEnabled.should.be.true;
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

    describe('#initialize', () => {

        let mockSystemRegistries;

        beforeEach(() => {
            sinon.stub(context, 'loadCurrentParticipant').resolves(null);
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            mockSystemRegistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockSystemRegistries);
            sinon.stub(context, 'initializeInner').resolves();
        });

        it('should not initialize the context with the current participant if deploying', () => {
            return context.initialize({ function: 'init' })
                .then(() => {
                    sinon.assert.notCalled(context.loadCurrentParticipant);
                    should.not.exist(context.participant);
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

        it('should initialize the context with the runtime serializer defaults', () => {
            let mockContainer = sinon.createStubInstance(Container);
            return context.initialize({ container: mockContainer })
                .then(() => {
                    context.getSerializer().defaultOptions.should.deep.equal({ permitResourcesForRelationships: true, validate: true });
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
        it('should return the business networks model manager', () => {
            context.getModelManager().should.equal(testNetworkDefinition.getModelManager());
        });
    });

    describe('#getScriptManager', () => {
        it('should return the business networks script manager', () => {
            context.getScriptManager().should.equal(testNetworkDefinition.getScriptManager());
        });
    });

    describe('#getAclManager', () => {
        it('should return the business networks ACL manager', () => {
            context.getAclManager().should.equal(testNetworkDefinition.getAclManager());
        });
    });

    describe('#getFactory', () => {
        it('should return the business networks model manager', () => {
            context.getFactory().should.equal(testNetworkDefinition.getFactory());
        });
    });

    describe('#getSerializer', () => {
        it('should return the business networks model manager', () => {
            context.getSerializer().should.equal(testNetworkDefinition.getSerializer());
        });
    });

    describe('#getIntrospector', () => {
        it('should return the business networks model manager', () => {
            context.getIntrospector().should.equal(testNetworkDefinition.getIntrospector());
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

    describe('#getCompiledScriptBundle', () => {

        it('should return the compiled script bundle', () => {
            context.getCompiledScriptBundle().should.be.an.instanceOf(CompiledScriptBundle);
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
            context.getCompiledQueryBundle().should.be.an.instanceOf(CompiledQueryBundle);
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

        it('should return the compiled acl bundle', () => {
            context.getCompiledAclBundle().should.be.an.instanceOf(CompiledAclBundle);
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

    describe('#getNativeAPI', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getNativeAPI();
            }).should.throw(/abstract function called/);
        });
    });

    describe('#getBusinessNetworkDefinition', () => {
        it('should return business network', () => {
            context.getBusinessNetworkDefinition().should.equal(testNetworkDefinition);
        });
    });

    describe('#getBusinessNetworkArchive', () => {
        it('should return business network archive', () => {
            const archive = context.getBusinessNetworkArchive();
            return BusinessNetworkDefinition.fromArchive(archive).should.be.fulfilled;
        });
    });

    describe('#getContextId', () => {
        it('should return an auto generated contextId', () => {
            const id = context.getContextId();
            id.should.be.a('string');
        });
    });


    describe('#setContextId', () => {
        it('should return an the given contextId', () => {
            context.setContextId('myContext');
            const id = context.getContextId();
            id.should.equal('myContext');
        });
    });


});
