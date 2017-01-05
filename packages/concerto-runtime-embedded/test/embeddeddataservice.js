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

const DataService = require('@ibm/concerto-runtime').DataService;
const Dexie = require('dexie');
const EmbeddedDataCollection = require('..').EmbeddedDataCollection;
const EmbeddedDataService = require('..').EmbeddedDataService;
const fakeIndexedDB = require('fake-indexeddb');
const FDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EmbeddedDataService', () => {

    let dataService;

    beforeEach(() => {
        dataService = new EmbeddedDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
    });

    afterEach(() => {
        const db = new Dexie('Concerto:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', {
            indexedDB: fakeIndexedDB,
            IDBKeyRange: FDBKeyRange
        });
        return db.delete();
    });

    describe('#constructor', () => {

        it('should create a data service', () => {
            dataService.should.be.an.instanceOf(DataService);
        });

    });

    describe('#ensureConnected', () => {

        it('should connect if not connected', () => {
            sinon.spy(dataService.db, 'isOpen');
            sinon.spy(dataService.db, 'open');
            return dataService.ensureConnected()
                .then(() => {
                    sinon.assert.calledOnce(dataService.db.isOpen);
                    sinon.assert.calledOnce(dataService.db.open);
                });
        });

        it('should return immediately if already connected', () => {
            sinon.spy(dataService.db, 'isOpen');
            sinon.spy(dataService.db, 'open');
            return dataService.ensureConnected()
                .then(() => {
                    sinon.assert.calledOnce(dataService.db.isOpen);
                    sinon.assert.calledOnce(dataService.db.open);
                    return dataService.ensureConnected();
                })
                .then(() => {
                    sinon.assert.calledTwice(dataService.db.isOpen);
                    sinon.assert.calledOnce(dataService.db.open);
                });
        });

    });

    describe('#createCollection', () => {

        it('should create a new collection', () => {
            sinon.spy(dataService.db.collections, 'add');
            return dataService.createCollection('doge')
                .then((result) => {
                    sinon.assert.calledOnce(dataService.db.collections.add);
                    sinon.assert.calledWith(dataService.db.collections.add, { id: 'doge' });
                    result.should.be.an.instanceOf(EmbeddedDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doge');
                });
        });

    });

    describe('#deleteCollection', () => {

        it('should throw if the collection does not exist', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves(null);
            return dataService.deleteCollection('doge')
                .then((result) => {
                    sinon.assert.calledOnce(dataService.db.collections.add);
                    sinon.assert.calledWith(dataService.db.collections.add, { id: 'doge' });
                    result.should.be.an.instanceOf(EmbeddedDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doge');
                })
                .should.be.rejectedWith(/Collection with ID 'doge' does not exist/);
        });

        it('should delete an existing collection', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves({ id: 'doge' });
            let deleteStub = sinon.stub().resolves();
            let equalsStub = sinon.stub().withArgs('doge').returns({ delete: deleteStub });
            sinon.stub(dataService.db.objects, 'where').withArgs('collectionId').returns({ equals: equalsStub });
            sinon.spy(dataService.db.collections, 'delete');
            return dataService.deleteCollection('doge')
                .then((result) => {
                    sinon.assert.calledOnce(deleteStub);
                    sinon.assert.calledOnce(dataService.db.collections.delete);
                    sinon.assert.calledWith(dataService.db.collections.delete, 'doge');
                });
        });

    });

    describe('#getCollection', () => {

        it('should throw if the collection does not exist', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves(null);
            return dataService.getCollection('doge')
                .should.be.rejectedWith(/Collection with ID 'doge' does not exist/);
        });

        it('should return an existing collection', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves({ id: 'doge' });
            return dataService.getCollection('doge')
                .then((result) => {
                    result.should.be.an.instanceOf(EmbeddedDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doge');
                });
        });

    });

});
