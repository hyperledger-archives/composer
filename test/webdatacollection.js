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

const DataCollection = require('@ibm/ibm-concerto-runtime').DataCollection;
const DataService = require('@ibm/ibm-concerto-runtime').DataService;
const WebDataCollection = require('..').WebDataCollection;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebDataCollection', () => {

    let mockDataService;
    let mockDB;
    let dataCollection;

    beforeEach(() => {
        mockDataService = sinon.createStubInstance(DataService);
        mockDB = {
            objects: {
                where: function () { },
                add: function () { },
                put: function () { }
            },
            collections: {}
        };
        dataCollection = new WebDataCollection(mockDataService, mockDB, 'doge');
    });

    describe('#constructor', () => {

        it('should create a data service', () => {
            dataCollection.should.be.an.instanceOf(DataCollection);
        });

    });

    describe('#getAll', () => {

        it('should get all the objects', () => {
            let toArrayStub = sinon.stub().resolves([{
                collectionId: 'doge',
                id: 'thing1',
                object: { thing: 1 }
            }, {
                collectionId: 'doge',
                id: 'thing2',
                object: { thing: 2 }
            }]);
            let equalsStub = sinon.stub().withArgs('doge').returns({ toArray: toArrayStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('collectionId').returns({ equals: equalsStub });
            return dataCollection.getAll()
                .then((objects) => {
                    objects.should.deep.equal([{ thing: 1 }, { thing: 2 }]);
                });
        });

    });

    describe('#get', () => {

        it('should throw if the specified object does not exist', () => {
            let firstStub = sinon.stub().resolves(undefined);
            let equalsStub = sinon.stub().withArgs(['thing1', 'doge']).returns({ first: firstStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('[id+collectionId]').returns({ equals: equalsStub });
            return dataCollection.get('thing1')
                .should.be.rejectedWith(/Object with ID 'thing1' in collection with ID 'doge' does not exist/);
        });

        it('should get the specified object', () => {
            let firstStub = sinon.stub().resolves({
                collectionId: 'doge',
                id: 'thing1',
                object: { thing: 1 }
            });
            let equalsStub = sinon.stub().withArgs(['thing1', 'doge']).returns({ first: firstStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('[id+collectionId]').returns({ equals: equalsStub });
            return dataCollection.get('thing1')
                .then((object) => {
                    object.should.deep.equal({ thing: 1 });
                });
        });

    });

    describe('#exists', () => {

        it('should return true if the specified object exists', () => {
            let firstStub = sinon.stub().resolves({
                collectionId: 'doge',
                id: 'thing1',
                object: { thing: 1 }
            });
            let equalsStub = sinon.stub().withArgs(['thing1', 'doge']).returns({ first: firstStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('[id+collectionId]').returns({ equals: equalsStub });
            return dataCollection.exists('thing1')
                .then((exists) => {
                    exists.should.equal.true;
                });
        });

        it('should return false if the specified object does not exist', () => {
            let firstStub = sinon.stub().resolves(null);
            let equalsStub = sinon.stub().withArgs(['thing1', 'doge']).returns({ first: firstStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('[id+collectionId]').returns({ equals: equalsStub });
            return dataCollection.exists('thing2')
                .then((exists) => {
                    exists.should.equal.false;
                });
        });

    });

    describe('#add', () => {

        it('should add a new object to the collection', () => {
            const thing1 = {
                collectionId: 'doge',
                id: 'thing1',
                object: { thing: 1 }
            };
            sinon.stub(dataCollection.db.objects, 'add').withArgs(sinon.match((thing) => {
                thing1.should.deep.equal(thing);
                return true;
            })).resolves();
            return dataCollection.add(thing1.id, thing1.object)
                .then(() => {
                    sinon.assert.calledOnce(dataCollection.db.objects.add);
                    sinon.assert.calledWith(dataCollection.db.objects.add, thing1);
                });
        });

    });

    describe('#update', () => {

        it('should update an existing object in the collection', () => {
            const thing1 = {
                collectionId: 'doge',
                id: 'thing1',
                object: { thing: 1 }
            };
            sinon.stub(dataCollection.db.objects, 'put').withArgs(sinon.match((thing) => {
                thing1.should.deep.equal(thing);
                return true;
            })).resolves();
            return dataCollection.update(thing1.id, thing1.object)
                .then(() => {
                    sinon.assert.calledOnce(dataCollection.db.objects.put);
                    sinon.assert.calledWith(dataCollection.db.objects.put, thing1);
                });
        });

    });

    describe('#remove', () => {

        it('should remove an existing object from the collection', () => {
            let deleteStub = sinon.stub().resolves();
            let equalsStub = sinon.stub().withArgs(['thing1', 'doge']).returns({ delete: deleteStub });
            sinon.stub(dataCollection.db.objects, 'where').withArgs('[id+collectionId]').returns({ equals: equalsStub });
            return dataCollection.remove('thing1')
                .then(() => {
                    sinon.assert.calledOnce(deleteStub);
                });
        });

    });

});
