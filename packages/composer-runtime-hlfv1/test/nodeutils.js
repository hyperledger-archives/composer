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

const NodeUtils = require('../lib/nodeutils');
const Logger = require('composer-common').Logger;
const ChaincodeStub = require('fabric-shim/lib/stub');
const StateQueryIterator = require('fabric-shim/lib/iterators').StateQueryIterator;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('NodeUtils', () => {

    let sandbox;
    let mockIterator, mockStub;
    let logWarnSpy;


    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockIterator = sinon.createStubInstance(StateQueryIterator);
        mockIterator.close.resolves();
        mockStub = sinon.createStubInstance(ChaincodeStub);
        mockStub.getTxID.returns('abcdefg135845');
        const LOG = Logger.getLog('NodeUtils');
        logWarnSpy = sandbox.spy(LOG, 'warn');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllResults', () => {
        it('should handle empty iterator', async () => {
            mockIterator.next.onFirstCall().resolves({done: true});
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.length.should.equal(0);
        });

        it('should handle iterator with 1 element with no done:true', async () => {
            let data = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            mockIterator.next.onFirstCall().resolves(data);
            mockIterator.next.onSecondCall().resolves({done: true});
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledTwice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.should.deep.equal([JSON.parse(data.value.value)]);
        });

        it('should handle iterator with 1 element with done:true', async () => {
            let data = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.should.deep.equal([JSON.parse(data.value.value)]);
        });

        it('should handle iterator with more than 1 element with done:true', async () => {
            let data1 = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            let data2 = {
                value: {
                    value: '{"data": "some-other-value"}'
                },
                done: true
            };

            mockIterator.next.onFirstCall().resolves(data1);
            mockIterator.next.onSecondCall().resolves(data2);
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledTwice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.should.deep.equal([JSON.parse(data1.value.value), JSON.parse(data2.value.value)]);
        });

        it('should handle iterator with more than 1 element with done:false', async () => {
            let data1 = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            let data2 = {
                value: {
                    value: '{"data": "some-other-value"}'
                },
                done: false
            };

            mockIterator.next.onFirstCall().resolves(data1);
            mockIterator.next.onSecondCall().resolves(data2);
            mockIterator.next.onThirdCall().resolves({done: true});
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledThrice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.should.deep.equal([JSON.parse(data1.value.value), JSON.parse(data2.value.value)]);
        });

        it('should handle iterator with empty element', async () => {
            let data = {
                value: {
                    value: new Buffer('')
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.length.should.equal(0);
        });

        it('should handle next throwing an error', async () => {
            mockIterator.next.onFirstCall().rejects(new Error('NextError'));
            await NodeUtils.getAllResults(mockIterator, mockStub)
                .should.be.rejectedWith(/NextError/);
        });

        it('should handle close throwing an error', async () => {
            let data = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            mockIterator.close.rejects(new Error('CloseError'));
            let results = await NodeUtils.getAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            results.should.deep.equal([{data: 'some-value'}]);
            sinon.assert.calledWith(logWarnSpy, 'Failure to close iterator. Error: CloseError');

        });

    });

    describe('#deleteAllResults', () => {

        it('should handle empty iterator', async () => {
            mockIterator.next.onFirstCall().resolves({done: true});
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.notCalled(mockStub.deleteState);
        });

        it('should handle iterator with 1 element with no done:true', async () => {
            let data = {
                value: {
                    key: 'someKey',
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            mockIterator.next.onFirstCall().resolves(data);
            mockIterator.next.onSecondCall().resolves({done: true});
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledTwice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.calledOnce(mockStub.deleteState);
            sinon.assert.calledWith(mockStub.deleteState, 'someKey');

        });

        it('should handle iterator with 1 element with done:true', async () => {
            let data = {
                value: {
                    key: 'someKey',
                    value: '{"data": "some-value"}'
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.calledOnce(mockStub.deleteState);
            sinon.assert.calledWith(mockStub.deleteState, 'someKey');
        });

        it('should handle iterator with more than 1 element with done:true', async () => {
            let data1 = {
                value: {
                    key: 'someKey1',
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            let data2 = {
                value: {
                    key: 'someKey2',
                    value: '{"data": "some-other-value"}'
                },
                done: true
            };

            mockIterator.next.onFirstCall().resolves(data1);
            mockIterator.next.onSecondCall().resolves(data2);
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledTwice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.calledTwice(mockStub.deleteState);
            sinon.assert.calledWith(mockStub.deleteState.firstCall, 'someKey1');
            sinon.assert.calledWith(mockStub.deleteState.secondCall, 'someKey2');
        });

        it('should handle iterator with more than 1 element with done:false', async () => {
            let data1 = {
                value: {
                    key: 'someKey1',
                    value: '{"data": "some-value"}'
                },
                done: false
            };
            let data2 = {
                value: {
                    key: 'someKey2',
                    value: '{"data": "some-other-value"}'
                },
                done: false
            };

            mockIterator.next.onFirstCall().resolves(data1);
            mockIterator.next.onSecondCall().resolves(data2);
            mockIterator.next.onThirdCall().resolves({done: true});
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledThrice(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.calledTwice(mockStub.deleteState);
            sinon.assert.calledWith(mockStub.deleteState.firstCall, 'someKey1');
            sinon.assert.calledWith(mockStub.deleteState.secondCall, 'someKey2');
        });

        it('should handle iterator with empty key', async () => {
            let data = {
                value: {
                    key: '',
                    value: ''
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.notCalled(mockStub.deleteState);
        });

        it('should handle next throwing an error', async () => {
            mockIterator.next.onFirstCall().rejects(new Error('NextError'));
            await NodeUtils.deleteAllResults(mockIterator, mockStub)
                .should.be.rejectedWith(/NextError/);
        });

        it('should handle close throwing an error', async () => {
            let data = {
                value: {
                    value: '{"data": "some-value"}'
                },
                done: true
            };
            mockIterator.next.onFirstCall().resolves(data);
            mockIterator.close.rejects(new Error('CloseError'));
            await NodeUtils.deleteAllResults(mockIterator, mockStub);
            sinon.assert.calledOnce(mockIterator.next);
            sinon.assert.calledOnce(mockIterator.close);
            sinon.assert.calledWith(logWarnSpy, 'Failure to close iterator. Error: CloseError');
        });

    });
});
