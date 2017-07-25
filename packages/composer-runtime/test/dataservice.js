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

const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('DataService', () => {

    let dataService;

    beforeEach(() => {
        dataService = new DataService();
    });

    describe('#createCollection', () => {

        it('should call _createCollection, default force to false and handle no error', () => {
            sinon.stub(dataService, '_createCollection').yields(null, {});
            return dataService.createCollection('id')
                .then((result) => {
                    sinon.assert.calledWith(dataService._createCollection, 'id', false);
                    result.should.deep.equal({});
                });
        });

        it('should call _createCollection, passthrough force to false and handle no error', () => {
            sinon.stub(dataService, '_createCollection').yields(null, {});
            return dataService.createCollection('id', true)
                .then((result) => {
                    sinon.assert.calledWith(dataService._createCollection, 'id', true);
                    result.should.deep.equal({});
                });
        });


        it('should call _createCollection and handle an error', () => {
            sinon.stub(dataService, '_createCollection').yields(new Error('error'));
            return dataService.createCollection('id')
                .then((result) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataService._createCollection, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_createCollection', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataService._createCollection('id', {});
            }).should.throw(/abstract function called/);
        });

    });

    describe('#deleteCollection', () => {

        it('should call _deleteCollection and handle no error', () => {
            sinon.stub(dataService, '_deleteCollection').yields(null);
            return dataService.deleteCollection('id')
                .then(() => {
                    sinon.assert.calledWith(dataService._deleteCollection, 'id');
                });
        });

        it('should call _deleteCollection and handle an error', () => {
            sinon.stub(dataService, '_deleteCollection').yields(new Error('error'));
            return dataService.deleteCollection('id')
                .then(() => {
                    throw new Error('should not deleteCollection here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataService._deleteCollection, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_deleteCollection', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataService._deleteCollection('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getCollection', () => {

        it('should call _getCollection and handle no error', () => {
            sinon.stub(dataService, '_getCollection').yields(null, {});
            return dataService.getCollection('id')
                .then((result) => {
                    sinon.assert.calledWith(dataService._getCollection, 'id');
                    result.should.deep.equal({});
                });
        });

        it('should call _getCollection and handle an error', () => {
            sinon.stub(dataService, '_getCollection').yields(new Error('error'), null);
            return dataService.getCollection('id')
                .then((result) => {
                    throw new Error('should not getCollection here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataService._getCollection, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_getCollection', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataService._getCollection('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#existsCollection', () => {

        it('should call _existsCollection and handle no error', () => {
            sinon.stub(dataService, '_existsCollection').yields(null, {});
            return dataService.existsCollection('id')
                .then((result) => {
                    sinon.assert.calledWith(dataService._existsCollection, 'id');
                    result.should.deep.equal({});
                });
        });

        it('should call _existsCollection and handle an error', () => {
            sinon.stub(dataService, '_existsCollection').yields(new Error('error'), null);
            return dataService.existsCollection('id')
                .then((result) => {
                    throw new Error('should not getCollection here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataService._existsCollection, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_existsCollection', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataService._existsCollection('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#executeQuery', () => {

        it('should call _executeQuery and handle no error', () => {
            sinon.stub(dataService, '_executeQuery').yields(null, {});
            return dataService.executeQuery('id')
                .then((result) => {
                    sinon.assert.calledWith(dataService._executeQuery, 'id');
                    result.should.deep.equal({});
                });
        });

        it('should call _executeQuery and handle an error', () => {
            sinon.stub(dataService, '_executeQuery').yields(new Error('error'), null);
            return dataService.executeQuery('id')
                .then((result) => {
                    throw new Error('should not getCollection here');
                })
                .catch((error) => {
                    sinon.assert.calledWith(dataService._executeQuery, 'id');
                    error.should.match(/error/);
                });
        });

    });

    describe('#_executeQuery', () => {

        it('should throw as abstract method', () => {
            (() => {
                dataService._executeQuery('id');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#ensureCollection', () => {

        it('should return an existing collection', () => {
            const mockDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(dataService, 'getCollection').withArgs('suchcollection').resolves(mockDataCollection);
            return dataService.ensureCollection('suchcollection')
                .should.eventually.be.equal(mockDataCollection);
        });

        it('should create a collection that does not exist', () => {
            const mockDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(dataService, 'getCollection').withArgs('suchcollection').rejects(new Error('no such collection!'));
            sinon.stub(dataService, 'createCollection').withArgs('suchcollection').resolves(mockDataCollection);
            return dataService.ensureCollection('suchcollection')
                .should.eventually.be.equal(mockDataCollection);
        });

    });

});
