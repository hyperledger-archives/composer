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

const DataService = require('../lib/dataservice');

require('chai').should();
const sinon = require('sinon');

describe('DataService', () => {

    let dataService;

    beforeEach(() => {
        dataService = new DataService();
    });

    describe('#createCollection', () => {

        it('should call _createCollection and handle no error', () => {
            sinon.stub(dataService, '_createCollection').yields(null, {});
            return dataService.createCollection('id')
                .then((result) => {
                    sinon.assert.calledWith(dataService._createCollection, 'id');
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


    describe('#toJSON', () => {

        it('should return an empty object', () => {
            dataService.toJSON().should.deep.equal({});
        });

    });

});
