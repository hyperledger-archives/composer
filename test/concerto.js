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

const Serializer = require('@ibm/ibm-concerto-common').Serializer;
const Factory = require('@ibm/ibm-concerto-common').Factory;
const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const AssetRegistry = require('../lib/assetregistry');
const Concerto = require('..').Concerto;
const Connection = require('@ibm/ibm-concerto-common').Connection;
const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const Resource = require('@ibm/ibm-concerto-common').Resource;
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
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
    let mockBusinessNetwork;
    let mockFactory;
    let mockSerializer;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        securityContext = new SecurityContext('doge', 'suchsecret');
        mockConnection = sinon.createStubInstance(Connection);
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
        concerto = new Concerto( {connectionManager: mockConnectionManager});
        concerto.businessNetwork = mockBusinessNetwork;
        mockFactory = sinon.createStubInstance(Factory);
        concerto.businessNetwork.factory = mockFactory;
        mockSerializer = sinon.createStubInstance(Serializer);
        concerto.businessNetwork.getSerializer.returns(mockSerializer);
        concerto.securityContext = securityContext;
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should create a new instance', function () {
            concerto = new Concerto();
            should.equal(concerto.connection, null);
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

        it('should create a connection', () => {
            mockConnectionManager.connect.returns(Promise.resolve(mockConnection));

            return concerto.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret')
                .then(() => {
                    sinon.assert.calledOnce(mockConnectionManager.connect);
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

    describe('#getAllAssetRegistries', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAllAssetRegistries', function () {
                return Promise.resolve([]);
            });

            // Invoke the function.
            return concerto
                .getAllAssetRegistries()
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
                .getAllAssetRegistries()
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
                .getAssetRegistry('ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry')
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
                .getAssetRegistry('ad99fcfa-6d3c-4281-b47f-0ccda7998039', 'wowsuchregistry')
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

            concerto.securityContext = securityContext;

            // Invoke the function.
            return concerto
                .addAssetRegistry('suchid', 'wowsuchregistry')
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
                .addAssetRegistry('suchid', 'wowsuchregistry')
                .then(function () {
                    sinon.assert.calledOnce(stub);
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
                .getTransactionRegistry()
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
                .getTransactionRegistry()
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
                .getTransactionRegistry()
                .then(function () {
                    throw new Error('should not get here');
                })
                .catch(function (error) {
                    error.should.match(/default transaction registry/);
                });

        });

    });

    describe('#submitTransaction', function () {

        it('should throw when transaction not specified', function () {
            (function () {
                concerto.submitTransaction(null);
            }).should.throw(/transaction not specified/);
        });

        it('should throw when type is not a transaction', function () {
            let assetDecl = sinon.createStubInstance(AssetDeclaration);
            let asset = sinon.createStubInstance(Resource);
            assetDecl.getFullyQualifiedName.returns('such.ns.suchType');
            asset.getClassDeclaration.returns(assetDecl);
            mockFactory.newInstance.returns(asset);
            (function () {
                concerto.submitTransaction(asset);
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
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the submitTransaction function.
            return concerto
                .submitTransaction(tx)
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
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(tx)
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
            mockSerializer.toJSON.returns(JSON.parse(json));

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.resolve();
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(tx)
                .then(function () {

                    // Check the timestamp was added.
                    sinon.assert.calledWith(mockSerializer.toJSON, sinon.match((tx) => {
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
            mockSerializer.toJSON.returns(json);

            // Set up the responses from the chain-code.
            sandbox.stub(Util, 'invokeChainCode', function () {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return concerto
                .submitTransaction(tx)
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
            return concerto.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.returns(Promise.resolve(Buffer.from(JSON.stringify({
                version: version
            }))));
            concerto.connection = mockConnection;
            return concerto.ping()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

});
