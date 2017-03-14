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
const AssetDeclaration = require('composer-common').AssetDeclaration;
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const EventEmitter = require('events');
const Introspector = require('composer-common').Introspector;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Serializer = require('composer-common').Serializer;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('RegistryManager', () => {

    let mockDataService;
    let mockIntrospector;
    let mockSerializer;
    let mockAccessController;
    let registryManager;
    let mockSystemRegistries;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockAccessController = sinon.createStubInstance(AccessController);
        mockSystemRegistries = sinon.createStubInstance(DataCollection);
        mockDataService.getCollection.withArgs('$sysregistries').resolves(mockSystemRegistries);
        registryManager = new RegistryManager(mockDataService, mockIntrospector, mockSerializer, mockAccessController, mockSystemRegistries);
    });

    describe('#constructor', () => {

        it('should be an event emitter', () => {
            registryManager.should.be.an.instanceOf(EventEmitter);
        });

    });

    describe('#createRegistry', () => {

        it('should create a new registry and subscribe to its events', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            let registry = registryManager.createRegistry(mockDataCollection, mockSerializer, mockAccessController, 'Asset', 'doges', 'The doges registry');
            ['resourceadded', 'resourceupdated', 'resourceremoved'].forEach((event) => {
                let stub = sinon.stub();
                registryManager.once(event, stub);
                registry.emit(event, { test: 'data' });
                sinon.assert.calledOnce(stub);
                sinon.assert.calledWith(stub, { test: 'data' });
            });
        });

    });

    describe('#createDefaults', () => {

        it('should do nothing when no classes exist', () => {
            mockIntrospector.getClassDeclarations.returns([]);
            return registryManager.createDefaults();
        });

        it('should create default asset registries', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockAssetDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Asset', 'org.doge.Doge').rejects();
            sinon.stub(registryManager, 'add').withArgs('Asset', 'org.doge.Doge', 'Asset registry for org.doge.Doge').resolves();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.calledOnce(registryManager.get);
                    sinon.assert.calledOnce(registryManager.add);
                    sinon.assert.calledWith(registryManager.add, 'Asset', 'org.doge.Doge', 'Asset registry for org.doge.Doge');
                });
        });

        it('should forcably create default asset registries', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockAssetDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Asset', 'org.doge.Doge').rejects();
            sinon.stub(registryManager, 'add').withArgs('Asset', 'org.doge.Doge', 'Asset registry for org.doge.Doge').resolves();
            return registryManager.createDefaults(true)
                .then(() => {
                    sinon.assert.notCalled(registryManager.get);
                    sinon.assert.calledOnce(registryManager.add);
                    sinon.assert.calledWith(registryManager.add, 'Asset', 'org.doge.Doge', 'Asset registry for org.doge.Doge');
                });
        });

        it('should ignore abstract default asset registries', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockAssetDeclaration.isAbstract.returns(true);
            mockIntrospector.getClassDeclarations.returns([mockAssetDeclaration]);
            sinon.stub(registryManager, 'get').rejects();
            sinon.stub(registryManager, 'add').rejects();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.notCalled(registryManager.get);
                    sinon.assert.notCalled(registryManager.add);
                });
        });

        it('should ignore existing default asset registries', () => {
            let mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockAssetDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockAssetDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Asset', 'org.doge.Doge').resolves();
            sinon.stub(registryManager, 'add').rejects();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.calledOnce(registryManager.get);
                    sinon.assert.notCalled(registryManager.add);
                });
        });

        it('should create default participant registries', () => {
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockParticipantDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Participant', 'org.doge.Doge').rejects();
            sinon.stub(registryManager, 'add').withArgs('Participant', 'org.doge.Doge', 'Participant registry for org.doge.Doge').resolves();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.calledOnce(registryManager.get);
                    sinon.assert.calledOnce(registryManager.add);
                    sinon.assert.calledWith(registryManager.add, 'Participant', 'org.doge.Doge', 'Participant registry for org.doge.Doge');
                });
        });

        it('should forcably create default participant registries', () => {
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockParticipantDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Participant', 'org.doge.Doge').rejects();
            sinon.stub(registryManager, 'add').withArgs('Participant', 'org.doge.Doge', 'Participant registry for org.doge.Doge').resolves();
            return registryManager.createDefaults(true)
                .then(() => {
                    sinon.assert.notCalled(registryManager.get);
                    sinon.assert.calledOnce(registryManager.add);
                    sinon.assert.calledWith(registryManager.add, 'Participant', 'org.doge.Doge', 'Participant registry for org.doge.Doge');
                });
        });

        it('should ignore abstract default participant registries', () => {
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockParticipantDeclaration.isAbstract.returns(true);
            mockIntrospector.getClassDeclarations.returns([mockParticipantDeclaration]);
            sinon.stub(registryManager, 'get').rejects();
            sinon.stub(registryManager, 'add').rejects();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.notCalled(registryManager.get);
                    sinon.assert.notCalled(registryManager.add);
                });
        });

        it('should ignore existing default participant registries', () => {
            let mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockParticipantDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockParticipantDeclaration]);
            sinon.stub(registryManager, 'get').withArgs('Participant', 'org.doge.Doge').resolves();
            sinon.stub(registryManager, 'add').rejects();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.calledOnce(registryManager.get);
                    sinon.assert.notCalled(registryManager.add);
                });
        });

        it('should not create default transaction registries', () => {
            let mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
            mockTransactionDeclaration.getFullyQualifiedName.returns('org.doge.Doge');
            mockIntrospector.getClassDeclarations.returns([mockTransactionDeclaration]);
            sinon.stub(registryManager, 'get').rejects();
            sinon.stub(registryManager, 'add').rejects();
            return registryManager.createDefaults()
                .then(() => {
                    sinon.assert.notCalled(registryManager.get);
                    sinon.assert.notCalled(registryManager.add);
                });
        });

    });

    describe('#getAll', () => {

        it('should get all the registries of the specified type', () => {
            mockSystemRegistries.getAll.resolves([{
                type: 'Asset',
                id: 'cats',
                name: 'The cats registry'
            }, {
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            }]);
            let mockCatsCollection = sinon.createStubInstance(DataCollection);
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:cats').resolves(mockCatsCollection);
            mockDataService.getCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            return registryManager.getAll('Asset')
                .then((registries) => {
                    registries.should.have.lengthOf(2);
                    registries.should.all.be.an.instanceOf(Registry);
                    registries.should.containSubset([{
                        type: 'Asset',
                        id: 'cats',
                        name: 'The cats registry'
                    }, {
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    }]);
                });
        });

        it('should return errors from the data service', () => {
            mockSystemRegistries.getAll.rejects();
            registryManager.getAll('Asset').should.be.rejected;
        });

        it('should filter out registries not of the specified type', () => {
            mockSystemRegistries.getAll.resolves([{
                type: 'Asset',
                id: 'cats',
                name: 'The cats registry'
            }, {
                type: 'Particpant',
                id: 'doges',
                name: 'The doges registry'
            }]);
            let mockCatsCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:cats').resolves(mockCatsCollection);
            return registryManager.getAll('Asset')
                .then((registries) => {
                    registries.should.have.lengthOf(1);
                    registries.should.all.be.an.instanceOf(Registry);
                    registries.should.containSubset([{
                        type: 'Asset',
                        id: 'cats',
                        name: 'The cats registry'
                    }]);
                });
        });

    });

    describe('#get', () => {

        it('should get the registry with the specified ID', () => {
            mockSystemRegistries.get.withArgs('Asset:doges').resolves({
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            });
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            return registryManager.get('Asset', 'doges')
                .then((registry) => {
                    registry.should.be.an.instanceOf(Registry);
                    registry.should.containSubset({
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                });
        });

        it('should return errors from the data service', () => {
            mockSystemRegistries.get.rejects();
            return registryManager.get('Asset', 'doges').should.be.rejected;
        });

    });

    describe('#exists', () => {

        it('should determine the existence of a registry with the specified ID', () => {
            mockSystemRegistries.exists.withArgs('Asset:doges').resolves(true);
            return registryManager.exists('Asset', 'doges')
                .then((exists) => {
                    exists.should.equal.true;
                });
        });

        it('should return errors from the data service', () => {
            mockSystemRegistries.exists.rejects();
            return registryManager.exists('Asset', 'doges').should.be.rejected;
        });

    });

    describe('#add', () => {

        it('should add a new registry with the specified ID', () => {
            mockSystemRegistries.add.withArgs('Asset:doges', {
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            }).resolves();
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.createCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            let mockEventHandler = sinon.stub();
            registryManager.on('registryadded', mockEventHandler);
            return registryManager.add('Asset', 'doges', 'The doges registry')
                .then((registry) => {
                    sinon.assert.calledOnce(mockSystemRegistries.add);
                    sinon.assert.calledWith(mockSystemRegistries.add, 'Asset:doges', {
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                    sinon.assert.calledOnce(mockDataService.createCollection);
                    sinon.assert.calledWith(mockDataService.createCollection, 'Asset:doges');
                    registry.should.containSubset({
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                    sinon.assert.calledOnce(mockEventHandler);
                    sinon.assert.calledWith(mockEventHandler, sinon.match({
                        registry: sinon.match.instanceOf(Registry),
                        registryType: 'Asset',
                        registryID: 'doges',
                        registryName: 'The doges registry'
                    }));
                });
        });

        it('should return errors from the data service', () => {
            mockSystemRegistries.add.rejects();
            return registryManager.add('Asset', 'doges', 'The doges registry').should.be.rejected;
        });

    });

});
