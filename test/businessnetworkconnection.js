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
const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const AssetRegistry = require('../lib/assetregistry');
const BusinessNetworkConnection = require('..').BusinessNetworkConnection;
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

describe('BusinessNetworkConnection', () => {

    let sandbox;
    let businessNetworkConnection;
    let securityContext;
    let mockConnection;
    let mockBusinessNetworkDefinition;
    let mockModelManager;
    let mockFactory;
    let mockSerializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        securityContext = new SecurityContext('doge', 'suchsecret');
        mockConnection = sinon.createStubInstance(Connection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        businessNetworkConnection = new BusinessNetworkConnection();
        businessNetworkConnection.businessNetwork = mockBusinessNetworkDefinition;
        mockModelManager = sinon.createStubInstance(ModelManager);
        businessNetworkConnection.businessNetwork.getModelManager.returns(mockModelManager);
        mockFactory = sinon.createStubInstance(Factory);
        businessNetworkConnection.businessNetwork.getFactory.returns(mockFactory);
        mockSerializer = sinon.createStubInstance(Serializer);
        businessNetworkConnection.businessNetwork.getSerializer.returns(mockSerializer);
        businessNetworkConnection.securityContext = securityContext;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a new instance', () => {
            businessNetworkConnection = new BusinessNetworkConnection();
            should.equal(businessNetworkConnection.connection, null);
        });

    });

    describe('#connect', () => {

        it('should create a connection and download the business network archive', () => {
            sandbox.stub(businessNetworkConnection.connectionProfileManager, 'connect').resolves(mockConnection);
            mockConnection.login.resolves(securityContext);
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(securityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);

            return businessNetworkConnection.connect('testprofile', 'testnetwork', 'enrollmentID', 'enrollmentSecret')
            .then(() => {
                sinon.assert.calledOnce(businessNetworkConnection.connectionProfileManager.connect);
                sinon.assert.calledWith(businessNetworkConnection.connectionProfileManager.connect, 'testprofile', 'testnetwork');
                sinon.assert.calledOnce(mockConnection.login);
                sinon.assert.calledWith(mockConnection.login, 'enrollmentID', 'enrollmentSecret');
                sinon.assert.calledOnce(Util.queryChainCode);
                sinon.assert.calledWith(Util.queryChainCode, securityContext, 'getBusinessNetwork', []);
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, Buffer.from('aGVsbG8=', 'base64'));
                businessNetworkConnection.connection.should.equal(mockConnection);
            });
        });
    });

    describe('#disconnect', () => {

        it('should do nothing if not connected', () => {
            return businessNetworkConnection.disconnect();
        });

        it('should disconnect the connection if connected', () => {
            mockConnection.disconnect.returns(Promise.resolve());
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.disconnect);
                    return businessNetworkConnection.disconnect();
                })
                .then(() => {
                    should.equal(businessNetworkConnection.connection, null);
                    sinon.assert.calledOnce(mockConnection.disconnect);
                });
        });

    });

    describe('#getAllAssetRegistries', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllAssetRegistries()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry1 = sinon.createStubInstance(AssetRegistry);
            let assetRegistry2 = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAllAssetRegistries').resolves([assetRegistry1, assetRegistry2]);

            // Invoke the function.
            return businessNetworkConnection
                .getAllAssetRegistries()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.have.lengthOf(2);
                    result[0].should.equal(assetRegistry1);
                    result[1].should.equal(assetRegistry2);
                });

        });

    });

    describe('#getAssetRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves({});

            // Invoke the function.
            return businessNetworkConnection
                .getAssetRegistry('wowsuchregistry')
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'getAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .getAssetRegistry('wowsuchregistry')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#addAssetRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves();

            businessNetworkConnection.securityContext = securityContext;

            // Invoke the function.
            return businessNetworkConnection
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let assetRegistry = sinon.createStubInstance(AssetRegistry);
            let stub = sandbox.stub(AssetRegistry, 'addAssetRegistry').resolves(assetRegistry);

            // Invoke the function.
            return businessNetworkConnection
                .addAssetRegistry('wowsuchregistry', 'much assets are here')
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), 'wowsuchregistry', 'much assets are here', sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(assetRegistry);
                });

        });

    });

    describe('#getTransactionRegistry', () => {

        it('should perform a security check', () => {

            // Set up the mock.
            let stub = sandbox. stub(Util, 'securityCheck');
            let transactionRegistry = sinon.createStubInstance(TransactionRegistry);
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([transactionRegistry]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .then(() => {
                    sinon.assert.calledOnce(stub);
                });

        });

        it('should call the static helper method', () => {

            // Set up the mock.
            let mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
            let stub = sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([mockTransactionRegistry]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .then((result) => {
                    sinon.assert.calledOnce(stub);
                    sinon.assert.calledWith(stub, sinon.match.instanceOf(SecurityContext), sinon.match.instanceOf(ModelManager), sinon.match.instanceOf(Factory), sinon.match.instanceOf(Serializer));
                    result.should.equal(mockTransactionRegistry);
                });

        });

        it('should throw when the default transaction registry does not exist', () => {

            // Set up the mock.
            sandbox.stub(TransactionRegistry, 'getAllTransactionRegistries').resolves([]);

            // Invoke the function.
            return businessNetworkConnection
                .getTransactionRegistry()
                .should.be.rejectedWith(/default transaction registry/);

        });

    });

    describe('#submitTransaction', () => {

        it('should throw when transaction not specified', () => {
            (function () {
                businessNetworkConnection.submitTransaction(null);
            }).should.throw(/transaction not specified/);
        });

        it('should throw when type is not a transaction', () => {
            let assetDecl = sinon.createStubInstance(AssetDeclaration);
            let asset = sinon.createStubInstance(Resource);
            assetDecl.getFullyQualifiedName.returns('such.ns.suchType');
            asset.getClassDeclaration.returns(assetDecl);
            mockFactory.newInstance.returns(asset);
            (function () {
                businessNetworkConnection.submitTransaction(asset);
            }).should.throw(/such\.ns\.suchType is not a transaction/);
        });

        it('should invoke the chain-code', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

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
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the submitTransaction function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'c89291eb-969f-4b04-b653-82deb5ee0ba1', json]);
                });

        });

        it('should generate a transaction ID if one not specified', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

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
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

                    // Check that the query was made successfully.
                    sinon.assert.calledOnce(Util.invokeChainCode);
                    sinon.assert.calledWith(Util.invokeChainCode, securityContext, 'submitTransaction', ['d2d210a3-5f11-433b-aa48-f74d25bb0f0d', 'c89291eb-969f-4b04-b653-82deb5ee0ba1', json]);

                });

        });

        it('should generate a transaction timestamp if one not specified', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

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
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.resolve();
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {

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

        it('should handle an error from the chain-code', () => {

            // Fake the transaction registry.
            let txRegistry = sinon.createStubInstance(TransactionRegistry);
            txRegistry.id = 'd2d210a3-5f11-433b-aa48-f74d25bb0f0d';
            sandbox.stub(businessNetworkConnection, 'getTransactionRegistry').returns(Promise.resolve(txRegistry));

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
            sandbox.stub(Util, 'invokeChainCode', () => {
                return Promise.reject(
                    new Error('failed to invoke chain-code')
                );
            });

            // Invoke the add function.
            return businessNetworkConnection
                .submitTransaction(tx)
                .then(() => {
                    throw new Error('should not get here');
                }).catch((error) => {
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
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(Util.securityCheck);
                });
        });

        it('should ping the connection', () => {
            mockConnection.ping.returns(Promise.resolve(Buffer.from(JSON.stringify({
                version: version
            }))));
            businessNetworkConnection.connection = mockConnection;
            return businessNetworkConnection.ping()
                .then(() => {
                    sinon.assert.calledOnce(mockConnection.ping);
                });
        });

    });

});
