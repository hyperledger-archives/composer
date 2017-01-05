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
const EventEmitter = require('events');
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

    describe('#constructor', () => {

        it('should be an event emitter', () => {
            registry.should.be.an.instanceOf(EventEmitter);
        });

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

    describe('#exists', () => {

        it('should determine whether a specific resource exists in the registry', () => {
            mockDataCollection.exists.withArgs('doge1').resolves(true);
            return registry.exists('doge1')
                .then((exists) => {
                    exists.should.equal.true;
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.exists.rejects();
            return registry.exists('doge1').should.be.rejected;
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
            let mockEventHandler = sinon.stub();
            registry.on('resourceadded', mockEventHandler);
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
                    sinon.assert.calledTwice(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resource: mockResource1
                    });
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resource: mockResource2
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
            let mockEventHandler = sinon.stub();
            registry.on('resourceadded', mockEventHandler);
            return registry.add(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.add, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resource: mockResource
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
            let mockOldResource1 = sinon.createStubInstance(Resource);
            mockOldResource1.getIdentifier.returns('doge1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('doge2');
            let mockOldResource2 = sinon.createStubInstance(Resource);
            mockOldResource2.getIdentifier.returns('doge2');
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockSerializer.toJSON.withArgs(mockResource2).onSecondCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            sinon.stub(registry, 'get');
            registry.get.withArgs('doge1').resolves(mockOldResource1);
            registry.get.withArgs('doge2').resolves(mockOldResource2);
            let mockEventHandler = sinon.stub();
            registry.on('resourceupdated', mockEventHandler);
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
                    sinon.assert.calledTwice(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        oldResource: mockOldResource1,
                        newResource: mockResource1
                    });
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        oldResource: mockOldResource2,
                        newResource: mockResource2
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('doge1');
            let mockOldResource1 = sinon.createStubInstance(Resource);
            mockOldResource1.getIdentifier.returns('doge1');
            let mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('doge2');
            let mockOldResource2 = sinon.createStubInstance(Resource);
            mockOldResource2.getIdentifier.returns('doge2');
            sinon.stub(registry, 'get');
            registry.get.withArgs('doge1').resolves(mockOldResource1);
            registry.get.withArgs('doge2').resolves(mockOldResource2);
            mockDataCollection.update.rejects();
            return registry.updateAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#update', () => {

        it('should update the resource in the registry', () => {
            mockDataCollection.update.resolves();
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            let mockOldResource = sinon.createStubInstance(Resource);
            mockOldResource.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            sinon.stub(registry, 'get').withArgs('doge1').resolves(mockOldResource);
            let mockEventHandler = sinon.stub();
            registry.on('resourceupdated', mockEventHandler);
            return registry.update(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1'
                    });
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        oldResource: mockOldResource,
                        newResource: mockResource
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            let mockOldResource = sinon.createStubInstance(Resource);
            mockOldResource.getIdentifier.returns('doge1');
            sinon.stub(registry, 'get').withArgs('doge1').resolves(mockOldResource);
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
            let mockEventHandler = sinon.stub();
            registry.on('resourceremoved', mockEventHandler);
            return registry.removeAll([mockResource, 'doge2'])
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge2');
                    sinon.assert.calledTwice(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resourceID: 'doge1'
                    });
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resourceID: 'doge2'
                    });
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
            let mockEventHandler = sinon.stub();
            registry.on('resourceremoved', mockEventHandler);
            return registry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resourceID: 'doge1'
                    });
                });
        });

        it('should remove the resource by ID from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceremoved', mockEventHandler);
            return registry.remove('doge1')
                .then(() => {
                    sinon.assert.calledWith(mockDataCollection.remove, 'doge1');
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        resourceID: 'doge1'
                    });
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
