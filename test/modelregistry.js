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

const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('../lib/modelregistry');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('ModelRegistry', () => {

    let mockDataCollection;
    let mockDataService;
    let mockModelManager;
    let modelRegistry;
    let sandbox;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockDataCollection = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.withArgs('$sysmodels').resolves(mockDataCollection);
        mockModelManager = sinon.createStubInstance(ModelManager);
        modelRegistry = new ModelRegistry(mockDataService, mockModelManager);
        sandbox = sinon.sandbox.create();
        sandbox.stub(ModelFile, 'fromJSON');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAll', () => {

        it('should get and parse all of the resources in the registry', () => {
            mockDataCollection.getAll.resolves([{
                definitions: 'namespace org.acme.test1'
            }, {
                definitions: 'namespace org.acme.test2'
            }]);
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            ModelFile.fromJSON.withArgs(mockModelManager, {
                definitions: 'namespace org.acme.test1'
            }).returns(mockModelFile1);
            ModelFile.fromJSON.withArgs(mockModelManager, {
                definitions: 'namespace org.acme.test2'
            }).returns(mockModelFile2);
            return modelRegistry.getAll()
                .then((resources) => {
                    resources.should.all.be.an.instanceOf(ModelFile);
                    resources.should.deep.equal([mockModelFile1, mockModelFile2]);
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.getAll.rejects();
            return modelRegistry.getAll().should.be.rejected;
        });

    });

    describe('#get', () => {

        it('should get the specific resource in the registry', () => {
            mockDataCollection.get.withArgs('doge1').resolves({
                definitions: 'namespace org.acme.test1'
            });
            let mockModelFile = sinon.createStubInstance(ModelFile);
            ModelFile.fromJSON.withArgs(mockModelManager, {
                definitions: 'namespace org.acme.test1'
            }).returns(mockModelFile);
            return modelRegistry.get('doge1')
                .then((resource) => {
                    resource.should.be.an.instanceOf(ModelFile);
                    resource.should.deep.equal(mockModelFile);
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.get.rejects();
            return modelRegistry.get('doge1').should.be.rejected;
        });

    });

    describe('#addAll', () => {

        it('should add all of the resources to the registry', () => {
            mockDataCollection.add.resolves();
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            mockModelFile1.getNamespace.returns('doge1');
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockModelFile2.getNamespace.returns('doge2');
            mockModelFile1.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            mockModelFile2.toJSON.returns({
                definitions: 'namespace org.acme.test2'
            });
            return modelRegistry.addAll([mockModelFile1, mockModelFile2])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.add, 'doge1', {
                        definitions: 'namespace org.acme.test1'
                    });
                    sinon.assert.calledWith(mockDataCollection.add, 'doge2', {
                        definitions: 'namespace org.acme.test2'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockDataCollection.add.rejects();
            return modelRegistry.addAll([mockModelFile1, mockModelFile2]).should.be.rejected;
        });

    });

    describe('#add', () => {

        it('should add the resource to the registry', () => {
            mockDataCollection.add.resolves();
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('doge1');
            mockModelFile.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            return modelRegistry.add(mockModelFile)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.add, 'doge1', {
                        definitions: 'namespace org.acme.test1'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockDataCollection.add.rejects();
            return modelRegistry.add(mockModelFile).should.be.rejected;
        });

    });

    describe('#updateAll', () => {

        it('should update all of the resources to the registry', () => {
            mockDataCollection.update.resolves();
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            mockModelFile1.getNamespace.returns('doge1');
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockModelFile2.getNamespace.returns('doge2');
            mockModelFile1.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            mockModelFile2.toJSON.returns({
                definitions: 'namespace org.acme.test2'
            });
            return modelRegistry.updateAll([mockModelFile1, mockModelFile2])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        definitions: 'namespace org.acme.test1'
                    });
                    sinon.assert.calledWith(mockDataCollection.update, 'doge2', {
                        definitions: 'namespace org.acme.test2'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockDataCollection.update.rejects();
            return modelRegistry.updateAll([mockModelFile1, mockModelFile2]).should.be.rejected;
        });

    });

    describe('#update', () => {

        it('should update the resource in the registry', () => {
            mockDataCollection.update.resolves();
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('doge1');
            mockModelFile.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            return modelRegistry.update(mockModelFile)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        definitions: 'namespace org.acme.test1'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockDataCollection.update.rejects();
            return modelRegistry.update(mockModelFile).should.be.rejected;
        });

    });

    describe('#removeAll', () => {

        it('should remove all of the resources from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('doge1');
            mockModelFile.toJSON.returns({
                definitions: 'namespace org.acme.test1'
            });
            return modelRegistry.removeAll([mockModelFile, 'doge2'])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge2');
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockDataCollection.remove.rejects();
            return modelRegistry.removeAll([mockModelFile1, mockModelFile2]).should.be.rejected;
        });

    });

    describe('#remove', () => {

        it('should remove the resource by instance from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('doge1');
            return modelRegistry.remove(mockModelFile)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                });
        });

        it('should remove the resource by ID from the registry', () => {
            mockDataCollection.remove.resolves();
            return modelRegistry.remove('doge1')
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                });
        });

        it('should return errors from the data service', () => {
            let mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('doge1');
            mockDataCollection.remove.rejects();
            return modelRegistry.remove(mockModelFile).should.be.rejected;
        });

    });

});
