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
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('RegistryManager', () => {

    let mockDataService;
    let mockSerializer;
    let registryManager;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockSerializer = sinon.createStubInstance(Serializer);
        registryManager = new RegistryManager(mockDataService, mockSerializer);
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
