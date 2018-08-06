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

describe('Transaction system tests', function() {

    this.retries(TestUtil.retries());

    let cardStore;
    let bnID;
    let businessNetworkDefinition;
    let client;

    before(async () => {
        await TestUtil.setUp();
        const modelFiles = [
            { fileName: 'models/transactions.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.cto'), 'utf8') }
        ];
        const scriptFiles=  [
            { identifier: 'transactions.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.js'), 'utf8') },
            { identifier: 'transactions.utility.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.utility.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-transactions@0.0.1', 'The network for the transaction system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        bnID = businessNetworkDefinition.getName();
        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-transactions');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
    });

    it('should submit and execute a transaction that contains primitive types', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
        transaction.stringValue = 'what a transaction';
        transaction.doubleValue = 3.142;
        transaction.integerValue = 2000000000;
        transaction.longValue = 16000000000000;
        transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
        transaction.booleanValue = true;
        transaction.enumValue = 'SUCH';
        return client.submitTransaction(transaction);
    });

    it('should submit and report a failure executing a transaction', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
        transaction.stringValue = 'the wrong string value';
        transaction.doubleValue = 3.142;
        transaction.integerValue = 2000000000;
        transaction.longValue = 16000000000000;
        transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
        transaction.booleanValue = true;
        transaction.enumValue = 'SUCH';
        return client.submitTransaction(transaction)
            .should.be.rejected;
    });

    it('should submit and execute a transaction that contains arrays of primitive types', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypeArrays');
        transaction.stringValues = ['what a transaction', 'hail the party parrot'];
        transaction.doubleValues = [3.142, 6.666];
        transaction.integerValues = [2000000000, 16384];
        transaction.longValues = [16000000000000, 32000000];
        transaction.dateTimeValues = [new Date('2016-10-14T18:30:30+00:00'), new Date('1066-10-14T18:30:30+00:00')];
        transaction.booleanValues = [true, false];
        transaction.enumValues = ['SUCH', 'MANY'];
        return client.submitTransaction(transaction);
    });

    it('should submit and execute a single transaction processor function annotated with @transaction', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SingleAnnotatedTransaction');
        transaction.stringValue = 'hello from single annotated transaction';
        return client.submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.stringValue.should.equal('hello from single annotated transaction');
            });
    });

    it('should submit and execute multiple transaction processor functions annotated with @transaction', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'MultipleAnnotatedTransaction');
        transaction.stringValue1 = 'hello from first annotated transaction';
        transaction.stringValue2 = 'hello from second annotated transaction';
        let assetRegistry;
        return client.submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry_) => {
                assetRegistry = assetRegistry_;
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.stringValue.should.equal('hello from first annotated transaction');
            })
            .then(() => {
                return assetRegistry.get('stringAsset2');
            })
            .then((asset) => {
                asset.stringValue.should.equal('hello from second annotated transaction');
            });
    });

    it('should submit and execute a transaction processor function that calls utility functions', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'TransactionUsingUtilityFunctions');
        transaction.stringValue = 'hello from annotated transaction using utility functions';
        return client.submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.stringValue.should.equal('hello from annotated transaction using utility functions');
            });
    });

    it('should submit and execute a transaction processor function that returns a concept', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsConcept');
        const value = new Date().toISOString();
        transaction.value = value;
        const concept = await client.submitTransaction(transaction);
        concept.value.should.equal(value);
    });

    it('should submit and execute a transaction processor function that returns a concept array', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsConceptArray');
        const value = new Date().toISOString();
        transaction.value = value;
        const concept = await client.submitTransaction(transaction);
        concept[0].value.should.equal(value + '1');
        concept[1].value.should.equal(value + '2');
    });

    it('should submit and execute a transaction processor function that returns a date/time', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsDateTime');
        const inputValue = new Date();
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.toISOString().should.equal(outputValue.toISOString());
    });

    it('should submit and execute a transaction processor function that returns an integer', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsInteger');
        const inputValue = 16384;
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a long', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsLong');
        const inputValue = 1000000000;
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a double', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsDouble');
        const inputValue = 3.142;
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a double array', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsDoubleArray');
        const inputValue = 3.142;
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        [inputValue + 1, inputValue + 2].should.deep.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a boolean', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsBoolean');
        const inputValue = true;
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a string', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsString');
        const inputValue = new Date().toISOString();
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        inputValue.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns a string array', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsStringArray');
        const inputValue = new Date().toISOString();
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        [inputValue + '1', inputValue + '2'].should.deep.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns an enum', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsEnum');
        const inputValue = new Date().toISOString();
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        'WOW'.should.equal(outputValue);
    });

    it('should submit and execute a transaction processor function that returns an enum array', async () => {
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.transactions', 'TransactionThatReturnsEnumArray');
        const inputValue = new Date().toISOString();
        transaction.value = inputValue;
        const outputValue = await client.submitTransaction(transaction);
        ['SUCH', 'MANY'].should.deep.equal(outputValue);
    });

    it('should submit and execute a transaction processor function annotated with @commit(true)', async () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'TransactionWithCommitTrue');
        transaction.stringValue = 'hello from single annotated transaction';
        await client.submitTransaction(transaction);
        const assetRegistry = await client.getAssetRegistry('systest.transactions.SimpleStringAsset');
        const exists = await assetRegistry.exists('stringAsset1');
        exists.should.be.true;
    });

    it('should submit and execute a transaction processor function annotated with @commit(false)', async () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'TransactionWithCommitFalse');
        transaction.stringValue = 'hello from single annotated transaction';
        await client.submitTransaction(transaction);
        const assetRegistry = await client.getAssetRegistry('systest.transactions.SimpleStringAsset');
        const exists = await assetRegistry.exists('stringAsset1');
        exists.should.be.false;
    });

    it('should submit and execute a transaction processor function with the commit option set to false', async () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'TransactionWithCommitTrue');
        transaction.stringValue = 'hello from single annotated transaction';
        await client.submitTransaction(transaction, { commit: false });
        const assetRegistry = await client.getAssetRegistry('systest.transactions.SimpleStringAsset');
        const exists = await assetRegistry.exists('stringAsset1');
        exists.should.be.false;
    });

});
