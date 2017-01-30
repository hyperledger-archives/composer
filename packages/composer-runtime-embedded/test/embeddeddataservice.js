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

const DataService = require('composer-runtime').DataService;
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
