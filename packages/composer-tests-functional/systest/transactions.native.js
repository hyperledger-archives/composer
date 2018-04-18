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

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;
const fs = require('fs');
const IdCard = require('composer-common').IdCard;
const path = require('path');
const TestUtil = require('./testutil');
const uuid = require('uuid');

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.should();

if (process.setMaxListeners) {
    process.setMaxListeners(Infinity);
}

let client;
let otherClient;
let cardStore;
let otherCardStore;
let bnID;
let otherBnID;
let businessNetworkDefinition;

let createAsset = (assetId) => {
    let factory = client.getBusinessNetwork().getFactory();
    let asset = factory.newResource('systest.transactions', 'SimpleStringAsset', assetId);
    asset.stringValue = 'hello world';
    return asset;
};

let deployCommon = async () => {
    const modelFiles = [
        { fileName : 'models/accesscontrols.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/accesscontrols.cto'), 'utf8') },
        { fileName : 'models/participants.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/participants.cto'), 'utf8') },
        { fileName : 'models/assets.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/assets.cto'), 'utf8') },
        { fileName : 'models/transactions.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.cto'), 'utf8') }
    ];
    const scriptFiles = [
        { identifier : 'transactions.js', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.js'), 'utf8') }
    ];
    businessNetworkDefinition = new BusinessNetworkDefinition('common-native-network@0.0.1', 'The network for the access controls system tests');
    modelFiles.forEach((modelFile) => {
        businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
    });
    scriptFiles.forEach((scriptFile) => {
        let scriptManager = businessNetworkDefinition.getScriptManager();
        scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
    });
    let aclFile = businessNetworkDefinition.getAclManager().createAclFile('permissions.acl', fs.readFileSync(path.resolve(__dirname, 'data/common-network/permissions.acl'), 'utf8'));
    businessNetworkDefinition.getAclManager().setAclFile(aclFile);

    bnID = businessNetworkDefinition.getName();
    return TestUtil.deploy(businessNetworkDefinition);
};

let deployOther = async (cardName, networkName, otherChannel) => {
    const modelFiles = [
        {
            fileName : 'models/transactions.assets.cto',
            contents : fs.readFileSync(path.resolve(__dirname, 'data/transactions.assets.cto'), 'utf8')
        }
    ];
    const scriptFiles = [
        {
            identifier : 'transactions.assets.js',
            contents : fs.readFileSync(path.resolve(__dirname, 'data/transactions.assets.js'), 'utf8')
        }
    ];
    let otherBusinessNetworkDefinition = new BusinessNetworkDefinition(networkName + '@0.0.1', 'The network for testing innvoke chain code');
    modelFiles.forEach((modelFile) => {
        otherBusinessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
    });
    scriptFiles.forEach((scriptFile) => {
        let scriptManager = otherBusinessNetworkDefinition.getScriptManager();
        scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
    });
    otherBnID = otherBusinessNetworkDefinition.getName();
    return TestUtil.deploy(otherBusinessNetworkDefinition, cardName, otherChannel);
};

let checkError = (error) => {
    if (TestUtil.isWeb()) {
        error.message.should.equal('Native API not available in web runtime');
    } else if (TestUtil.isEmbedded() || TestUtil.isProxy()) {
        error.message.should.equal('Native API not available in embedded runtime');
    } else {
        throw error;
    }
};

