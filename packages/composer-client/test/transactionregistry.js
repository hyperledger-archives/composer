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

const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const TransactionRegistry = require('../lib/transactionregistry');
const Registry = require('../lib/registry');
const SecurityContext = require('composer-common').SecurityContext;
const Serializer = require('composer-common').Serializer;
const Util = require('composer-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('TransactionRegistry', () => {

    let sandbox;
    let mockSecurityContext;
    let mockModelManager;
    let mockFactory;
    let mockSerializer;
    let registry;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockFactory = sinon.createStubInstance(Factory);
        mockSerializer = sinon.createStubInstance(Serializer);
        registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', mockSecurityContext, mockModelManager, mockFactory, mockSerializer);
        sandbox.stub(Util, 'securityCheck');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllTransactionRegistries', () => {

        it('should throw when modelManager not specified', () => {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(mockSecurityContext, null, mockFactory, mockSerializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(mockSecurityContext, mockModelManager, null, mockSerializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(mockSecurityContext, mockModelManager, mockFactory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the list of transaction registries', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', () => {
                return Promise.resolve(
                    [
                        {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                        {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
                    ]
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getAllTransactionRegistries(mockSecurityContext, mockModelManager, mockFactory, mockSerializer)
                .then((transactionRegistries) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getAllRegistries);
                    sinon.assert.calledWith(Registry.getAllRegistries, mockSecurityContext, 'Transaction');

                    // Check that the transaction registries were returned correctly.
                    transactionRegistries.should.be.an('array');
                    transactionRegistries.should.have.lengthOf(2);
                    transactionRegistries.should.all.be.an.instanceOf(TransactionRegistry);
                    transactionRegistries[0].id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    transactionRegistries[0].name.should.equal('doge registry');
                    transactionRegistries[1].id.should.equal('6165d4c2-73ee-43a6-b5b5-bac512a4894e');
                    transactionRegistries[1].name.should.equal('wow such registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', () => {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getAllTransactionRegistries(mockSecurityContext, mockModelManager, mockFactory, mockSerializer)
                .then((transactionRegistries) => {
                    throw new Error('should not get here');
                }).catch((error) => {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#getTransactionRegistry', () => {

        it('should throw when id not specified', () => {
            (function () {
                TransactionRegistry.getTransactionRegistry(mockSecurityContext, null, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (function () {
                TransactionRegistry.getTransactionRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, mockFactory, mockSerializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (function () {
                TransactionRegistry.getTransactionRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', mockModelManager, null, mockSerializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (function () {
                TransactionRegistry.getTransactionRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', mockModelManager, mockFactory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the transaction registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', () => {
                return Promise.resolve(
                    {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'}
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getTransactionRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', mockModelManager, mockFactory, mockSerializer)
                .then((transactionRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, mockSecurityContext, 'Transaction', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the transaction registries were returned correctly.
                    transactionRegistry.should.be.an.instanceOf(TransactionRegistry);
                    transactionRegistry.id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    transactionRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', () => {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getTransactionRegistry(mockSecurityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', mockModelManager, mockFactory, mockSerializer)
                .then((transactionRegistries) => {
                    throw new Error('should not get here');
                }).catch((error) => {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addTransactionRegistry', () => {

        it('should throw when id not specified', () => {
            (function () {
                TransactionRegistry.addTransactionRegistry(mockSecurityContext, null, 'doge registry', mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', () => {
            (function () {
                TransactionRegistry.addTransactionRegistry(mockSecurityContext, 'suchid', null, mockModelManager, mockFactory, mockSerializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when modelManager not specified', () => {
            (function () {
                TransactionRegistry.addTransactionRegistry(mockSecurityContext, 'suchid', 'doge registry', null, mockFactory, mockSerializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', () => {
            (function () {
                TransactionRegistry.addTransactionRegistry(mockSecurityContext, 'suchid', 'doge registry', mockModelManager, null, mockSerializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', () => {
            (function () {
                TransactionRegistry.addTransactionRegistry(mockSecurityContext, 'suchid', 'doge registry', mockModelManager, mockFactory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the transaction registry', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', () => {
                return Promise.resolve();
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .addTransactionRegistry(mockSecurityContext, 'suchid', 'doge registry', mockModelManager, mockFactory, mockSerializer)
                .then((transactionRegistry) => {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledWith(Util.securityCheck, mockSecurityContext);
                    sinon.assert.calledOnce(Registry.addRegistry);
                    sinon.assert.calledWith(Registry.addRegistry, mockSecurityContext, 'Transaction', 'suchid', 'doge registry');

                    // Check that the transaction registry was returned successfully.
                    transactionRegistry.should.be.an.instanceOf(TransactionRegistry);
                    transactionRegistry.id.should.equal('suchid');
                    transactionRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', () => {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', () => {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .addTransactionRegistry(mockSecurityContext, 'suchid', 'doge registry', mockModelManager, mockFactory, mockSerializer)
                .then(() => {
                    throw new Error('should not get here');
                }).catch((error) => {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#add', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.add(null);
            }).should.throw(/cannot add transactions to a transaction registry/);
        });

    });

    describe('#addAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.addAll(null);
            }).should.throw(/cannot add transactions to a transaction registry/);
        });

    });

    describe('#update', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.update(null);
            }).should.throw(/cannot update transactions in a transaction registry/);
        });

    });

    describe('#updateAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.updateAll(null);
            }).should.throw(/cannot update transactions in a transaction registry/);
        });

    });

    describe('#remove', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.remove('dogecar1');
            }).should.throw(/cannot remove transactions from a transaction registry/);
        });

    });

    describe('#removeAll', () => {

        it('should throw an unsupported operation when called', () => {
            (() => {
                registry.removeAll(null);
            }).should.throw(/cannot remove transactions from a transaction registry/);
        });

    });

});
