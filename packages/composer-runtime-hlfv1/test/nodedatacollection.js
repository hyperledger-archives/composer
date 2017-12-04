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

const NodeDataCollection = require('../lib/nodedatacollection');
const DataCollection = require('composer-runtime').DataCollection;
const MockStub = require('./mockstub');
const MockIterator = require('./mockiterator');
const NodeUtils = require('../lib/nodeutils');


const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');



describe('NodeDataCollection', () => {

    let dataCollection;
    let sandbox, mockStub, mockIterator;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockStub = sinon.createStubInstance(MockStub);
        mockIterator = sinon.createStubInstance(MockIterator);
        dataCollection = new NodeDataCollection(null, mockStub, 'anID');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should be a type of DataCollection', () => {
            dataCollection.should.be.an.instanceOf(DataCollection);
        });
    });

    describe('#get', () => {
        it('should call getState with the required key', () => {
            mockStub.createCompositeKey.returns('GetCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.get('keyToGet')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getState);
                    sinon.assert.calledWith(mockStub.getState, 'GetCompositeKey');
                });

        });
        it('should get an entry', () => {
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.get('key').should.eventually.deep.equal({data: 'something'});
        });
        it('should throw an error if empty', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataCollection.get('key').should.be.rejectedWith(/does not exist/);
        });
        it('should handle an error from getState', () => {
            mockStub.getState.rejects(new Error('some error'));
            return dataCollection.get('key').should.be.rejectedWith(/some error/);
        });

    });

    describe('#getAll', () => {
        it('should call getStateByPartialCompositeKey with the right ID and NodeUtils called which resolves', () => {

            sandbox.stub(NodeUtils, 'getAllResults').resolves(['val1', 'val2', 'val3']);
            mockStub.getStateByPartialCompositeKey.resolves(mockIterator);
            return dataCollection.getAll()
                .then((results) => {
                    sinon.assert.calledOnce(mockStub.getStateByPartialCompositeKey);
                    sinon.assert.calledWith(mockStub.getStateByPartialCompositeKey, 'anID', []);
                    sinon.assert.calledOnce(NodeUtils.getAllResults);
                    results.should.deep.equal(['val1', 'val2', 'val3']);
                });
        });

        it('should handle getStateByPartialCompositeKey returning an error', () => {
            mockStub.getStateByPartialCompositeKey.rejects(new Error('some error'));
            return dataCollection.getAll().should.be.rejectedWith(/some error/);
        });

        it('should handle NodeUtils rejecting the promise', () => {
            sandbox.stub(NodeUtils, 'getAllResults').throws(new Error('iterator error'));
            mockStub.getStateByPartialCompositeKey.resolves(mockIterator);
            return dataCollection.getAll().should.be.rejectedWith(/iterator error/);
        });

    });

    describe('#exists', () => {
        it('should call getState with the right key', () => {
            mockStub.createCompositeKey.returns('ExistsCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.remove('keyToRemove')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.deleteState);
                    sinon.assert.calledWith(mockStub.deleteState, 'ExistsCompositeKey');
                });
        });

        it('should handle an entry which exists', () => {
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.exists('key').should.eventually.equal(true);
        });
        it('should handle an entry which doesn\'t exist', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataCollection.exists('key').should.eventually.equal(false);
        });

        it('should handle an error from getState', () => {
            mockStub.getState.rejects(new Error('some error'));
            return dataCollection.exists('key').should.be.rejectedWith(/some error/);
        });

    });

    describe('#add', () => {
        it('should call getState with the right key', () => {
            mockStub.createCompositeKey.returns('AddCompositeKey');
            mockStub.getState.resolves(Buffer.from(''));
            mockStub.putState.resolves();
            return dataCollection.add('keyToAdd', {data:'something'})
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getState);
                    sinon.assert.calledWith(mockStub.getState, 'AddCompositeKey');
                });
        });

        it('should call putState with the right key if no entry exists', () => {
            mockStub.createCompositeKey.returns('AddCompositeKey');
            mockStub.getState.resolves(Buffer.from(''));
            mockStub.putState.resolves();
            return dataCollection.add('keyToAdd', {data:'something'})
                .then(() => {
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'AddCompositeKey', Buffer.from('{"data":"something"}'));
                });
        });

        it('should call putState with the right key if entry exists and force specified', () => {
            mockStub.createCompositeKey.returns('AddCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"original"}'));
            mockStub.putState.resolves();
            return dataCollection.add('keyToAdd', {data:'something'}, true)
                .then(() => {
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'AddCompositeKey', Buffer.from('{"data":"something"}'));
                });
        });


        it('should throw an error if key exists', () => {
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.add('key', {data:'something'}).should.be.rejectedWith(/already exists/);
        });

        it('should handle an error from getState', () => {
            mockStub.getState.rejects(new Error('some error'));
            return dataCollection.add('key', {data:'something'}).should.be.rejectedWith(/some error/);
        });

        it('should handle putState error', () => {
            mockStub.createCompositeKey.returns('AddCompositeKey');
            mockStub.getState.resolves(Buffer.from(''));
            mockStub.putState.rejects(new Error('some put error'));
            return dataCollection.add('key', {data:'something'}).should.be.rejectedWith(/some put error/);
        });

        it('should handle putState error with force specified', () => {
            mockStub.createCompositeKey.returns('AddCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"original"}'));
            mockStub.putState.rejects(new Error('some put error'));
            return dataCollection.add('key', {data:'something'}, true).should.be.rejectedWith(/some put error/);
        });


    });

    describe('#update', () => {
        it('should call getState with the right key', () => {
            mockStub.createCompositeKey.returns('UpdateCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"original"}'));
            mockStub.putState.resolves();
            return dataCollection.update('keyToUpdate', {data:'something'})
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getState);
                    sinon.assert.calledWith(mockStub.getState, 'UpdateCompositeKey');
                });
        });

        it('should call putState with the right key if an entry exists', () => {
            mockStub.createCompositeKey.returns('UpdateCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"original"}'));
            mockStub.putState.resolves();
            return dataCollection.update('keyToUpdate', {data:'something'})
                .then(() => {
                    sinon.assert.calledOnce(mockStub.putState);
                    sinon.assert.calledWith(mockStub.putState, 'UpdateCompositeKey', Buffer.from('{"data":"something"}'));
                });
        });

        it('should throw an error if key doesn\'t exist', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataCollection.update('key', {data:'something'}).should.be.rejectedWith(/not exist/);
        });

        it('should handle an error from getState', () => {
            mockStub.getState.rejects(new Error('some error'));
            return dataCollection.update('key', {data:'something'}).should.be.rejectedWith(/some error/);
        });

        it('should handle putState error', () => {
            mockStub.createCompositeKey.returns('UpdateCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"original"}'));
            mockStub.putState.rejects(new Error('some put error'));
            return dataCollection.update('key', {data:'something'}).should.be.rejectedWith(/some put error/);
        });

    });

    describe('#remove', () => {
        it('should call getState with the right key', () => {
            mockStub.createCompositeKey.returns('RemoveCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.remove('keyToRemove')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.getState);
                    sinon.assert.calledWith(mockStub.getState, 'RemoveCompositeKey');
                });
        });

        it('should call deleteState with the right key if entry exists', () => {
            mockStub.createCompositeKey.returns('RemoveCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            return dataCollection.remove('keyToRemove')
                .then(() => {
                    sinon.assert.calledOnce(mockStub.deleteState);
                    sinon.assert.calledWith(mockStub.deleteState, 'RemoveCompositeKey');
                });
        });

        it('should throw an error if deleteState failes', () => {
            mockStub.createCompositeKey.returns('RemoveCompositeKey');
            mockStub.getState.resolves(Buffer.from('{"data":"something"}'));
            mockStub.deleteState.rejects(new Error('some error'));
            return dataCollection.remove('keyToRemove').should.be.rejectedWith(/some error/);
        });


        it('should throw an error if key doesn\'t exist', () => {
            mockStub.getState.resolves(Buffer.from(''));
            return dataCollection.remove('key').should.be.rejectedWith(/does not exist/);
        });

        it('should handle an error from getState', () => {
            mockStub.getState.rejects(new Error('some error'));
            return dataCollection.remove('key').should.be.rejectedWith(/some error/);
        });

    });

});
