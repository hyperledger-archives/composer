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
const Registry = require('../lib/registry');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Registry', () => {

    let mockDataCollection;
    let mockSerializer;
    let registry;

    beforeEach(() => {
        mockDataCollection = sinon.createStubInstance(DataCollection);
        mockSerializer = sinon.createStubInstance(Serializer);
        registry = new Registry(mockDataCollection, mockSerializer, 'Asset', 'doges', 'The doges registry');
    });

    describe('#getAll', () => {

        it('should get and parse all of the resources in the registry', () => {
            mockDataCollection.getAll.resolves([{
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }, {
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }]);
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource1);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }).returns(mockResource2);
            return registry.getAll()
                .then((resources) => {
                    resources.should.all.be.an.instanceOf(Resource);
                    resources.should.deep.equal([mockResource1, mockResource2]);
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.getAll.rejects();
            return registry.getAll().should.be.rejected;
        });

    });

    describe('#get', () => {

        it('should get the specific resource in the registry', () => {
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            let mockResource = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            return registry.get('doge1')
                .then((resource) => {
                    resource.should.be.an.instanceOf(Resource);
                    resource.should.deep.equal(mockResource);
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.get.rejects();
            return registry.get('doge1').should.be.rejected;
        });

    });

    describe('#addAll', () => {

        it('should add all of the resources to the registry', () => {
            mockDataCollection.add.resolves();
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('doge1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('doge2');
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource2).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            return registry.addAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.add, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                    sinon.assert.calledWith(mockDataCollection.add, 'doge2', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge2'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockDataCollection.add.rejects();
            return registry.addAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#add', () => {

        it('should add the resource to the registry', () => {
            mockDataCollection.add.resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return registry.add(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.add, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockDataCollection.add.rejects();
            return registry.add(mockResource).should.be.rejected;
        });

    });

    describe('#updateAll', () => {

        it('should update all of the resources to the registry', () => {
            mockDataCollection.update.resolves();
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('doge1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('doge2');
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource2).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            return registry.updateAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                    sinon.assert.calledWith(mockDataCollection.update, 'doge2', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge2'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockDataCollection.update.rejects();
            return registry.updateAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#update', () => {

        it('should update the resource in the registry', () => {
            mockDataCollection.update.resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return registry.update(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockDataCollection.update.rejects();
            return registry.update(mockResource).should.be.rejected;
        });

    });

    describe('#removeAll', () => {

        it('should remove all of the resources from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            return registry.removeAll([mockResource, 'doge2'])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge2');
                });
        });

        it('should return errors from the data service', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            let mockResource2 = sinon.createStubInstance(Resource);
            mockDataCollection.remove.rejects();
            return registry.removeAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#remove', () => {

        it('should remove the resource by instance from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            return registry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                });
        });

        it('should remove the resource by ID from the registry', () => {
            mockDataCollection.remove.resolves();
            return registry.remove('doge1')
                    .then(() => {
                        sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    });
        });

        it('should return errors from the data service', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            mockDataCollection.remove.rejects();
            return registry.remove(mockResource).should.be.rejected;
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            registry.toJSON().should.deep.equal({
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            });
        });

    });

});
