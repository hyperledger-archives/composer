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
const should = chai.should();
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

    /**
     * Create a database
     * @param {string} uuid The uuid
     * @returns {promise} The returned promise
     */
    function createDatabase (uuid) {
        db = new PouchDB('Composer', {adapter : 'memory'});
        sandbox = sinon.sandbox.create();
        sandbox.stub(PouchDBDataService, 'createPouchDB').returns(db);

        if (uuid) {
            dataService = new PouchDBDataService(uuid, {adapter : 'memory'});
            return db.bulkDocs([
                {
                    _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges1'])
                },
                {
                    _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges2'])
                },
            ]);
        } else {
            dataService = new PouchDBDataService(null, {adapter : 'memory'});
            return db.bulkDocs([
                {
                    _id : pouchCollate.toIndexableString([collectionObjectType, 'doges1'])
                },
                {
                    _id : pouchCollate.toIndexableString([collectionObjectType, 'doges2'])
                },
            ]);
        }

    }

    afterEach(() => {
        sandbox.restore();
        return dataService.destroy();
    });

    describe('#registerPouchDBPlugin', () => {

        beforeEach(() => {
            return createDatabase().then(() => {
                sandbox.stub(PouchDB, 'plugin');
            });
        });

        it('should register a PouchDB plugin', () => {
            PouchDBDataService.registerPouchDBPlugin({foo : 'bar'});
            sinon.assert.calledOnce(PouchDB.plugin);
            sinon.assert.calledWith(PouchDB.plugin, {foo : 'bar'});
        });
    });

    describe('#createPouchDB', () => {

        beforeEach(() => {
            return createDatabase().then(() => {
                PouchDBDataService.createPouchDB.restore();
            });
        });

        it('should create a PouchDB instance', () => {
            let db = PouchDBDataService.createPouchDB('Composer:3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', {adapter : 'memory'});
            db.should.be.an.instanceOf(PouchDB);
            return db.destroy();
        });

    });

    describe('#constructor', () => {

        it('should create a data service with a UUID', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c').then(() => {
                PouchDBDataService.createPouchDB.restore();
                let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
                dataService = new PouchDBDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                dataService.should.be.an.instanceOf(DataService);
                sinon.assert.calledWith(spy, 'Composer');
                dataService.uuid.should.equal('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
            });
        });

        it('should create a data service without a UUID', () => {
            return createDatabase().then(() => {
                PouchDBDataService.createPouchDB.restore();
                let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
                dataService = new PouchDBDataService();
                dataService.should.be.an.instanceOf(DataService);
                sinon.assert.calledWith(spy, 'Composer');
                should.not.exist(dataService.uuid);
            });
        });

        it('should create a data service with options', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c').then(() => {
                PouchDBDataService.createPouchDB.restore();
                let spy = sandbox.spy(PouchDBDataService, 'createPouchDB');
                dataService = new PouchDBDataService('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', undefined, {adapter : 'memory'});
                dataService.should.be.an.instanceOf(DataService);
                sinon.assert.calledWith(spy, 'Composer', {adapter : 'memory'});
            });
        });

    });

    describe('#destroy', () => {

        it('should destroy the database', () => {
            return createDatabase()
                .then(() => {
                    sinon.stub(dataService.db, 'destroy').resolves();
                    return dataService.destroy();
                })
                .then(() => {
                    sinon.assert.calledOnce(dataService.db.destroy);
                });
        });

    });

    describe('#createCollection', () => {

        it('should throw if the collection already exists', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c').then(() => {
                return dataService.createCollection('doges1')
                    .should.be.rejectedWith(/Failed to add collection with ID .* as the collection already exists/);
            });
        });

        it('should create a new collection with autocommit enabled', () => {
            return createDatabase()
                .then(() => {
                    dataService.autocommit = true;
                    return dataService.createCollection('doges3');
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(db);
                    result.collectionId.should.equal('doges3');
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges3']));
                });
        });

        it('should create a new collection with autocommit enabled with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    dataService.autocommit = true;
                    return dataService.createCollection('doges3');
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(db);
                    result.collectionId.should.equal('doges3');
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges3']));
                });
        });

        it('should create a new collection with autocommit disabled', () => {
            return createDatabase()
                .then(() => {
                    dataService.autocommit = false;
                    return dataService.createCollection('doges3');
                })
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

        it('should create a new collection with autocommit disabled with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    dataService.autocommit = false;
                    return dataService.createCollection('doges3');
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(db);
                    result.collectionId.should.equal('doges3');
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges3']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return dataService.transactionPrepare();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges3']));
                });
        });
    });

    describe('#deleteCollection', () => {

        it('should throw if the collection does not exist', () => {
            return createDatabase()
                .then(() => {
                    return dataService.deleteCollection('doges3')
                        .should.be.rejectedWith(/Collection with ID .* does not exist/);
                });
        });

        it('should delete an existing collection with autocommit enabled', () => {
            return createDatabase()
                .then(() => {
                    dataService.autocommit = true;
                    return dataService.transactionStart(false);
                })
                .then(() => {
                    return dataService.deleteCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString([collectionObjectType, 'doges1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should delete an existing collection with autocommit enabled with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    dataService.autocommit = true;
                    return dataService.transactionStart(false);
                })
                .then(() => {
                    return dataService.deleteCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges1']))
                        .should.be.rejectedWith(/missing/);
                });
        });

        it('should delete an existing collection with autocommit disabled', () => {
            return createDatabase()
                .then(() => {
                    dataService.autocommit = false;
                    return dataService.transactionStart(false);
                })
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

        it('should delete an existing collection with autocommit disabled with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    dataService.autocommit = false;
                    return dataService.transactionStart(false);
                })
                .then(() => {
                    return dataService.deleteCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges1']));
                })
                .then(() => {
                    return dataService.transactionPrepare();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', collectionObjectType, 'doges1']))
                        .should.be.rejectedWith(/missing/);
                });
        });
    });

    describe('#getCollection', () => {

        it('should throw if the collection does not exist', () => {
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges3')
                        .should.be.rejectedWith(/Collection with ID .* does not exist/);
                });
        });

        it('should not perform a retrieve via getDocument() if passed a boolean true bypass parameter', () => {
            let bypass = true;
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1', bypass);
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.not.have.been.called;
                });
        });

        it('should not perform a retrieve via getDocument() if passed a boolean true bypass parameter with uuid', () => {
            let bypass = true;
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1', bypass);
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.not.have.been.called;
                });
        });

        it('should perform a retrieve via getDocument() if passed a boolean false bypass parameter', () => {
            let bypass = false;
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1', bypass);
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.have.been.called;
                });
        });

        it('should perform a retrieve via getDocument() if passed a boolean false bypass parameter with uuid', () => {
            let bypass = false;
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1', bypass);
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.have.been.called;
                });
        });

        it('should perform a retrieve via getDocument() if not passed a bypass parameter', () => {
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1');
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.have.been.called;
                });
        });

        it('should perform a retrieve via getDocument() if not passed a bypass parameter with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1');
                })
                .then(() => {
                    pouchCollate.toIndexableString.should.have.been.called;
                });
        });

        it('should return an existing collection if no bypass flags are passed', () => {
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1');
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

        it('should return an existing collection if no bypass flags are passed with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1');
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

        it('should return an existing collection when retrieving', () => {
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1', false);
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

        it('should return an existing collection when retrieving with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1', false);
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

        it('should return an existing collection when bypassing retrieve', () => {
            return createDatabase()
                .then(() => {
                    return dataService.getCollection('doges1', true);
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });

        it('should return an existing collection when bypassing retrieve with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.getCollection('doges1', true);
                })
                .then((result) => {
                    result.should.be.an.instanceOf(PouchDBDataCollection);
                    result.db.should.equal(dataService.db);
                    result.collectionId.should.equal('doges1');
                });
        });
    });

    describe('#existsCollection', () => {

        it('should return true if a collection exists', () => {
            return createDatabase()
                .then(() => {
                    return dataService.existsCollection('doges1')
                        .should.eventually.be.true;
                });
        });

        it('should return true if a collection exists with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.existsCollection('doges1')
                        .should.eventually.be.true;
                });
        });

        it('should return false if a collection does not exist', () => {
            return createDatabase()
                .then(() => {
                    return dataService.existsCollection('doges3')
                        .should.eventually.be.false;
                });
        });

        it('should return false if a collection does not exist with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return dataService.existsCollection('doges3')
                        .should.eventually.be.false;
                });
        });


    });

    describe('#executeQuery', () => {

        /**
         * Create some data
         * @param {string} uuid The uuid
         * @returns {promise} The returned promise
         */
        function createData (uuid) {
            if (uuid) {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing1']),
                        thingId : 1,
                        colour : 'red',
                        $class : 'org.acme.Foo1',
                        $registryType : 'Asset',
                        $registryId : 'org.acme.Foo1',
                        $networkId : 'other'
                    },
                    {
                        _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing2']),
                        thingId : 2,
                        colour : 'black',
                        $class : 'org.acme.Foo1',
                        $registryType : 'Asset',
                        $registryId : 'DogesBagOfFoos',
                        $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                    },
                    {
                        _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing3']),
                        thingId : 3,
                        colour : 'red',
                        $class : 'org.acme.Foo2',
                        $registryType : 'Participant',
                        $registryId : 'org.acme.Foo2',
                        $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                    },
                    {
                        _id : pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing4']),
                        thingId : 4,
                        colour : 'green',
                        $class : 'org.acme.Foo2',
                        $registryType : 'Participant',
                        $registryId : 'DogesBagOfFoos',
                        $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                    }
                ]);
            } else {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing1']),
                        thingId : 1,
                        colour : 'red',
                        $class : 'org.acme.Foo1',
                        $registryType : 'Asset',
                        $registryId : 'org.acme.Foo1',
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing2']),
                        thingId : 2,
                        colour : 'black',
                        $class : 'org.acme.Foo1',
                        $registryType : 'Asset',
                        $registryId : 'DogesBagOfFoos',
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing3']),
                        thingId : 3,
                        colour : 'red',
                        $class : 'org.acme.Foo2',
                        $registryType : 'Participant',
                        $registryId : 'org.acme.Foo2',
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing4']),
                        thingId : 4,
                        colour : 'green',
                        $class : 'org.acme.Foo2',
                        $registryType : 'Participant',
                        $registryId : 'DogesBagOfFoos',
                    }
                ]);
            }
        }

        it('should return the query results', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"colour":{"$eq":"red"}}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 1,
                            colour : 'red',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'org.acme.Foo1'
                        }, {
                            thingId : 3,
                            colour : 'red',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'org.acme.Foo2',
                        }]);
                });
        });

        it('should return the query results with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"colour":{"$eq":"red"}}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 3,
                            colour : 'red',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'org.acme.Foo2',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }]);
                });
        });

        it('should return the query results after transforming the $class variable', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$class":"org.acme.Foo1"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 1,
                            colour : 'red',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'org.acme.Foo1'
                        }, {
                            thingId : 2,
                            colour : 'black',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'DogesBagOfFoos'
                        }]);
                });
        });

        it('should return the query results after transforming the $class variable with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$class":"org.acme.Foo1"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 2,
                            colour : 'black',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'DogesBagOfFoos',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }]);
                });
        });

        it('should return the query results after transforming the $registryType variable', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$registryType":"Participant"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 3,
                            colour : 'red',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'org.acme.Foo2',
                        }, {
                            thingId : 4,
                            colour : 'green',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'DogesBagOfFoos'
                        }]);
                });
        });

        it('should return the query results after transforming the $registryType variable with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$registryType":"Participant"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 3,
                            colour : 'red',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'org.acme.Foo2',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }, {
                            thingId : 4,
                            colour : 'green',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'DogesBagOfFoos',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }]);
                });
        });

        it('should return the query results after transforming the $registryId variable', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$registryId":"DogesBagOfFoos"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 2,
                            colour : 'black',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'DogesBagOfFoos'
                        }, {
                            thingId : 4,
                            colour : 'green',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'DogesBagOfFoos'
                        }]);
                });
        });

        it('should return the query results after transforming the $registryId variable with uuid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                }).then(() => {
                    return dataService.executeQuery('{"selector":{"\\\\$registryId":"DogesBagOfFoos"}}')
                        .should.eventually.be.deep.equal([{
                            thingId : 2,
                            colour : 'black',
                            $class : 'org.acme.Foo1',
                            $registryType : 'Asset',
                            $registryId : 'DogesBagOfFoos',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }, {
                            thingId : 4,
                            colour : 'green',
                            $class : 'org.acme.Foo2',
                            $registryType : 'Participant',
                            $registryId : 'DogesBagOfFoos',
                            $networkId : '3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c'
                        }]);
                });
        });
    });

    describe('#clearCollection', () => {

        /**
         * Create some data
         * @param {string} uuid The uuid
         * @returns {promise} The returned promise
         */
        function createData (uuid) {
            if (uuid) {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges0', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges1', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges1', 'thing2']),
                        thing : 2
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges2', 'thing1']),
                        thing : 1
                    }
                ]);
            } else {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString(['doges0', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing2']),
                        thing : 2
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges2', 'thing1']),
                        thing : 1
                    }
                ]);
            }
        }

        it('should remove all of the documents from a collection', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.clearCollection('doges1');
                })
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


        it('should remove all of the documents from a collection with uid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                }).then(() => {
                    return dataService.clearCollection('doges1');
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges0', 'thing1']));
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing2']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges2', 'thing1']));
                });
        });
    });

    describe('#removeAllData', () => {

        /**
         * Create some data
         * @param {string} uuid The uuid
         * @returns {promise} The returned promise
         */
        function createData (uuid) {
            if (uuid) {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges0', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges1', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges1', 'thing2']),
                        thing : 2
                    },
                    {
                        _id : pouchCollate.toIndexableString([uuid, 'doges2', 'thing1']),
                        thing : 1
                    }
                ]);
            } else {
                return db.bulkDocs([
                    {
                        _id : pouchCollate.toIndexableString(['doges0', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing1']),
                        thing : 1
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges1', 'thing2']),
                        thing : 2
                    },
                    {
                        _id : pouchCollate.toIndexableString(['doges2', 'thing1']),
                        thing : 1
                    }
                ]);
            }
        }

        it('should remove all of the documents', () => {
            return createDatabase()
                .then(() => {
                    return createData();
                }).then(() => {
                    return dataService.removeAllData();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['doges0', 'thing1']))
                        .should.be.rejectedWith(/missing/);
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
                    return db.get(pouchCollate.toIndexableString(['doges2', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                });
        });


        it('should remove all of the documents with uid', () => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c')
                .then(() => {
                    return createData('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
                })
                .then(() => {
                    return createData('another-id');
                }).then(() => {
                    return dataService.removeAllData();
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges0', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges1', 'thing2']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c', 'doges2', 'thing1']))
                        .should.be.rejectedWith(/missing/);
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['another-id', 'doges0', 'thing1']));
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['another-id', 'doges1', 'thing1']));
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['another-id', 'doges1', 'thing2']));
                })
                .then(() => {
                    return db.get(pouchCollate.toIndexableString(['another-id', 'doges2', 'thing1']));
                });
        });
    });

    describe('#handleAction', () => {

        beforeEach(() => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        });

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
                    dataService.pendingActions.should.deep.equal([cb]);
                });
        });
    });

    describe('#transactionStart', () => {
        beforeEach(() => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        });

        it('should reset the list of queued actions', () => {
            dataService.pendingActions = [1, 2, 3];
            return dataService.transactionStart(false)
                .then(() => {
                    dataService.pendingActions.should.deep.equal([]);
                });
        });
    });

    describe('#transactionPrepare', () => {

        beforeEach(() => {
            return createDatabase('3a4b69c9-239c-4e3d-9c33-9c24d2bdbb1c');
        });

        it('should call all of the queued actions', () => {
            const cb1 = sinon.stub(), cb2 = sinon.stub();
            cb1.resolves();
            cb2.resolves();
            dataService.pendingActions = [cb1, cb2];
            return dataService.transactionPrepare()
                .then(() => {
                    sinon.assert.calledOnce(cb1);
                    sinon.assert.calledOnce(cb2);
                });
        });
    });
});
