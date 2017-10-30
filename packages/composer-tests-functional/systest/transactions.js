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
chai.should();
chai.use(require('chai-as-promised'));


describe('Transaction system tests', () => {
    let bnID;
    beforeEach(() => {

        return TestUtil.resetBusinessNetwork(bnID);
    });
    let businessNetworkDefinition;
    let client;

    before(function () {
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
        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest-transactions')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
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

});
