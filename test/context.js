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

const Context = require('../lib/context');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('../lib/modelregistry');
const RegistryManager = require('../lib/registrymanager');
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

require('chai').should();
const sinon = require('sinon');
require('sinon-as-promised');

describe('Context', () => {

    let mockEngine;
    let context;

    beforeEach(() => {
        mockEngine = sinon.createStubInstance(Engine);
        context = new Context(mockEngine);
    });

    describe('#constructor', () => {

        it('should store the engine', () => {
            context.engine.should.equal(mockEngine);
        });

    });

    describe('#initialize', () => {

        it('should load all of the model files from the model registry into the model manager', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            let mockModelRegistry = sinon.createStubInstance(ModelRegistry);
            sinon.stub(context, 'getModelManager').returns(mockModelManager);
            sinon.stub(context, 'getModelRegistry').returns(mockModelRegistry);
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockModelRegistry.getAll.resolves([mockModelFile1, mockModelFile2]);
            return context.initialize()
                .then(() => {
                    sinon.assert.calledTwice(mockModelManager.addModelFile);
                    sinon.assert.calledWith(mockModelManager.addModelFile, mockModelFile1);
                    sinon.assert.calledWith(mockModelManager.addModelFile, mockModelFile2);
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

        it('should return a new model manager', () => {
            context.getModelManager().should.be.an.instanceOf(ModelManager);
        });

        it('should return an existing model manager', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            context.modelManager = mockModelManager;
            context.getModelManager().should.equal(mockModelManager);
        });

    });

    describe('#getModelRegistry', () => {

        it('should return a new model registry', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            context.getModelRegistry().should.be.an.instanceOf(ModelRegistry);
        });

        it('should return an existing model manager', () => {
            let mockModelRegistry = sinon.createStubInstance(ModelRegistry);
            context.modelRegistry = mockModelRegistry;
            context.getModelRegistry().should.equal(mockModelRegistry);
        });

    });

    describe('#getFactory', () => {

        it('should return a new factory', () => {
            context.getFactory().should.be.an.instanceOf(Factory);
        });

        it('should return an existing factory', () => {
            let mockFactory = sinon.createStubInstance(Factory);
            context.factory = mockFactory;
            context.getFactory().should.equal(mockFactory);
        });

    });

    describe('#getSerializer', () => {

        it('should return a new serializer', () => {
            context.getSerializer().should.be.an.instanceOf(Serializer);
        });

        it('should return an existing serializer', () => {
            let mockSerializer = sinon.createStubInstance(Serializer);
            context.serializer = mockSerializer;
            context.getSerializer().should.equal(mockSerializer);
        });

    });

    describe('#getRegistryManager', () => {

        it('should return a new registry manager', () => {
            let mockDataService = sinon.createStubInstance(DataService);
            sinon.stub(context, 'getDataService').returns(mockDataService);
            context.getRegistryManager().should.be.an.instanceOf(RegistryManager);
        });

        it('should return an existing registry manager', () => {
            let mockRegistryManager = sinon.createStubInstance(RegistryManager);
            context.registryManager = mockRegistryManager;
            context.getRegistryManager().should.equal(mockRegistryManager);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            context.toJSON().should.deep.equal({});
        });

    });

});
