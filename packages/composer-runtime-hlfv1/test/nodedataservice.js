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

const NodeDataService = require('../lib/nodedataservice');
const NodeDataCollection = require('../lib/nodedatacollection');
const DataService = require('composer-runtime').DataService;
const DataCollection = require('composer-runtime').DataCollection;
const MockStub = require('./mockstub');
const MockIterator = require('./mockiterator');
const NodeUtils = require('../lib/nodeutils');


const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');



describe('NodeDataService', () => {

    let dataService;
    let sandbox, mockStub, mockIterator;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(MockStub);
        mockIterator = sinon.createStubInstance(MockIterator);
        dataService = new NodeDataService(mockStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should be a type of DataService', () => {
            dataService.should.be.an.instanceOf(DataService);
        });
    });

    describe('#createCollection', () => {
        it('should create a collection', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.resolves(Buffer.from(''));
            mockStub.putState.resolves();
            return dataService.createCollection('newColl')
                .then((result) => {
                    sinon.assert.calledOnce(mockStub.createCompositeKey);
                    sinon.assert.calledWith(mockStub.createCompositeKey, '$syscollections', ['newColl']);
                    sinon.assert.calledOnce(mockStub.getState);
                    sinon.assert.calledWith(mockStub.getState, 'compKey');
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'compKey', Buffer.from('{"id":"newColl"}'));
                    result.should.be.an.instanceOf(DataCollection);
                });
        });

        it('should replace a collection if it exists and force specified', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            mockStub.putState.resolves();
            return dataService.createCollection('newColl', true)
                .then((result) => {
                    sinon.assert.calledOnce(mockStub.createCompositeKey);
                    sinon.assert.calledWith(mockStub.createCompositeKey, '$syscollections', ['newColl']);
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'compKey', Buffer.from('{"id":"newColl"}'));
                    result.should.be.an.instanceOf(DataCollection);
                });
        });


        it('should throw an error if the collection exists', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            mockStub.putState.resolves();
            return dataService.createCollection('newColl').should.be.rejectedWith(/already exists/);
        });

        it('should throw an error if the getState fails', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.rejects(new Error('getState error'));
            mockStub.putState.resolves();
            return dataService.createCollection('newColl').should.be.rejectedWith(/getState error/);
        });

        it('should throw an error if the putState fails', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.resolves(Buffer.from(''));
            mockStub.putState.rejects(new Error('putState error'));
            return dataService.createCollection('newColl').should.be.rejectedWith(/putState error/);
        });

        it('should throw an error if the putState fails and force specified', () => {
            mockStub.createCompositeKey.returns('compKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            mockStub.putState.rejects(new Error('putState error'));
            return dataService.createCollection('newColl', true).should.be.rejectedWith(/putState error/);
        });


    });

    describe('#getCollection', () => {
        it('should get a collection', () => {
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));

            return dataService.getCollection('myCollection')
                .then((result) => {
                    sinon.assert.calledOnce(mockStub.createCompositeKey);
                    sinon.assert.calledWith(mockStub.createCompositeKey, '$syscollections', ['myCollection']);
                    result.should.be.an.instanceOf(NodeDataCollection);
                    result.collectionID.should.equal('myCollection');
                });
        });

        it('should throw an error if collection doesn\'t exist', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataService.getCollection('key').should.be.rejectedWith(/does not exist/);
        });

    });

    describe('#existsCollection', () => {
        it('should return true if collection exists', () => {
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            sinon.stub(dataService, 'existCollection').resolves(true);
            sinon.stub(dataService, 'clearCollection').resolves();
            return dataService.existsCollection('myCollection')
                .then((result) => {
                    sinon.assert.calledOnce(mockStub.createCompositeKey);
                    sinon.assert.calledWith(mockStub.createCompositeKey, '$syscollections', ['myCollection']);
                    result.should.equal(true);
                });
        });

        it('should return false if collection doesn\'t exist', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataService.existsCollection('key').should.be.eventually.equal(false);
        });

    });

    describe('#deleteCollection', () => {

        it('should throw an error if collection doesn\'t exist', () => {
            sinon.stub(dataService, 'existsCollection').resolves(false);
            return dataService.deleteCollection('key').should.be.rejectedWith(/does not exist/);
        });


        it('should throw an error if clearing the collection fails', () => {
            sinon.stub(dataService, 'existsCollection').resolves(true);
            sinon.stub(dataService, 'clearCollection').rejects(new Error('some error'));
            return dataService.deleteCollection('key').should.be.rejectedWith(/some error/);
        });

        it('should throw an error if deleting the key fails fails', () => {
            sinon.stub(dataService, 'existsCollection').resolves(true);
            sinon.stub(dataService, 'clearCollection').resolves();
            mockStub.deleteState.rejects(new Error('some error'));
            return dataService.deleteCollection('key').should.be.rejectedWith(/some error/);
        });


        it('should delete if collection exists', () => {
            mockStub.createCompositeKey.returns('aCompositeKey');

            let mockExists = sinon.stub(dataService, 'existsCollection').resolves(true);
            let mockClear = sinon.stub(dataService, 'clearCollection').resolves();
            return dataService.deleteCollection('myCollection')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.createCompositeKey);
                    sinon.assert.calledWith(mockStub.createCompositeKey, '$syscollections', ['myCollection']);
                    sinon.assert.calledOnce(mockExists);
                    sinon.assert.calledWith(mockExists, 'myCollection');
                    sinon.assert.calledOnce(mockClear);
                    sinon.assert.calledWith(mockClear, 'myCollection');
                    sinon.assert.calledOnce(mockStub.deleteState);
                    sinon.assert.calledWith(mockStub.deleteState, 'aCompositeKey');
                });
        });
    });

    describe('#clearCollection', () => {

        it('should call getStateByPartialCompositeKey with the right ID and NodeUtils called which resolves', () => {
            sandbox.stub(NodeUtils, 'deleteAllResults').resolves();
            mockStub.getStateByPartialCompositeKey.resolves(mockIterator);
            return dataService.clearCollection('myID')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getStateByPartialCompositeKey);
                    sinon.assert.calledWith(mockStub.getStateByPartialCompositeKey, 'myID');
                    sinon.assert.calledOnce(NodeUtils.deleteAllResults);
                });
        });

        it('should handle deleteAllResults rejecting promise', () => {
            sandbox.stub(NodeUtils, 'deleteAllResults').rejects(new Error('rejected'));
            mockStub.getStateByPartialCompositeKey.resolves(mockIterator);
            return dataService.clearCollection('myID').should.be.rejectedWith(/rejected/)
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getStateByPartialCompositeKey);
                    sinon.assert.calledWith(mockStub.getStateByPartialCompositeKey, 'myID');
                    sinon.assert.calledOnce(NodeUtils.deleteAllResults);
                });
        });

        it('should handle getStateByPartialCompositeKey throwing an error', () => {
            sandbox.stub(NodeUtils, 'deleteAllResults').resolves();
            mockStub.getStateByPartialCompositeKey.rejects(new Error('some prob'));
            return dataService.clearCollection('myID').should.be.rejectedWith(/some prob/);
        });

    });

    describe('#executeQuery', () => {

        it('should call getQuery with the query and NodeUtils called which resolves', () => {
            sandbox.stub(NodeUtils, 'getAllResults').resolves(['val1', 'val2', 'val3']);
            mockStub.getQueryResult.resolves(mockIterator);
            return dataService.executeQuery('theQuery')
                .then((results) => {
                    sinon.assert.calledOnce(mockStub.getQueryResult);
                    sinon.assert.calledWith(mockStub.getQueryResult, 'theQuery');
                    sinon.assert.calledOnce(NodeUtils.getAllResults);
                    results.should.deep.equal(['val1', 'val2', 'val3']);
                });
        });

        it('should handle getAllResults rejecting promise', () => {
            sandbox.stub(NodeUtils, 'getAllResults').rejects(new Error('rejected'));
            mockStub.getQueryResult.resolves(mockIterator);
            return dataService.executeQuery('theQuery').should.be.rejectedWith(/rejected/)
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getQueryResult);
                    sinon.assert.calledWith(mockStub.getQueryResult, 'theQuery');
                    sinon.assert.calledOnce(NodeUtils.getAllResults);
                });
        });

        it('should handle getQueryResult throwing an error', () => {
            sandbox.stub(NodeUtils, 'getAllResults').callsArg(1);
            mockStub.getQueryResult.rejects(new Error('some prob'));
            return dataService.executeQuery('theQuery').should.be.rejectedWith(/some prob/);
        });

    });

});
