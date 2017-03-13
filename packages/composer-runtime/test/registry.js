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
const AccessException = require('../lib/accessexception');
const DataCollection = require('../lib/datacollection');
const EventEmitter = require('events');
const Registry = require('../lib/registry');
const Resource = require('composer-common').Resource;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Registry', () => {

    let mockDataCollection;
    let mockSerializer;
    let mockAccessController;
    let mockParticipant;
    let registry;

    beforeEach(() => {
        mockDataCollection = sinon.createStubInstance(DataCollection);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockAccessController = sinon.createStubInstance(AccessController);
        mockParticipant = sinon.createStubInstance(Resource);
        registry = new Registry(mockDataCollection, mockSerializer, mockAccessController, 'Asset', 'doges', 'The doges registry');
    });

    describe('#constructor', () => {

        it('should be an event emitter', () => {
            registry.should.be.an.instanceOf(EventEmitter);
        });

    });

    describe('#getAll', () => {

        let mockResource1, mockResource2;

        beforeEach(() => {
            mockDataCollection.getAll.resolves([{
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }, {
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }]);
            mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.theValue = 'the value 1';
            mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.theValue = 'the value 2';
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource1);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }).returns(mockResource2);
        });

        it('should get and parse all of the resources in the registry', () => {
            return registry.getAll()
                .then((resources) => {
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.all.be.an.instanceOf(Resource);
                    resources.should.deep.equal([mockResource1, mockResource2]);
                });
        });

        it('should not throw or leak information about resources that cannot be accessed', () => {
            mockAccessController.check.withArgs(mockResource2, 'READ').throws(new AccessException(mockResource2, 'READ', mockParticipant));
            return registry.getAll()
                .then((resources) => {
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.all.be.an.instanceOf(Resource);
                    resources.should.deep.equal([mockResource1]);
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.getAll.rejects();
            return registry.getAll().should.be.rejected;
        });

    });

    describe('#get', () => {

        let mockResource;

        beforeEach(() => {
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockResource = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
        });

        it('should get the specific resource in the registry', () => {
            return registry.get('doge1')
                .then((resource) => {
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource, 'READ');
                    resource.should.be.an.instanceOf(Resource);
                    resource.should.deep.equal(mockResource);
                });
        });

        it('should not throw or leak information about resources that cannot be accessed', () => {
            mockAccessController.check.withArgs(mockResource, 'READ').throws(new AccessException(mockResource, 'READ', mockParticipant));
            return registry.get('doge1')
                .should.be.rejectedWith(/does not exist/);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.get.withArgs('doge1').rejects();
            return registry.get('doge1').should.be.rejected;
        });

    });

    describe('#exists', () => {

        let mockResource;

        beforeEach(() => {
            mockDataCollection.exists.withArgs('doge1').resolves(true);
            mockDataCollection.exists.withArgs('doge2').resolves(false);
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockResource = sinon.createStubInstance(Resource);
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
        });

        it('should determine whether a specific resource exists in the registry', () => {
            return registry.exists('doge1')
                .then((exists) => {
                    exists.should.equal.true;
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource, 'READ');
                });
        });

        it('should determine whether a specific resource does not exist in the registry', () => {
            return registry.exists('doge2')
                .then((exists) => {
                    exists.should.equal.false;
                });
        });

        it('should not throw or leak information about resources that cannot be accessed', () => {
            mockAccessController.check.withArgs(mockResource, 'READ').throws(new AccessException(mockResource, 'READ', mockParticipant));
            return registry.exists('doge1')
                .should.eventually.equal(false)
                .then(() => {
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource, 'READ');
                });
        });

        it('should return errors from the data service', () => {
            mockDataCollection.exists.withArgs('doge1').rejects();
            return registry.exists('doge1').should.be.rejected;
        });

    });

    describe('#addAll', () => {

        let mockResource1, mockResource2;

        beforeEach(() => {
            // New resources.
            mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.theValue = 'the value 1';
            mockResource1.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.theValue = 'the value 2';
            mockResource2.getIdentifier.returns('doge2');
            mockSerializer.toJSON.withArgs(mockResource2).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
        });

        it('should add all of the resources to the registry', () => {
            mockDataCollection.add.resolves();
            // End of resources.
            let mockEventHandler = sinon.stub();
            registry.on('resourceadded', mockEventHandler);
            return registry.addAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'CREATE');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'CREATE');
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

        it('should throw if the access controller throws an exception', () => {
            mockDataCollection.add.resolves();
            // End of resources.
            mockAccessController.check.withArgs(mockResource2, 'CREATE').throws(new AccessException(mockResource2, 'CREATE', mockParticipant));
            return registry.addAll([mockResource1, mockResource2])
                .should.be.rejectedWith(AccessException);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.add.rejects();
            return registry.addAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#add', () => {

        let mockResource;

        beforeEach(() => {
            // New resources.
            mockResource = sinon.createStubInstance(Resource);
            mockResource.theValue = 'the value 1';
            mockResource.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
        });

        it('should add the resource to the registry', () => {
            mockDataCollection.add.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceadded', mockEventHandler);
            return registry.add(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource, 'CREATE');
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

        it('should throw if the access controller throws an exception', () => {
            mockAccessController.check.withArgs(mockResource, 'CREATE').throws(new AccessException(mockResource, 'CREATE', mockParticipant));
            mockDataCollection.add.resolves();
            (() => {
                registry.add(mockResource);
            }).should.throw(AccessException);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.add.rejects();
            return registry.add(mockResource).should.be.rejected;
        });

    });

    describe('#updateAll', () => {

        let mockResource1, mockResource2;
        let mockOldResource1, mockOldResource2;

        beforeEach(() => {
            // New resources.
            mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.getIdentifier.returns('doge1');
            mockResource1.theValue = 'newValue1';
            mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.getIdentifier.returns('doge2');
            mockResource2.theValue = 'newValue2';
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                theValue: 'newValue1'
            });
            mockSerializer.toJSON.withArgs(mockResource2).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge2',
                theValue: 'newValue2'
            });
            // Old resources.
            mockOldResource1 = sinon.createStubInstance(Resource);
            mockOldResource1.getIdentifier.returns('doge1');
            mockOldResource1.theValue = 'oldValue1';
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                theValue: 'oldValue1'
            });
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                theValue: 'oldValue1'
            }).returns(mockOldResource1);
            mockOldResource2 = sinon.createStubInstance(Resource);
            mockOldResource2.getIdentifier.returns('doge2');
            mockOldResource2.theValue = 'oldValue2';
            mockDataCollection.get.withArgs('doge2').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge2',
                theValue: 'oldValue2'
            });
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2',
                theValue: 'oldValue2'
            }).returns(mockOldResource2);
        });

        it('should update all of the resources to the registry', () => {
            mockDataCollection.update.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceupdated', mockEventHandler);
            return registry.updateAll([mockResource1, mockResource2])
                .then(() => {
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockOldResource1, 'UPDATE');
                    sinon.assert.calledWith(mockAccessController.check, mockOldResource2, 'UPDATE');
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1',
                        theValue: 'newValue1'
                    });
                    sinon.assert.calledWith(mockDataCollection.update, 'doge2', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge2',
                        theValue: 'newValue2'
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

        it('should throw if the access controller throws an exception', () => {
            mockAccessController.check.withArgs(mockOldResource2, 'UPDATE').throws(new AccessException(mockOldResource2, 'UPDATE', mockParticipant));
            mockDataCollection.update.resolves();
            return registry.updateAll([mockResource1, mockResource2])
                .should.be.rejectedWith(AccessException);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.update.rejects();
            return registry.updateAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#update', () => {

        let mockResource, mockOldResource;

        beforeEach(() => {
            // New resources.
            mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('doge1');
            mockResource.theValue = 'newValue';
            mockSerializer.toJSON.withArgs(mockResource).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                newValue: 'newValue'
            });
            // Old resources.
            mockOldResource = sinon.createStubInstance(Resource);
            mockOldResource.getIdentifier.returns('doge1');
            mockOldResource.theValue = 'oldValue';
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                newValue: 'oldValue'
            });
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1',
                newValue: 'oldValue'
            }).returns(mockOldResource);
        });

        it('should update the resource in the registry', () => {
            mockDataCollection.update.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceupdated', mockEventHandler);
            return registry.update(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockOldResource, 'UPDATE');
                    sinon.assert.calledWith(mockDataCollection.update, 'doge1', {
                        $class: 'org.doge.Doge',
                        assetId: 'doge1',
                        newValue: 'newValue'
                    });
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, {
                        registry: registry,
                        oldResource: mockOldResource,
                        newResource: mockResource
                    });
                });
        });

        it('should throw if the access controller throws an exception', () => {
            mockAccessController.check.withArgs(mockOldResource, 'UPDATE').throws(new AccessException(mockOldResource, 'UPDATE', mockParticipant));
            mockDataCollection.update.resolves();
            return registry.update(mockResource)
                .should.be.rejectedWith(AccessException);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.update.rejects();
            return registry.update(mockResource).should.be.rejected;
        });

    });

    describe('#removeAll', () => {

        let mockResource1, mockResource2;

        beforeEach(() => {
            // Old resources.
            // Deleting a resource by ID currently requires that we read it from the registry.
            mockResource1 = sinon.createStubInstance(Resource);
            mockResource1.theValue = 'the value 1';
            mockResource1.getIdentifier.returns('doge1');
            mockSerializer.toJSON.withArgs(mockResource1).onFirstCall().returns({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockDataCollection.get.withArgs('doge2').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            });
            mockResource2 = sinon.createStubInstance(Resource);
            mockResource2.theValue = 'the value 2';
            mockResource2.getIdentifier.returns('doge2');
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge2'
            }).returns(mockResource2);
            // End of resources.
        });

        it('should remove all of the resources from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceremoved', mockEventHandler);
            return registry.removeAll([mockResource1, 'doge2'])
                .then(() => {
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'DELETE');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'DELETE');
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

        it('should throw if the access controller throws an exception', () => {
            mockAccessController.check.withArgs(mockResource2, 'DELETE').throws(new AccessException(mockResource2, 'DELETE', mockParticipant));
            mockDataCollection.remove.resolves();
            return registry.removeAll([mockResource1, mockResource2])
                .should.be.rejectedWith(AccessException);
        });

        it('should return errors from the data service', () => {
            mockDataCollection.remove.rejects();
            return registry.removeAll([mockResource1, mockResource2]).should.be.rejected;
        });

    });

    describe('#remove', () => {

        let mockResource;

        beforeEach(() => {
            // Old resources.
            // Deleting a resource by ID currently requires that we read it from the registry.
            mockDataCollection.get.withArgs('doge1').resolves({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            });
            mockResource = sinon.createStubInstance(Resource);
            mockResource.theValue = 'the value 1';
            mockResource.getIdentifier.returns('doge1');
            mockSerializer.fromJSON.withArgs({
                $class: 'org.doge.Doge',
                assetId: 'doge1'
            }).returns(mockResource);
            // End of resources.
        });

        it('should remove the resource by instance from the registry', () => {
            mockDataCollection.remove.resolves();
            let mockEventHandler = sinon.stub();
            registry.on('resourceremoved', mockEventHandler);
            return registry.remove(mockResource)
                .then(() => {
                    sinon.assert.calledOnce(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource, 'DELETE');
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

        it('should throw if the access controller throws an exception', () => {
            mockAccessController.check.withArgs(mockResource, 'DELETE').throws(new AccessException(mockResource, 'DELETE', mockParticipant));
            mockDataCollection.remove.resolves();
            return registry.remove(mockResource)
                .should.be.rejectedWith(AccessException);
        });

        it('should return errors from the data service', () => {
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
