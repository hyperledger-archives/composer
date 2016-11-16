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

const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const ModelRegistry = require('../lib/modelregistry');
const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineModels', () => {

    let mockContainer;
    let mockContext;
    let mockModelRegistry;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockModelRegistry = sinon.createStubInstance(ModelRegistry);
        mockContext.getModelRegistry.returns(mockModelRegistry);
        engine = new Engine(mockContainer);
    });

    describe('#getAllModelsInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getAllModelsInRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getAllModelsInRegistry", expecting "\[\]"/);
        });

        it('should return all of the models', () => {
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockModelRegistry.getAll.withArgs().resolves([mockModelFile1, mockModelFile2]);
            mockModelFile1.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            mockModelFile2.toJSON.returns({
                definitions: 'namespace org.acme.test2'
            });
            return engine.invoke(mockContext, 'getAllModelsInRegistry', [])
                .then((modelFiles) => {
                    modelFiles.should.deep.equal([{
                        definitions: 'namespace org.acme.test1'
                    }, {
                        definitions: 'namespace org.acme.test2'
                    }]);
                });
        });

    });

    describe('#getModelInRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getModelInRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getModelInRegistry", expecting "\["namespace"\]"/);
        });

        it('should return the specified resources', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelRegistry.get.withArgs('doge1').resolves(mockModelFile);
            mockModelFile.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            return engine.invoke(mockContext, 'getModelInRegistry', ['doge1'])
                .then((modelFile) => {
                    modelFile.should.deep.equal({
                        definitions: 'namespace org.acme.test1'
                    });
                });
        });

    });

});
