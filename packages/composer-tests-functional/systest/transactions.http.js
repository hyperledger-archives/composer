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

const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;
const fs = require('fs');
const path = require('path');
const TestUtil = require('./testutil');

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.should();

describe.only('Transaction (HTTP specific) system tests', function() {

    this.retries(TestUtil.retries());

    let cardStore;
    let bnID;
    let businessNetworkDefinition;
    let client;

    before(async () => {
        await TestUtil.setUp();
        const hostname = process.env.GATEWAY || 'localhost';
        const port = fs.readFileSync(path.resolve(__dirname, '..', 'http.port'));
        const modelFiles = [
            { fileName: 'models/transactions.http.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.http.cto'), 'utf8') }
        ];
        const scriptFiles =  [
            { identifier: 'transactions.http.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.http.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-transactions-http@0.0.1', 'The network for the transaction (HTTP specific) system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptFile.contents = scriptFile.contents.replace('%GATEWAY%', `${hostname}:${port}`);
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        bnID = businessNetworkDefinition.getName();
        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-transactions-http');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
    });

    ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {

        it(`should handle a ${method} call that receives an HTTP 200 OK`, async () => {
            const factory = client.getBusinessNetwork().getFactory();
            const tx = factory.newTransaction('systest.transactions.http', 'Basic');
            tx.method = method;
            await client.submitTransaction(tx);
        });

    });

    ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {

        it(`should handle a ${method} call that receives an HTTP 500 Internal Server Error`, async () => {
            const factory = client.getBusinessNetwork().getFactory();
            const tx = factory.newTransaction('systest.transactions.http', 'Error');
            tx.method = method;
            await client.submitTransaction(tx);
        });

    });

    // Can't send a request body for a GET or HEAD request.
    ['POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {

        it(`should handle a ${method} call that sends an asset in the request body`, async () => {
            const factory = client.getBusinessNetwork().getFactory();
            const tx = factory.newTransaction('systest.transactions.http', 'AssetIn');
            tx.method = method;
            await client.submitTransaction(tx);
        });

    });

    // Can't receive a response body for a HEAD request.
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {

        it(`should handle a ${method} call that receives an asset in the response body`, async () => {
            const factory = client.getBusinessNetwork().getFactory();
            const tx = factory.newTransaction('systest.transactions.http', 'AssetOut');
            tx.method = method;
            await client.submitTransaction(tx);
        });

    });

});
