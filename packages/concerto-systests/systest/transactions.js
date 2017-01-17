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

const BusinessNetworkDefinition = require('@ibm/concerto-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');

const TestUtil = require('./testutil');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));


describe('Transaction system tests', () => {

    let businessNetworkDefinition;
    let admin;
    let client;

    before(function () {
        const modelFiles = [
            fs.readFileSync(path.resolve(__dirname, 'data/transactions.cto'), 'utf8')
        ];
        const scriptFiles=  [
            { identifier: 'transactions.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.js'), 'utf8') },
            { identifier: 'transactions.utility.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.utility.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest.transactions@0.0.1', 'The network for the transaction system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        admin = TestUtil.getAdmin();
        return admin.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest.transactions')
                    .then((result) => {
                        client = result;
                    });
            });
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

    it('should submit and execute a transaction that contains assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssets');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        transaction.integerAsset = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        transaction.integerAsset.integerValue = 5318008;
        return client.submitTransaction(transaction);
    });

    it('should submit and execute a transaction that contains arrays of assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetArrays');
        transaction.stringAssets = [
            factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1'),
            factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2')
        ];
        transaction.stringAssets[0].stringValue = 'party parrot in hursley';
        transaction.stringAssets[1].stringValue = 'party parrot in san francisco';
        transaction.integerAssets = [
            factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1'),
            factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset2')
        ];
        transaction.integerAssets[0].integerValue = 5318008;
        transaction.integerAssets[1].integerValue = 56373351;
        return client.submitTransaction(transaction);
    });

    it('should submit and execute a transaction that contains relationships to assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let integerAsset = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        integerAsset.integerValue = 5318008;
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.integerAsset = factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleIntegerAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(integerAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and report a failure for a transaction that contains an invalid relationship to an asset', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'I DONT EXIST');
        transaction.integerAsset = factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'I DONT EXIST EITHER');
        return client
            .submitTransaction(transaction)
            .should.be.rejected;
    });

    it('should submit and execute a transaction that contains arrays of relationships to assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let stringAsset1 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset1.stringValue = 'party parrot in hursley';
        let stringAsset2 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
        stringAsset2.stringValue = 'party parrot in san francisco';
        let integerAsset1 = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        integerAsset1.integerValue = 5318008;
        let integerAsset2 = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset2');
        integerAsset2.integerValue = 56373351;
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetRelationshipArrays');
        transaction.stringAssets = [
            factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1'),
            factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset2')
        ];
        transaction.integerAssets = [
            factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1'),
            factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'integerAsset2')
        ];
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll([stringAsset1, stringAsset2]);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleIntegerAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.addAll([integerAsset1, integerAsset2]);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and execute a transaction that gets all assets from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset1 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset1.stringValue = 'party parrot in hursley';
        let asset2 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
        asset2.stringValue = 'party parrot in san francisco';
        let transaction = factory.newTransaction('systest.transactions', 'GetAllAssetsFromAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset1);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(asset2);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and execute a transaction that gets an asset from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'GetAssetFromAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and execute a transaction that adds an asset in the transaction to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'AddAssetInTransactionToAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        return client
            .submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in hursley');
            });
    });

    it('should submit and execute a transaction that adds an asset with a relationship in the transaction to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'AddAssetWithRelationshipInTransactionToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client.getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that adds a new asset to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'AddNewAssetToAssetRegistryTransaction');
        return client
            .submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in hursley');
            });
    });

    it('should submit and execute a transaction that adds a new asset with a relationship to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'AddNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        return client.getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that updates an asset in the transaction in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'UpdateAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in san francisco');
            });
    });

    it('should submit and execute a transaction that updates an asset with a relationship in the transaction in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'UpdateAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset1 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset1.stringValue = 'party parrot in hursley';
        let stringAsset2 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
        stringAsset2.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client.getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll([stringAsset1, stringAsset2]);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
                transaction.relationshipAsset = relationshipAsset;
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that updates a new asset in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'UpdateNewAssetInAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in san francisco');
            });
    });

    it('should submit and execute a transaction that updates a new asset with a relationship in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'UpdateNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        return client.getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that removes an asset in the transaction from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'RemoveAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should submit and execute a transaction that removes an asset with a relationship in the transaction from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'RemoveAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            });
    });

    it('should submit and execute a transaction that removes a new asset from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'RemoveNewAssetInAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            });
    });

    it('should submit and execute a transaction that removes a new asset with a relationship from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions', 'RemoveNewAssetWithRelationshipInAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        return client
            .getAssetRegistry('systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.should.match(/Object with ID '.+?' in collection with ID '.+?' does not exist/);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            });
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
