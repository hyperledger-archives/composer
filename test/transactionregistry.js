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

const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const TransactionRegistry = require('../lib/transactionregistry');
const Registry = require('../lib/registry');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const Util = require('@ibm/ibm-concerto-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('TransactionRegistry', function () {

    let securityContext;
    let sandbox;
    let modelManager;
    let factory;
    let serializer;

    before(function () {
        securityContext = new SecurityContext('suchuser', 'suchpassword');
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        modelManager = sinon.createStubInstance(ModelManager);
        factory = sinon.createStubInstance(Factory);
        serializer = sinon.createStubInstance(Serializer);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#getAllTransactionRegistries', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.resolve([]);
            });
            return TransactionRegistry
                .getAllTransactionRegistries(securityContext, modelManager, factory, serializer)
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(securityContext, null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(securityContext, modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                TransactionRegistry.getAllTransactionRegistries(securityContext, modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the list of transaction registries', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.resolve(
                    [
                        {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'},
                        {id: '6165d4c2-73ee-43a6-b5b5-bac512a4894e', name: 'wow such registry'}
                    ]
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getAllTransactionRegistries(securityContext, modelManager, factory, serializer)
                .then(function (transactionRegistries) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.getAllRegistries);
                    sinon.assert.calledWith(Registry.getAllRegistries, securityContext, 'Transaction');

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

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getAllRegistries', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getAllTransactionRegistries(securityContext, modelManager, factory, serializer)
                .then(function (transactionRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#getTransactionRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.reject(new Error('fake error'));
            });
            return TransactionRegistry
                .getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .catch(function () {

                })
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when id not specified', function () {
            (function () {
                TransactionRegistry.getTransactionRegistry(securityContext, null, modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                TransactionRegistry.getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                TransactionRegistry.getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                TransactionRegistry.getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the transaction registry', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.resolve(
                    {id: 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', name: 'doge registry'}
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then(function (transactionRegistry) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.getRegistry);
                    sinon.assert.calledWith(Registry.getRegistry, securityContext, 'Transaction', 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d');

                    // Check that the transaction registries were returned correctly.
                    transactionRegistry.should.be.an.instanceOf(TransactionRegistry);
                    transactionRegistry.id.should.equal('d2d210a3-5f11-433b-aa48-f74d25bb0f0d');
                    transactionRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'getRegistry', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .getTransactionRegistry(securityContext, 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d', modelManager, factory, serializer)
                .then(function (transactionRegistries) {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addTransactionRegistry', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.resolve();
            });
            return TransactionRegistry
                .addTransactionRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function () {
                    sinon.assert.calledWith(stub, securityContext);
                });
        });

        it('should throw when id not specified', function () {
            (function () {
                TransactionRegistry.addTransactionRegistry(securityContext, null, 'doge registry', modelManager, factory, serializer);
            }).should.throw(/id not specified/);
        });

        it('should throw when name not specified', function () {
            (function () {
                TransactionRegistry.addTransactionRegistry(securityContext, 'suchid', null, modelManager, factory, serializer);
            }).should.throw(/name not specified/);
        });

        it('should throw when modelManager not specified', function () {
            (function () {
                TransactionRegistry.addTransactionRegistry(securityContext, 'suchid', 'doge registry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                TransactionRegistry.addTransactionRegistry(securityContext, 'suchid', 'doge registry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                TransactionRegistry.addTransactionRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should invoke the chain-code and return the transaction registry', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.resolve();
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .addTransactionRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function (transactionRegistry) {

                    // Check that the registry was requested correctly.
                    sinon.assert.calledOnce(Registry.addRegistry);
                    sinon.assert.calledWith(Registry.addRegistry, securityContext, 'Transaction', 'suchid', 'doge registry');

                    // Check that the transaction registry was returned successfully.
                    transactionRegistry.should.be.an.instanceOf(TransactionRegistry);
                    transactionRegistry.id.should.equal('suchid');
                    transactionRegistry.name.should.equal('doge registry');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Set up the responses from the chain-code.
            sandbox.stub(Registry, 'addRegistry', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the getAllTransactionRegistries function.
            return TransactionRegistry
                .addTransactionRegistry(securityContext, 'suchid', 'doge registry', modelManager, factory, serializer)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#constructor', function () {

        it('should throw when modelManager not specified', function () {
            (function () {
                new TransactionRegistry('suchid', 'wowsuchregistry', null, factory, serializer);
            }).should.throw(/modelManager not specified/);
        });

        it('should throw when factory not specified', function () {
            (function () {
                new TransactionRegistry('suchid', 'wowsuchregistry', modelManager, null, serializer);
            }).should.throw(/factory not specified/);
        });

        it('should throw when serializer not specified', function () {
            (function () {
                new TransactionRegistry('suchid', 'wowsuchregistry', modelManager, factory, null);
            }).should.throw(/serializer not specified/);
        });

        it('should create a new transaction registry', function () {
            let registry = new TransactionRegistry('suchid', 'wowsuchregistry', modelManager, factory, serializer);
            registry.id.should.equal('suchid');
            registry.name.should.equal('wowsuchregistry');
        });

    });

    describe('#add', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.add(securityContext, null);
            }).should.throw(/cannot add transactions to a transaction registry/);
        });

    });

    describe('#addAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.addAll(securityContext, null);
            }).should.throw(/cannot add transactions to a transaction registry/);
        });

    });

    describe('#update', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.update(securityContext, null);
            }).should.throw(/cannot update transactions in a transaction registry/);
        });

    });

    describe('#updateAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.updateAll(securityContext, null);
            }).should.throw(/cannot update transactions in a transaction registry/);
        });

    });

    describe('#remove', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.remove(securityContext, 'dogecar1');
            }).should.throw(/cannot remove transactions from a transaction registry/);
        });

    });

    describe('#removeAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            (() => {
                registry.removeAll(securityContext, null);
            }).should.throw(/cannot remove transactions from a transaction registry/);
        });

    });

    describe('#getAll', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(new Error('fake error'));
            });
            return registry
                .getAll(securityContext)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    sinon.assert.called(stub);
                    err.should.match(/fake error/);
                });
        });

        it('should query the chain-code', function () {

            // Create the transaction registry and other test data.
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let tx1 = sinon.createStubInstance(Resource);
            tx1.getIdentifier.returns('716e25ad-1b6f-4413-b216-6a965b3b0a82');
            let tx2 = sinon.createStubInstance(Resource);
            tx2.getIdentifier.returns('e3db0f84-8335-4f67-bd93-1a1de582a750');
            serializer.fromJSON.onFirstCall().returns(tx1);
            serializer.fromJSON.onSecondCall().returns(tx2);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {id: 'id1', data: '{}'},
                            {id: 'id2', data: '{}'}
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function (transactions) {

                    // Check that the transactions were returned successfully.
                    transactions.should.be.an('array');
                    transactions.should.have.lengthOf(2);
                    transactions.should.all.be.an.instanceOf(Resource);
                    transactions[0].getIdentifier().should.equal('716e25ad-1b6f-4413-b216-6a965b3b0a82');
                    transactions[1].getIdentifier().should.equal('e3db0f84-8335-4f67-bd93-1a1de582a750');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the transaction registry and other test data.
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

    describe('#get', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(new Error('fake error'));
            });
            return registry
                .get(securityContext, 'dogecar1')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((err) => {
                    sinon.assert.called(stub);
                    err.should.match(/fake error/);
                });
        });

        it('should query the chain-code', function () {

            // Create the transaction registry and other test data.
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);
            let tx = sinon.createStubInstance(Resource);
            tx.getIdentifier.returns('dogetx1');
            serializer.fromJSON.onFirstCall().returns(tx);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        {id: 'id1', data: '{}'}
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function (transaction) {

                    // Check that the transaction was returned successfully.
                    transaction.should.be.an.instanceOf(Resource);
                    transaction.getIdentifier().should.equal('dogetx1');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the transaction registry and other test data.
            let registry = new TransactionRegistry('d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'wowsuchregistry', modelManager, factory, serializer);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.reject(
                    new Error('failed to query chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to query chain-code/);
                });

        });

    });

});
