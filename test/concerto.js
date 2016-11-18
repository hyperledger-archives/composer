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

const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const AssetRegistry = require('../lib/assetregistry');
const Concerto = require('..').Concerto;
const Connection = require('@ibm/ibm-concerto-common').Connection;
const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelFile = require('@ibm/ibm-concerto-common').ModelFile;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const ModelRegistry = require('../lib/modelregistry');
const Resource = require('@ibm/ibm-concerto-common').Resource;
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const TransactionDeclaration = require('@ibm/ibm-concerto-common').TransactionDeclaration;
const TransactionRegistry = require('../lib/transactionregistry');
const Util = require('@ibm/ibm-concerto-common').Util;
const uuid = require('node-uuid');
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Concerto', function () {

    let sandbox;
    let concerto;
    let securityContext;
    let mockConnection;
    let mockConnectionManager;
    let mockSecurityContext;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        concerto = new Concerto();
        securityContext = new SecurityContext('doge', 'suchsecret');
        mockConnection = sinon.createStubInstance(Connection);
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        concerto.connectionManager = mockConnectionManager;
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should create a new instance', function () {
            concerto = new Concerto();
            concerto.modelManager.should.be.an.instanceOf(ModelManager);
            concerto.factory.should.be.an.instanceOf(Factory);
            concerto.serializer.should.be.an.instanceOf(Serializer);
            should.equal(concerto.connection, null);
        });

        it('should allow development mode to be enabled', function () {
            concerto = new Concerto({
                developmentMode: true
            });
            concerto.developmentMode.should.equal(true);
        });

        it('should allow a custom connection manager to be specified', function () {
            let mockConnectionManager2 = sinon.createStubInstance(ConnectionManager);
            let mockConnection2 = sinon.createStubInstance(Connection);
            mockConnectionManager2.connect.resolves(mockConnection2);
            concerto = new Concerto({
                connectionManager: mockConnectionManager2
            });
            concerto.connectionManager.should.equal(mockConnectionManager2);
        });

    });

    describe('#connect', function () {

        it('should throw when connectOptions not specified', function () {
            (function () {
                concerto.connect();
            }).should.throw(/connectOptions not specified/);
        });

        it('should create a connection', () => {
            let options = { option: 'one' };
            mockConnectionManager.connect.returns(Promise.resolve(mockConnection));
            return concerto.connect(options)
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.connect);
                    sinon.assert.calledWith(mockConnectionManager.connect, options);
                    concerto.connection.should.equal(mockConnection);
                });
        });

    });

    describe('#disconnect', function () {

        it('should do nothing if not connected', () => {
            return concerto.disconnect();
        });

        it('should disconnect the connection if connected', () => {
            mockConnection.disconnect.returns(Promise.resolve());
            concerto.connection = mockConnection;
            return concerto.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.disconnect);
                    return concerto.disconnect();
                })
                .then(() => {
                    should.equal(concerto.connection, null);
                    sinon.assert.calledOnce(mockConnection.disconnect);
                });
        });

    });

    describe('#login', function () {

        it('should throw when enrollmentID not specified', function () {
            (function () {
                concerto.login(null, 'suchsecret');
            }).should.throw(/enrollmentID not specified/);
        });

        it('should throw when enrollmentSecret not specified', function () {
            (function () {
                concerto.login('doge', null);
            }).should.throw(/enrollmentSecret not specified/);
        });

        it('should login using the connection', () => {
            mockConnection.login.returns(Promise.resolve(mockSecurityContext));
            concerto.connection = mockConnection;
            return concerto.login('doge', 'suchsecret')
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.login);
                    sinon.assert.calledWith(mockConnection.login, 'doge', 'suchsecret');
                });
        });

    });

    describe('#deploy', function () {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck').throws(new Error('fake error'));
            try {
                concerto.deploy(mockSecurityContext);
            } catch (e) {
                e.should.match(/fake error/);
                sinon.assert.calledOnce(Util.securityCheck);
            }
        });

        it('should deploy the Concerto chain-code to the Hyperledger Fabric', function () {

            // Set up the responses from the chain-code.
            mockConnection.deploy.returns(Promise.resolve());
            concerto.connection = mockConnection;

            // Invoke the getAllAssetRegistries function.
            return concerto
                .deploy(securityContext)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(mockConnection.deploy);

                });

        });

    });

    describe('#getAllAssetRegistries', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAllAssetRegistries', function () {
                return Promise.resolve([]);
            });

            // Invoke the function.
            return concerto
                .getAllAssetRegistries(securityContext)
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let stub = sandbox.stub(AssetRegistry, 'getAllAssetRegistries', function () {
                return Promise.resolve([]);
            });

            // Invoke the function.
            return concerto
                .getAllAssetRegistries(securityContext)
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

    });

    describe('#getAssetRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAssetRegistry', function () {
                return Promise.resolve({});
            });

            // Invoke the function.
            return concerto
                .getAssetRegistry(securityContext, 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry')
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let stub = sandbox.stub(AssetRegistry, 'getAssetRegistry', function () {
                return Promise.resolve({});
            });

            // Invoke the function.
            return concerto
                .getAssetRegistry(securityContext, 'ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry')
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

    });

    describe('#addAssetRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            sandbox.stub(AssetRegistry, 'addAssetRegistry', function () {
                return Promise.resolve(assetRegistry);
            });

            // Invoke the function.
            return concerto
                .addAssetRegistry(securityContext, 'suchid', 'wowsuchregistry')
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                    result.should.be.an.instanceOf(AssetRegistry);
                    result.should.equal(assetRegistry);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let stub = sandbox.stub(AssetRegistry, 'addAssetRegistry', function () {
                return Promise.resolve({});
            });

            // Invoke the function.
            return concerto
                .addAssetRegistry(securityContext, 'suchid', 'wowsuchregistry')
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

    });

    describe('#getModelRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');

            // Invoke the function.
            return concerto
                .getModelRegistry(securityContext)
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Invoke the function.
            return concerto
                .getModelRegistry(securityContext)
                .then(function (modelRegistry) {
                    modelRegistry.should.be.an.instanceOf(ModelRegistry);
                });

        });

    });

    describe('#getTransactionRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries', function () {
                return Promise.resolve([{}]);
            });

            // Invoke the function.
            return concerto
                .getTransactionRegistry(securityContext)
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries', function () {
                return Promise.resolve([mockTransactionRegistry]);
            });

            // Invoke the function.
            return concerto
                .getTransactionRegistry(securityContext)
                .then(function (transactionRegistry) {
                    transactionRegistry.should.be.an.instanceOf(TransactionRegistry);
                });

        });

        it('should throw when the default transaction registry does not exist', function () {

            // Set up the mock.
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries', function () {
                return Promise.resolve([]);
            });

            // Invoke the function.
            return concerto
                .getTransactionRegistry(securityContext)
                .then(function () {
                    throw new Error('should not get here');
                })
                .catch(function (error) {
                    error.should.match(/default transaction registry/);
                });

        });

    });

    describe('#getFactory', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            concerto.getFactory(securityContext);
            sinon.assert.calledOnce(stub);
        });

        it('should return a valid factory', function () {
            let factory = concerto.getFactory(securityContext);
            factory.should.be.an.instanceOf(Factory);
        });

    });

    describe('#getModelManager', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            concerto.getModelManager(securityContext);
            sinon.assert.calledOnce(stub);
        });

        it('should return a valid factory', function () {
            let factory = concerto.getModelManager(securityContext);
            factory.should.be.an.instanceOf(ModelManager);
        });

    });

    describe('#getSerializer', function () {

        it('should perform a security check', function () {
            let stub = sandbox.stub(Util, 'securityCheck');
            concerto.getSerializer(securityContext);
            sinon.assert.calledOnce(stub);
        });

        it('should return a valid factory', function () {
            let factory = concerto.getSerializer(securityContext);
            factory.should.be.an.instanceOf(Serializer);
        });

    });

    describe('#loadModels', function () {

        it('should add all of the models in the model registry to the model manager', () => {
            let modelFile1 = sinon.createStubInstance(ModelFile);
            let modelFile2 = sinon.createStubInstance(ModelFile);
            let modelRegistry = sinon.createStubInstance(ModelRegistry);
            let modelManager = concerto.getModelManager(securityContext);
            sandbox.stub(modelManager, 'clearModelFiles');
            sandbox.stub(modelManager, 'addModelFiles');
            sandbox.stub(concerto, 'getModelRegistry').returns(Promise.resolve(modelRegistry));
            modelRegistry.getAll.returns(Promise.resolve([modelFile1, modelFile2]));
            return concerto
                .loadModels(securityContext)
                .then(() => {
                    sinon.assert.calledOnce(modelManager.clearModelFiles);
                    sinon.assert.calledOnce(modelManager.addModelFiles);
                    sinon.assert.calledWith(modelManager.addModelFiles, [modelFile1, modelFile2]);
                });
        });

    });

    describe('#saveModels', function () {

        it('should add all of the models in the model manager to the model registry', () => {
            let modelFile1 = sinon.createStubInstance(ModelFile);
            let modelFile2 = sinon.createStubInstance(ModelFile);
            let modelRegistry = sinon.createStubInstance(ModelRegistry);
            let modelManager = concerto.getModelManager(securityContext);
            sandbox.stub(modelManager, 'getModelFiles').returns([modelFile1, modelFile2]);
            sandbox.stub(concerto, 'getModelRegistry').returns(Promise.resolve(modelRegistry));
            modelRegistry.add.returns(Promise.resolve());
            return concerto
                .saveModels(securityContext)
                .then(() => {
                    sinon.assert.calledOnce(modelManager.getModelFiles);
                    sinon.assert.calledTwice(modelRegistry.add);
                    sinon.assert.calledWith(modelRegistry.add, securityContext, modelFile1);
                    sinon.assert.calledWith(modelRegistry.add, securityContext, modelFile2);
                });
        });

    });

    describe('#createTransation', function () {

        it('should create a new transaction instance', function () {
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            tx.getClassDeclaration.returns(txDecl);
            sandbox.stub(concerto.factory, 'newInstance').returns(tx);
            let result = concerto.getFactory(securityContext).newTransaction(securityContext, 'such.ns', 'suchType');
            result.should.be.an.instanceOf(Resource);
            result.should.equal(tx);
        });

        it('should throw when ns not specified', function () {
            (function () {
                concerto.getFactory(securityContext).newTransaction(null, 'suchType');
            }).should.throw(/ns not specified/);
        });

        it('should throw when type not specified', function () {
            (function () {
                concerto.getFactory(securityContext).newTransaction('such.ns', null);
            }).should.throw(/type not specified/);
        });

        it('should throw when type is not a transaction', function () {
            let assetDecl = sinon.createStubInstance(AssetDeclaration);
            let asset = sinon.createStubInstance(Resource);
            assetDecl.getFullyQualifiedName.returns('such.ns.suchType');
            asset.getClassDeclaration.returns(assetDecl);
            sandbox.stub(concerto.factory, 'newInstance').returns(asset);
            (function () {
                concerto.getFactory(securityContext).newTransaction('such.ns', 'suchType');
            }).should.throw(/such\.ns\.suchType is not a transaction/);
        });

    });

    describe('#submitTransaction', function () {

        it('should throw when transaction not specified', function () {
            (function () {
                concerto.submitTransaction(securityContext, null);
            }).should.throw(/transaction not specified/);
        });

        it('should throw when type is not a transaction', function () {
            let assetDecl = sinon.createStubInstance(AssetDeclaration);
            let asset = sinon.createStubInstance(Resource);
            assetDecl.getFullyQualifiedName.returns('such.ns.suchType');
            asset.getClassDeclaration.returns(assetDecl);
            sandbox.stub(concerto.factory, 'newInstance').returns(asset);
            (function () {
                concerto.submitTransaction(securityContext, asset);
            }).should.throw(/such\.ns\.suchType is not a transaction/);
        });

        it('should invoke the chain-code', function () {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(concerto, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);
            tx.getIdentifier.returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');
            tx.timestamp = new Date();

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            let serializer = concerto.getSerializer(securityContext);
            sandbox.stub(serializer, 'toJSON').returns({fake: 'json for the test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(securityContext, tx)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'c89291eb-969f-4b04-b653-82deb5ee0ba1', json]);

                });

        });

        it('should generate a transaction ID if one not specified', function () {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(concerto, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            let serializer = concerto.getSerializer(securityContext);
            sandbox.stub(serializer, 'toJSON').returns({fake: 'json for the test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(securityContext, tx)
                .then(function () {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'c89291eb-969f-4b04-b653-82deb5ee0ba1', json]);

                });

        });

        it('should generate a transaction timestamp if one not specified', function () {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(concerto, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);

            // Stub the UUID generator.
            sandbox.stub(uuid, 'v4').returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            let serializer = concerto.getSerializer(securityContext);
            sandbox.stub(serializer, 'toJSON').returns({fake: 'json for the test'});

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(securityContext, tx)
                .then(function () {

                    // Check the timestamp was added.
                    sinon.assert.calledWith(serializer.toJSON, sinon.match((tx) => {
                        tx.timestamp.should.be.an.instanceOf(Date);
                        return true;
                    }));

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'c89291eb-969f-4b04-b653-82deb5ee0ba1', json]);

                });

        });

        it('should handle an error from the chain-code', function () {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(concerto, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

            // Create the transaction.
            let txDecl = sinon.createStubInstance(TransactionDeclaration);
            let tx = sinon.createStubInstance(Resource);
            txDecl.getFullyQualifiedName.returns('such.ns.suchType');
            tx.getClassDeclaration.returns(txDecl);
            tx.getIdentifier.returns('c89291eb-969f-4b04-b653-82deb5ee0ba1');

            // Force the transaction to be serialized as some fake JSON.
            const json = '{"fake":"json for the test"}';
            let serializer = concerto.getSerializer(securityContext);
            sandbox.stub(serializer, 'toJSON').returns(json);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(securityContext, tx)
                .then(function () {
                    throw new Error('should not get here');
                }).catch(function (error) {
                    error.should.match(/failed to invoke chain-code/);
                });

        });

    });

    describe('#ping', () => {

        it('should perform a security check', () => {
            sandbox.stub(Util, 'securityCheck');
            mockConnection.ping.returns(Promise.resolve(Buffer.from(JSON.stringify({
                version: version
            }))));
            concerto.connection = mockConnection;
            return concerto.ping(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.returns(Promise.resolve(Buffer.from(JSON.stringify({
                version: version
            }))));
            concerto.connection = mockConnection;
            return concerto.ping(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

});
