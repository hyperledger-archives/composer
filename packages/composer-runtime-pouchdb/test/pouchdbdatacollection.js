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

const DataCollection = require('composer-runtime').DataCollection;
const PouchDB = require('pouchdb-core');
const PouchDBDataCollection = require('..').PouchDBDataCollection;
const PouchDBDataService = require('..').PouchDBDataService;
const pouchCollate = require('pouchdb-collate');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


// Install the PouchDB plugins.
PouchDB.plugin(require('pouchdb-adapter-memory'));
PouchDB.plugin(require('pouchdb-find'));

describe('PouchDBDataCollection', () => {

    let mockDataService;
    let db;
    let dataCollection;

    /**
     * Create a database
     * @param {string} uuid The uuid to use
     * @returns {Promise} A promise
     */
    function createDatabase (uuid) {
        mockDataService = sinon.createStubInstance(PouchDBDataService);
        mockDataService.handleAction.resolves();
        mockDataService.db = db = new PouchDB('Composer', {adapter : 'memory'});

        if (uuid) {
            dataCollection = new PouchDBDataCollection(mockDataService, db, 'doge', uuid);

            return db.bulkDocs([
                {
                    _id : pouchCollate.toIndexableString([uuid, 'doge', 'thing1']),
                    thing : 1
                },
                {
                    _id : pouchCollate.toIndexableString([uuid, 'doge', 'thing2']),
                    thing : 2
                },
            ]);
        } else {
            dataCollection = new PouchDBDataCollection(mockDataService, db, 'doge');

            return db.bulkDocs([
                {
                    _id : pouchCollate.toIndexableString(['doge', 'thing1']),
                    thing : 1
                },
                {
                    _id : pouchCollate.toIndexableString(['doge', 'thing2']),
                    thing : 2
                },
            ]);
        }

    }

    afterEach(() => {
        return db.destroy();
    });

    describe('#constructor', () => {

        it('should create a data service', () => {
            return createDatabase().then(() => {
                dataCollection.should.be.an.instanceOf(DataCollection);
            });
        });

        it('should create a data service with uuid', () => {
            return createDatabase('myNetwork').then(() => {
                dataCollection.should.be.an.instanceOf(DataCollection);
                dataCollection.uuid.should.equal('myNetwork');
            });
        });

    });

    describe('#getAll', () => {
        it('should get all the objects', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.getAll();
                })
                .then((objects) => {
                    objects.should.deep.equal([{thing : 1}, {thing : 2}]);
                });

        });

        it('should get all the objects with uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.getAll();
                })
                .then((objects) => {
                    objects.should.deep.equal([{thing : 1}, {thing : 2}]);
                });
        });

    });

    describe('#get', () => {

        it('should throw if the specified object does not exist', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.get('thing3')
                        .should.be.rejectedWith(/Object with ID 'thing3' in collection with ID 'doge' does not exist/);
                });
        });

        it('should get the specified object', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.get('thing1')
                        .should.eventually.deep.equal({thing : 1});
                });
        });

        it('should get the specified object with uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.get('thing1')
                        .should.eventually.deep.equal({thing : 1});
                });
        });

    });

    describe('#exists', () => {

        it('should return true if the specified object exists', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.exists('thing1')
                        .should.eventually.be.true;
                });
        });

        it('should return true if the specified object exists with uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.exists('thing1')
                        .should.eventually.be.true;
                });
        });

        it('should return false if the specified object does not exist', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.exists('thing3')
                        .should.eventually.be.false;
                });
        });

        it('should return false if the specified object does not exist with uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.exists('thing3')
                        .should.eventually.be.false;
                });
        });

    });

    describe('#add', () => {

        it('should add a new object to the collection', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.add('thing4', {thing : 4});
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doge', 'thing4']));
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({thing : 4});
                });
        });

        it('should add a new object to the collection with a uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.add('thing4', {thing : 4});
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['myNetwork', 'doge', 'thing4']));
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({thing : 4, $networkId : 'myNetwork'});
                });
        });

        it('should throw an error adding an existing object to the collection', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.add('thing1', {thing : 1})
                        .should.be.rejectedWith(/Failed to add object with ID .* as the object already exists/);
                });
        });

    });

    describe('#update', () => {

        it('should update an existing object in the collection', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.update('thing1', {thing : 100});
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doge', 'thing1']));
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({thing : 100});
                });
        });

        it('should update an existing object in the collection with uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.update('thing1', {thing : 100});
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['myNetwork', 'doge', 'thing1']));
                })
                .then((doc) => {
                    delete doc._id;
                    delete doc._rev;
                    doc.should.deep.equal({thing : 100, $networkId : 'myNetwork'});
                });
        });

        it('should throw an error updating a non-existent object in the collection', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.update('thing4', {thing : 4})
                        .should.be.rejectedWith(/Object with ID .* in collection with ID .* does not exist/);
                });
        });

    });

    describe('#remove', () => {

        it('should remove an existing object from the collection', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.remove('thing1');
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doge', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should remove an existing object from the collection with a uuid', () => {
            return createDatabase('myNetwork')
                .then(() => {
                    return dataCollection.remove('thing1');
                })
                .then(() => {
                    sinon.assert.calledOnce(mockDataService.handleAction);
                    sinon.assert.calledWith(mockDataService.handleAction, sinon.match.func);
                    return mockDataService.handleAction.args[0][0]();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doge', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should throw an error removing a non-existent object from the collection', () => {
            return createDatabase()
                .then(() => {
                    return dataCollection.remove('thing4', {thing : 4})
                        .should.be.rejectedWith(/Object with ID .* in collection with ID .* does not exist/);
                });
        });
    });
});
