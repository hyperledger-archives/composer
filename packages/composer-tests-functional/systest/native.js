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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const fs = require('fs');
const path = require('path');
const TestUtil = require('./testutil');

const checkError = (error) => {
    if (TestUtil.isWeb()) {
        error.message.should.equal('native API not available when using the web connector');
    } else if (TestUtil.isEmbedded()) {
        error.message.should.equal('native API not available when using the embedded connector');
    } else if (TestUtil.isProxy()) {
        error.message.should.equal('native API not available when using the proxy connector');
    } else {
        throw error;
    }
};

describe.only('Native API (from client API)', function () {

    this.retries(TestUtil.retries());

    let cardStore;
    let bnID;
    let businessNetworkDefinition;
    let client;

    before(async () => {
        await TestUtil.setUp();
        const modelFiles = [
            { fileName : 'models/accesscontrols.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/accesscontrols.cto'), 'utf8') },
            { fileName : 'models/participants.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/participants.cto'), 'utf8') },
            { fileName : 'models/assets.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/assets.cto'), 'utf8') },
            { fileName : 'models/transactions.cto', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.cto'), 'utf8') }
        ];
        const scriptFiles = [
            { identifier : 'transactions.js', contents : fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-native@0.0.1', 'The network for the native API (from client API) system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        bnID = businessNetworkDefinition.getName();
        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-native');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
    });

    it('should allow access to the current block height', async () => {

        // Get the current block height.
        let fc;
        try {
            fc = client.getNativeAPI();
        } catch (error) {
            return checkError(error);
        }
        const channel = fc.getChannel('composerchannel');
        const currentInfo = await channel.queryInfo();
        const currentHeight = currentInfo.height;
        currentHeight.should.be.greaterThan(1);

        // Submit a transaction and wait for it to be committed.
        // This will guarantee that the block height has increased.
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'SimpleTransaction');
        await client.submitTransaction(transaction);

        // Get the new block height.
        const newInfo = await channel.queryInfo();
        const newHeight = newInfo.height;
        newHeight.should.be.greaterThan(currentHeight);

    });

    it('should allow access to the block for a specified transaction', async () => {

        // Submit a transaction and wait for it to be committed.
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'SimpleTransaction');
        await client.submitTransaction(transaction);

        // Get the block for the transaction.
        let fc;
        try {
            fc = client.getNativeAPI();
        } catch (error) {
            return checkError(error);
        }
        const channel = fc.getChannel('composerchannel');
        const block = await channel.queryBlockByTxID(transaction.getIdentifier());
        block.header.number.should.be.greaterThan(1);

    });

    it('should allow access to the native transaction for a specified transaction', async () => {

        // Submit a transaction and wait for it to be committed.
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'SimpleTransaction');
        await client.submitTransaction(transaction);

        // Get the native transaction  for the latest transaction in the historian.
        let fc;
        try {
            fc = client.getNativeAPI();
        } catch (error) {
            return checkError(error);
        }
        const channel = fc.getChannel('composerchannel');
        const nativeTransaction = await channel.queryTransaction(transaction.getIdentifier());
        nativeTransaction.transactionEnvelope.payload.header.channel_header.channel_id.should.equal('composerchannel');

    });

});
