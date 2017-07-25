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
const pouchCollate = require('pouchdb-collate');
const PouchDB = require('pouchdb-core');
const PouchDBDataCollection = require('..').PouchDBDataCollection;
const PouchDBDataService = require('..').PouchDBDataService;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


// Install the PouchDB plugins.
PouchDB.plugin(require('pouchdb-adapter-memory'));
PouchDB.plugin(require('pouchdb-find'));

// This is the object type used to form composite keys for the collection of collections.
const collectionObjectType = '$syscollections';

describe('PouchDBDataService', () => {

    let dataService;
    let db;
    let sandbox;

    beforeEach(() => {
        db = new PouchDB('Composer', { adapter: 'memory' });
        sandbox = sinon.sandbox.create();
        sandbox.stub(PouchDBDataService, 'createPouchDB').returns(db);
        dataService = new PouchDBDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', { adapter: 'memory' });
        return db.bulkDocs([
            {
                _id: pouchCollate.toIndexableString([collectionObjectType, 'doges1'])
            },
            {
                _id: pouchCollate.toIndexableString([collectionObjectType, 'doges2'])
            },
        ]);
    });

    afterEach(() => {
        sandbox.restore();
        return dataService.destroy();
    });

    describe('#registerPouchDBPlugin', () => {

        beforeEach(() => {
            sandbox.stub(PouchDB, 'plugin');
        });

        it('should register a PouchDB plugin', () => {
            PouchDBDataService.registerPouchDBPlugin({ foo: 'bar' });
            sinon.assert.calledOnce(PouchDB.plugin);
            sinon.assert.calledWith(PouchDB.plugin, { foo: 'bar' });
        });

    });

    describe('#createPouchDB', () => {

        beforeEach(() => {
            PouchDBDataService.createPouchDB.restore();
        });

        it('should create a PouchDB instance', () => {
            let db = PouchDBDataService.createPouchDB('Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', { adapter: 'memory' });
            db.should.be.an.instanceOf(PouchDB);
            return db.destroy();
        });

    });

    describe('#constructor', () => {

        beforeEach(() => {
            PouchDBDataService.createPouchDB.restore();
        });

        it('should create a data service with a UUID', () => {
            let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
            dataService = new PouchDBDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
            dataService.should.be.an.instanceOf(DataService);
            sinon.assert.calledWith(spy, 'Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        });

        it('should create a data service without a UUID', () => {
            let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
            dataService = new PouchDBDataService();
            dataService.should.be.an.instanceOf(DataService);
            sinon.assert.calledWith(spy, 'Composer');
        });

        it('should create a data service with options', () => {
            let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
            dataService = new PouchDBDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', undefined, { adapter: 'memory' });
            dataService.should.be.an.instanceOf(DataService);
            sinon.assert.calledWith(spy, 'Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', { adapter: 'memory' });
        });

    });

    describe('#destroy', () => {

        it('should destroy the database', () => {
            sinon.stub(dataService.db, 'destroy').resolves();
            return dataService.destroy()
                .then(() => {
                    sinon.assert.calledOnce(dataService.db.destroy);
                });
        });

    });

    describe('#createCollection', () => {

        it('should throw if the collection already exists', () => {
            return dataService.createCollection('doges1')
                .should.be.rejectedWith(/Failed to add collection with ID .* as the collection already exists/);
        });

        it('should create a new collection with autocommit enabled', () => {
            dataService.autocommit = true;
            return dataService.createCollection('doges3')
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(db);
                    result.collectionId.should.equal('doges3');
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges3']));
                });
        });

        it('should create a new collection with autocommit disabled', () => {
            dataService.autocommit = false;
            return dataService.createCollection('doges3')
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(db);
                    result.collectionId.should.equal('doges3');
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges3']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return dataService.transactionPrepare();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges3']));
                });
        });

    });

    describe('#deleteCollection', () => {

        it('should throw if the collection does not exist', () => {
            return dataService.deleteCollection('doges3')
                .should.be.rejectedWith(/Collection with ID .* does not exist/);
        });

        it('should delete an existing collection with autocommit enabled', () => {
            dataService.autocommit = true;
            return dataService.transactionStart(false)
                .then(() => {
                    return dataService.deleteCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should delete an existing collection with autocommit disabled', () => {
            dataService.autocommit = false;
            return dataService.transactionStart(false)
                .then(() => {
                    return dataService.deleteCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges1']));
                })
                .then(() => {
                    return dataService.transactionPrepare();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

    });

    describe('#getCollection', () => {

        it('should throw if the collection does not exist', () => {
            return dataService.getCollection('doges3')
                .should.be.rejectedWith(/Collection with ID .* does not exist/);
        });

        it('should return an existing collection', () => {
            return dataService.getCollection('doges1')
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

    });

    describe('#existsCollection', () => {

        it('should return true if a collection exists', () => {
            return dataService.existsCollection('doges1')
                .should.eventually.be.true;
        });

        it('should return false if a collection does not exist', () => {
            return dataService.existsCollection('doges3')
                .should.eventually.be.false;
        });


    });

    describe('#executeQuery', () => {

        beforeEach(() => {
            return db.bulkDocs([
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing1']),
                    thingId: 1,
                    colour: 'red'
                },
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing2']),
                    thingId: 2,
                    colour: 'black'
                },
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing3']),
                    thingId: 3,
                    colour: 'red'
                },
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing4']),
                    thingId: 4,
                    colour: 'green'
                }
            ]);
        });

        it('should return the query results', () => {
            return dataService.executeQuery('{"selector":{"colour":{"$eq":"red"}}}')
                .should.eventually.be.deep.equal([{
                    thingId: 1,
                    colour: 'red'
                }, {
                    thingId: 3,
                    colour: 'red'
                }]);
        });

    });

    describe('#clearCollection', () => {

        beforeEach(() => {
            return db.bulkDocs([
                {
                    _id: pouchCollate.toIndexableString(['doges0', 'thing1']),
                    thing: 1
                },
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing1']),
                    thing: 1
                },
                {
                    _id: pouchCollate.toIndexableString(['doges1', 'thing2']),
                    thing: 2
                },
                {
                    _id: pouchCollate.toIndexableString(['doges2', 'thing1']),
                    thing: 1
                }
            ]);
        });

        it('should remove all of the documents from a collection', () => {
            return dataService.clearCollection('doges1')
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doges0', 'thing1']));
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doges1', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doges1', 'thing2']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doges2', 'thing1']));
                });
        });

    });

    describe('#handleAction', () => {

        it('should call the action immediately with autocommit enabled', () => {
            dataService.autocommit = true;
            const cb = sinon.stub();
            cb.resolves();
            return dataService.handleAction(cb)
                .then(() => {
                    sinon.assert.calledOnce(cb);
                });
        });

        it('should queue the action for prepare time with autocommit disabled', () => {
            dataService.autocommit = false;
            const cb = sinon.stub();
            cb.resolves();
            return dataService.handleAction(cb)
                .then(() => {
                    sinon.assert.notCalled(cb);
                    dataService.pendingActions.should.deep.equal([ cb ]);
                });
        });

    });

    describe('#transactionStart', () => {

        it('should reset the list of queued actions', () => {
            dataService.pendingActions = [ 1, 2, 3 ];
            return dataService.transactionStart(false)
                .then(() => {
                    dataService.pendingActions.should.deep.equal([]);
                });
        });

    });

    describe('#transactionPrepare', () => {

        it('should call all of the queued actions', () => {
            const cb1 = sinon.stub(), cb2 = sinon.stub();
            cb1.resolves();
            cb2.resolves();
            dataService.pendingActions = [ cb1, cb2 ];
            return dataService.transactionPrepare()
                .then(() => {
                    sinon.assert.calledOnce(cb1);
                    sinon.assert.calledOnce(cb2);
                });
        });

    });

});
