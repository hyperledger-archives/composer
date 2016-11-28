/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const Factory = require('@ibm/ibm-concerto-common').Factory;
const Introspector = require('@ibm/ibm-concerto-common').Introspector;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const RegistryManager = require('../lib/registrymanager');
const Resolver = require('../lib/resolver');
const ScriptManager = require('@ibm/ibm-concerto-common').ScriptManager;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

require('chai').should();
const sinon = require('sinon');
require('sinon-as-promised');

describe('Context', () => {

    let mockEngine;
    let context;
    let sandbox;

    beforeEach(() => {
        mockEngine = sinon.createStubInstance(Engine);
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

    describe('#initialize', () => {

        it('should load the business network', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(mockDataCollection);
            mockDataCollection.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=' });
            sandbox.stub(context, 'getDataService').returns(mockDataService);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            return context.initialize()
                .then(() => {
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, sinon.match((archive) => {
                        return archive.compare(Buffer.from('hello world')) === 0;
                    }));
                });
        });

    });

    describe('#getDataService', () => {

        it('should throw as abstract method', () => {
            (() => {
                context.getDataService();
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

        it('should return the business networks model manager', () => {
            let mockScriptManager = sinon.createStubInstance(ScriptManager);
            context.businessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
            context.businessNetworkDefinition.getScriptManager.returns(mockScriptManager);
            context.getScriptManager().should.equal(mockScriptManager);
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
            context.getResolver().should.be.an.instanceOf(Resolver);
        });

        it('should return an existing registry manager', () => {
            let mockResolver = sinon.createStubInstance(Resolver);
            context.resolver = mockResolver;
            context.getResolver().should.equal(mockResolver);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            context.toJSON().should.deep.equal({});
        });

    });

});
