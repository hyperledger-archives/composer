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

const Api = require('../lib/api');
const Resource = require('composer-common').Resource;
const TransactionHandler = require('../lib/transactionhandler');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('TransactionHandler', () => {

    let transactionHandler;

    beforeEach(() => {
        transactionHandler = new TransactionHandler();
    });

    describe('#bind', () => {

        it('should bind a function to a new transaction type', () => {
            const cb = sinon.stub();
            transactionHandler.bind('org.acme.Transaction', cb);
            transactionHandler.handlers.should.deep.equal({
                'org.acme.Transaction': [cb]
            });
        });

        it('should bind a function to an existing transaction type', () => {
            const cb = sinon.stub();
            transactionHandler.bind('org.acme.Transaction', cb);
            transactionHandler.handlers.should.deep.equal({
                'org.acme.Transaction': [cb]
            });
            const cb2 = sinon.stub();
            transactionHandler.bind('org.acme.Transaction', cb2);
            transactionHandler.handlers.should.deep.equal({
                'org.acme.Transaction': [cb, cb2]
            });
        });

    });

    describe('#execute', () => {

        it('should handle no bound functions', () => {
            const mockApi = sinon.createStubInstance(Api);
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getFullyQualifiedType.returns('org.acme.Transaction');
            return transactionHandler.execute(mockApi, mockTransaction)
                .then((count) => {
                    count.should.equal(0);
                });
        });

        it('should execute a single bound function', () => {
            const cb = sinon.stub().resolves();
            transactionHandler.handlers = {
                'org.acme.Transaction': [cb]
            };
            const mockApi = sinon.createStubInstance(Api);
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getFullyQualifiedType.returns('org.acme.Transaction');
            return transactionHandler.execute(mockApi, mockTransaction)
                .then((count) => {
                    count.should.equal(1);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, mockApi, mockTransaction);
                });
        });

        it('should execute multiple bound functions', () => {
            const cb = sinon.stub().resolves(), cb2 = sinon.stub().resolves();
            transactionHandler.handlers = {
                'org.acme.Transaction': [cb, cb2]
            };
            const mockApi = sinon.createStubInstance(Api);
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getFullyQualifiedType.returns('org.acme.Transaction');
            return transactionHandler.execute(mockApi, mockTransaction)
                .then((count) => {
                    count.should.equal(2);
                    sinon.assert.calledOnce(cb);
                    sinon.assert.calledWith(cb, mockApi, mockTransaction);
                    sinon.assert.calledOnce(cb2);
                    sinon.assert.calledWith(cb2, mockApi, mockTransaction);
                });
        });

        it('should execute an error from a bound function', () => {
            const cb = sinon.stub().rejects(new Error('such error'));
            transactionHandler.handlers = {
                'org.acme.Transaction': [cb]
            };
            const mockApi = sinon.createStubInstance(Api);
            const mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getFullyQualifiedType.returns('org.acme.Transaction');
            return transactionHandler.execute(mockApi, mockTransaction)
                .should.be.rejectedWith(/such error/);
        });

    });

});
