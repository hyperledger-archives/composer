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

const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Introspector = require('@ibm/ibm-concerto-common').Introspector;
const ParticipantDeclaration = require('@ibm/ibm-concerto-common').ParticipantDeclaration;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('RegistryManager', () => {

    let mockDataService;
    let mockIntrospector;
    let mockSerializer;
    let registryManager;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockSerializer = sinon.createStubInstance(Serializer);
        registryManager = new RegistryManager(mockDataService, mockIntrospector, mockSerializer);
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
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.returns([{
                type: 'Asset',
                id: 'cats',
                name: 'The cats registry'
            }, {
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            }]);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            let mockCatsCollection = sinon.createStubInstance(DataCollection);
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:cats').resolves(mockCatsCollection);
            mockDataService.getCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            return registryManager.getAll('Asset')
                .then((registries) => {
                    registries.should.have.lengthOf(2);
                    registries.should.all.be.an.instanceOf(Registry);
                    registries.should.deep.equal([{
                        dataCollection: mockCatsCollection,
                        serializer: mockSerializer,
                        type: 'Asset',
                        id: 'cats',
                        name: 'The cats registry'
                    }, {
                        dataCollection: mockDogesCollection,
                        serializer: mockSerializer,
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    }]);
                });
        });

        it('should return errors from the data service', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.rejects();
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            registryManager.getAll('Asset').should.be.rejected;
        });

        it('should filter out registries not of the specified type', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.returns([{
                type: 'Asset',
                id: 'cats',
                name: 'The cats registry'
            }, {
                type: 'Particpant',
                id: 'doges',
                name: 'The doges registry'
            }]);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            let mockCatsCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:cats').resolves(mockCatsCollection);
            return registryManager.getAll('Asset')
                .then((registries) => {
                    registries.should.have.lengthOf(1);
                    registries.should.all.be.an.instanceOf(Registry);
                    registries.should.deep.equal([{
                        dataCollection: mockCatsCollection,
                        serializer: mockSerializer,
                        type: 'Asset',
                        id: 'cats',
                        name: 'The cats registry'
                    }]);
                });
        });

    });

    describe('#get', () => {

        it('should get the registry with the specified ID', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.get.withArgs('Asset:doges').returns({
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            });
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            return registryManager.get('Asset', 'doges')
                .then((registry) => {
                    registry.should.be.an.instanceOf(Registry);
                    registry.should.deep.equal({
                        dataCollection: mockDogesCollection,
                        serializer: mockSerializer,
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.get.rejects();
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            return registryManager.get('Asset', 'doges').should.be.rejected;
        });

    });

    describe('#add', () => {

        it('should add a new registry with the specified ID', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.add.withArgs('Asset:doges', {
                type: 'Asset',
                id: 'doges',
                name: 'The doges registry'
            }).resolves();
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            let mockDogesCollection = sinon.createStubInstance(DataCollection);
            mockDataService.createCollection.withArgs('Asset:doges').resolves(mockDogesCollection);
            return registryManager.add('Asset', 'doges', 'The doges registry')
                .then((registry) => {
                    sinon.assert.calledOnce(mockDataCollection.add);
                    sinon.assert.calledWith(mockDataCollection.add, 'Asset:doges', {
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                    sinon.assert.calledOnce(mockDataService.createCollection);
                    sinon.assert.calledWith(mockDataService.createCollection, 'Asset:doges');
                    registry.should.deep.equal({
                        dataCollection: mockDogesCollection,
                        serializer: mockSerializer,
                        type: 'Asset',
                        id: 'doges',
                        name: 'The doges registry'
                    });
                });
        });

        it('should return errors from the data service', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.add.rejects();
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            return registryManager.add('Asset', 'doges', 'The doges registry').should.be.rejected;
        });

    });

});
