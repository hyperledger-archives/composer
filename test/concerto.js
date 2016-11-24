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
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
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
    let mockBusinessNetwork;
    let mockModelManager;
    let mockFactory;
    let mockSerializer;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        securityContext = new SecurityContext('doge', 'suchsecret');
        mockConnection = sinon.createStubInstance(Connection);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
        concerto = new Concerto();
        concerto.businessNetwork = mockBusinessNetwork;
        mockModelManager = sinon.createStubInstance(ModelManager);
        concerto.businessNetwork.getModelManager.returns(mockModelManager);
        mockFactory = sinon.createStubInstance(Factory);
        concerto.businessNetwork.getFactory.returns(mockFactory);
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

    });

    describe('#connect', function () {

        it('should create a connection and download the business network archive', () => {
            sandbox.stub(concerto.connectionProfileManager, 'connect').resolves(mockConnection);
            mockConnection.login.resolves(securityContext);
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(securityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(BusinessNetwork, 'fromArchive').resolves(mockBusinessNetwork);

            return concerto.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret')
            .then(() => {
                sinon.assert.calledOnce(concerto.connectionProfileManager.connect);
                sinon.assert.calledWith(concerto.connectionProfileManager.connect, 'testprofile', 'testnetwork');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'enrollmentID', 'enrollmentSecret');
                sinon.assert.calledOnce(Util.queryChainCode);
                sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getBusinessNetwork', []);
                sinon.assert.calledOnce(BusinessNetwork.fromArchive);
                sinon.assert.calledWith(BusinessNetwork.fromArchive, Buffer.from('aGVsbG8=', 'base64'));
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
            sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([]);

            // Invoke the function.
            return concerto
                .getAllAssetRegistries()
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let assetRegistry1 = sinon.createStubInstance(AssetRegistry);
            let assetRegistry2 = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([assetRegistry1, assetRegistry2]);

            // Invoke the function.
            return concerto
                .getAllAssetRegistries()
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.have.lengthOf(2);
                    result[0].should.equal(assetRegistry1);
                    result[1].should.equal(assetRegistry2);
                });

        });

    });

    describe('#getAssetRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves({});

            // Invoke the function.
            return concerto
                .getAssetRegistry('wowsuchregistry')
                .then(function () {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return concerto
                .getAssetRegistry('wowsuchregistry')
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#addAssetRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves();

            concerto.securityContext = securityContext;

            // Invoke the function.
            return concerto
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', function () {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return concerto
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', 'much assets are here', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#getTransactionRegistry', function () {

        it('should perform a security check', function () {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            let transactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([transactionRegistry]);

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
            let stub = sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([mockTransactionRegistry]);

            // Invoke the function.
            return concerto
                .getTransactionRegistry()
                .then(function (result) {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockTransactionRegistry);
                });

        });

        it('should throw when the default transaction registry does not exist', function () {

            // Set up the mock.
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([]);

            // Invoke the function.
            return concerto
                .getTransactionRegistry()
                .should.be.rejectedWith(/default transaction registry/);

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