describe('Native API', function () {

    this.retries(TestUtil.retries());

    before(async () => {
        await TestUtil.setUp();
        cardStore = await deployCommon();
        client = await TestUtil.getClient(cardStore,'common-native-network');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
    });

    afterEach(async () => {
        client = await TestUtil.getClient(cardStore,'common-native-network');
    });

    describe('Simple Native API', () => {
        it('should call the native api to add an asset', async () => {
            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.transactions', 'SimpleNativePutStateTransaction');
            transaction.stringValue = 'hello from a native api';
            transaction.assetId = 'nativeAPIAsset';

            try {
                await client.submitTransaction(transaction);

                const assetRegistry = await client.getAssetRegistry('systest.transactions.SimpleStringAsset');

                const asset = await assetRegistry.get('nativeAPIAsset');
                asset.stringValue.should.equal('hello from a native api');
            } catch (error) {
                checkError(error);
            }
        });

        it('should get the history of an asset', async () => {
            const assetRegistry = await client.getAssetRegistry('systest.transactions.SimpleStringAsset');

            const randomNumber = uuid.v4();
            const assetId = 'nativeAssetHistory' + randomNumber;
            const asset = createAsset(assetId);
            await assetRegistry.add(asset);

            asset.stringValue = 'hello bob';
            await assetRegistry.update(asset);

            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.transactions', 'SimpleNativeHistoryTransaction');
            transaction.assetId = assetId;
            transaction.nativeSupport = !!TestUtil.isHyperledgerFabricV1();

            try {
                return client.submitTransaction(transaction);
            } catch (error) {
                checkError(error);
            }
        });
    });

    /**
     * These tests will only be run on a real fabric.
     * The simple tests make sure an error happens when you use embedded or web runtime
     */
    describe('Advanced Native API', () => {
        let deployOtherNetwork = async (cardName, networkName, otherChannel) => {
            otherCardStore = await deployOther(cardName, networkName, otherChannel);
            otherClient = new BusinessNetworkConnection({cardStore : otherCardStore});
            await otherClient.connect(cardName);
        };

        it('should invoke chain code on the same channel', async () => {
            if (TestUtil.isHyperledgerFabricV1()) {
                await deployOtherNetwork('otherCard', 'systest-other-network', false);
                let assetRegistry = await otherClient.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');

                let otherFactory = otherClient.getBusinessNetwork().getFactory();
                let asset = otherFactory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'assetOnDifferentNetwork');
                asset.stringValue = 'hello new world';
                await assetRegistry.add(asset);

                let adminConnection = new AdminConnection(cardStore);

                let card = await adminConnection.exportCard('admincard');

                let credentials = card.getCredentials();

                let cert = credentials.certificate;

                await otherClient.bindIdentity('resource:org.hyperledger.composer.system.NetworkAdmin#admin', cert);

                let connectionProfile = card.getConnectionProfile();
                let newCard = new IdCard({userName : 'admin', businessNetwork : otherBnID}, connectionProfile);
                newCard.setCredentials(credentials);

                let otherAdminConnection = new AdminConnection(otherCardStore);
                await otherAdminConnection.importCard('newCard', newCard);

                let otherNewClient = new BusinessNetworkConnection({cardStore : otherCardStore});
                await otherNewClient.connect('newCard');
                await otherNewClient.ping();

                let factory = client.getBusinessNetwork().getFactory();

                // test invocation of chaincode the doesn't throw an error
                let transaction = factory.newTransaction('systest.transactions', 'AdvancedInvokeChainCodeTransaction');
                transaction.assetId = 'assetOnDifferentNetwork';
                transaction.channel = 'composerchannel';
                transaction.expectedValue = 'hello new world';
                transaction.chainCodeName = 'systest-other-network';
                await client.submitTransaction(transaction);

                // test invocation of chaincode that does throw an error
                transaction = factory.newTransaction('systest.transactions', 'AdvancedInvokeChainCodeError');
                transaction.channel = 'composerchannel';
                transaction.chainCodeName = 'systest-other-network';
                await client.submitTransaction(transaction);
            }
        });

        it('should invoke chain code on the different channel', async () => {
            if (TestUtil.isHyperledgerFabricV1()) {
                await deployOtherNetwork('otherChannel', 'systest-other-channel-network', true);
                let assetRegistry = await otherClient.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');

                let otherFactory = otherClient.getBusinessNetwork().getFactory();
                let asset = otherFactory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'assetOnDifferentNetwork');
                asset.stringValue = 'hello new world channel';
                await assetRegistry.add(asset);

                let adminConnection = new AdminConnection(cardStore);

                let card = await adminConnection.exportCard('admincard');

                let credentials = card.getCredentials();

                let cert = credentials.certificate;

                await otherClient.bindIdentity('resource:org.hyperledger.composer.system.NetworkAdmin#admin', cert);

                const otherAdminConnection = new AdminConnection(otherCardStore);
                const peerCard = await otherAdminConnection.exportCard('othercomposer-systests-org1-PeerAdmin');

                let connectionProfile = peerCard.getConnectionProfile();
                let newCard = new IdCard({userName : 'admin', businessNetwork : otherBnID}, connectionProfile);
                newCard.setCredentials(credentials);

                await otherAdminConnection.importCard('otherNewCard', newCard);

                let otherNewClient = new BusinessNetworkConnection({cardStore : otherCardStore});
                await otherNewClient.connect('otherNewCard');
                await otherNewClient.ping();

                let factory = client.getBusinessNetwork().getFactory();

                // test invocation of chaincode that doesn't throw an error
                let transaction = factory.newTransaction('systest.transactions', 'AdvancedInvokeChainCodeTransaction');
                transaction.assetId = 'assetOnDifferentNetwork';
                transaction.channel = 'othercomposerchannel';
                transaction.expectedValue = 'hello new world channel';
                transaction.chainCodeName = 'systest-other-channel-network';
                await client.submitTransaction(transaction);

                // test invocation of chaincode that does throw an eror
                transaction = factory.newTransaction('systest.transactions', 'AdvancedInvokeChainCodeError');
                transaction.channel = 'othercomposerchannel';
                transaction.chainCodeName = 'systest-other-channel-network';
                await client.submitTransaction(transaction);

            }
        });
    });

});
