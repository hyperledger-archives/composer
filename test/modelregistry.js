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

const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('../lib/modelregistry');
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const Util = require('@ibm/ibm-concerto-common').Util;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ModelRegistry', function () {

    let securityContext;
    let sandbox;
    let modelManager;

    before(function () {
        securityContext = new SecurityContext('suchuser', 'suchpassword');
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        modelManager = sinon.createStubInstance(ModelManager);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should throw when modelManager not specified', function () {
            (function () {
                new ModelRegistry(null);
            }).should.throw(/modelManager not specified/);
        });

        it('should create a new model registry', function () {
            let modelRegistry = new ModelRegistry(modelManager);
            modelRegistry.modelManager.should.equal(modelManager);
        });

    });

    describe('#add', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('dogecar1');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .add(securityContext, model)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.doge');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return registry
                .add(securityContext, model)
                .then(() => {
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'addModelToRegistry', [JSON.stringify({ definitions: 'namespace org.acme.test'})]);
                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.doge');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return registry
                .add(securityContext, model)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#addAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new ModelRegistry(modelManager);
            (() => {
                registry.addAll(securityContext, null);
            }).should.throw(/cannot bulk add models to a model registry/);
        });

    });

    describe('#update', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('dogecar1');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .update(securityContext, model)
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.doge');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry
                .update(securityContext, model)
                .then(() => {
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'updateModelInRegistry', [JSON.stringify({ definitions: 'namespace org.acme.test'})]);
                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.doge');
            model.toJSON.returns({ definitions: 'namespace org.acme.test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .update(securityContext, model)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#updateAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new ModelRegistry(modelManager);
            (() => {
                registry.updateAll(securityContext, null);
            }).should.throw(/cannot bulk update models in a model registry/);
        });

    });

    describe('#remove', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new ModelRegistry(modelManager);
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });
            return registry
                .remove(securityContext, 'dogecar1')
                .then(() => {
                    sinon.assert.called(stub);
                });
        });

        it('should invoke the chain-code when given an ID', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            return registry.remove(securityContext, 'dogemodel1');

        });

        it('should invoke the chain-code when given a model', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the update function.
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.doge');
            return registry
                .remove(securityContext, model)
                .then(() => {
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'removeModelFromRegistry', ['org.doge']);
                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model = sinon.createStubInstance(ModelFile);
            model.getNamespace.returns('org.acme');

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the update function.
            return registry
                .remove(securityContext, model)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#removeAll', function () {

        it('should throw an unsupported operation when called', function () {
            let registry = new ModelRegistry(modelManager);
            (() => {
                registry.removeAll(securityContext, null);
            }).should.throw(/cannot bulk remove models from a model registry/);
        });

    });

    describe('#getAll', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new ModelRegistry(modelManager);
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

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model1 = sinon.createStubInstance(ModelFile);
            model1.getNamespace.returns('org.acme');

            let model2 = sinon.createStubInstance(ModelFile);
            model2.getNamespace.returns('org.baz');
            sandbox.stub(ModelFile, 'fromJSON').onFirstCall().returns(model1).onSecondCall().returns(model2);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        [
                            {'fake':'json for the test'},
                            {'fake2':'json for the test'}
                        ]
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .getAll(securityContext)
                .then(function (models) {

                    // Check that the models were returned successfully.
                    models.should.be.an('array');
                    models.should.have.lengthOf(2);
                    models.should.all.be.an.instanceOf(ModelFile);
                    models[0].getNamespace().should.equal('org.acme');
                    models[1].getNamespace().should.equal('org.baz');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);

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

        it('should throw if id not specified', () => {
            (() => {
                let registry = new ModelRegistry(modelManager);
                registry.get(securityContext, null);
            }).should.throw(/id not specified/);
        });

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            let registry = new ModelRegistry(modelManager);
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

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);
            let model1 = sinon.createStubInstance(ModelFile);
            model1.getNamespace.returns('dogemodel1');
            sandbox.stub(ModelFile, 'fromJSON').returns(model1);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'queryChainCode', function () {
                return Promise.resolve(
                    Buffer.from(JSON.stringify(
                        {'fake':'json for the test'}
                    ))
                );
            });

            // Invoke the add function.
            return registry
                .get(securityContext, 'dogecar1')
                .then(function (model) {

                    // Check that the models were returned successfully.
                    model.should.be.an.instanceOf(ModelFile);
                    model.getNamespace().should.equal('dogemodel1');

                });

        });

        it('should handle an error from the chain-code', function () {

            // Create the model registry and other test data.
            let registry = new ModelRegistry(modelManager);

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
