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
const WebDataCollection = require('..').WebDataCollection;
const WebDataService = require('..').WebDataService;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebDataService', () => {

    let dataService;
    let sandbox;

    beforeEach(() => {
        dataService = new WebDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
        dataService.close();
        const db = new Dexie('Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        return db.delete();
    });

    describe('#createDexie', () => {

        it('should create a Dexie instance', () => {
            let db = WebDataService.createDexie('Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
            db.should.be.an.instanceOf(Dexie);
        });

    });

    describe('#constructor', () => {

        it('should create a data service with a UUID', () => {
            let spy = sandbox.spy(WebDataService, 'createDexie');
            dataService = new WebDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
            dataService.should.be.an.instanceOf(DataService);
            sinon.assert.calledWith(spy, 'Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        });

        it('should create a data service without a UUID', () => {
            let spy = sandbox.spy(WebDataService, 'createDexie');
            dataService = new WebDataService();
            dataService.should.be.an.instanceOf(DataService);
            sinon.assert.calledWith(spy, 'Composer');
        });

    });

    describe('#close', () => {

        it('should close the database', () => {
            sinon.spy(dataService.db, 'close');
            dataService.close();
            sinon.assert.calledOnce(dataService.db.close);
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
                    result.should.be.an.instanceOf(WebDataCollection);
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
                    result.should.be.an.instanceOf(WebDataCollection);
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
                    result.should.be.an.instanceOf(WebDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doge');
                });
        });

    });

    describe('#existsCollection', () => {

        it('should return true if a collection exists', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves({ id: 'doge' });
            return dataService.existsCollection('doge')
                .then((exists) => {
                    exists.should.equal.true;
                });
        });

        it('should return false if a collection does not exist', () => {
            sinon.stub(dataService.db.collections, 'get').withArgs('doge').resolves({ id: 'doge' });
            return dataService.existsCollection('doge2')
                .then((exists) => {
                    exists.should.equal.false;
                });
        });


    });

});
