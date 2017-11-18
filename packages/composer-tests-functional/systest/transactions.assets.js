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


describe('Transaction (asset specific) system tests', () => {
    let bnID;
    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });
    let businessNetworkDefinition;
    let client;

    before(function () {
        const modelFiles = [
            { fileName: 'models/transactions.assets.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.assets.cto'), 'utf8') }
        ];
        const scriptFiles=  [
            { identifier: 'transactions.assets.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/transactions.assets.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-transactions-assets@0.0.1', 'The network for the transaction (asset specific) system tests');
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
                return TestUtil.getClient('systest-transactions-assets')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
    });

    it('should submit and execute a transaction that contains assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions.assets', 'SimpleTransactionWithAssets');
        transaction.stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        transaction.integerAsset = factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1');
        transaction.integerAsset.integerValue = 5318008;
        return client.submitTransaction(transaction);
    });

    it('should submit and execute a transaction that contains arrays of assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions.assets', 'SimpleTransactionWithAssetArrays');
        transaction.stringAssets = [
            factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1'),
            factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2')
        ];
        transaction.stringAssets[0].stringValue = 'party parrot in hursley';
        transaction.stringAssets[1].stringValue = 'party parrot in san francisco';
        transaction.integerAssets = [
            factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1'),
            factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset2')
        ];
        transaction.integerAssets[0].integerValue = 5318008;
        transaction.integerAssets[1].integerValue = 56373351;
        return client.submitTransaction(transaction);
    });

    it('should submit and execute a transaction that contains relationships to assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let integerAsset = factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1');
        integerAsset.integerValue = 5318008;
        let transaction = factory.newTransaction('systest.transactions.assets', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.integerAsset = factory.newRelationship('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleIntegerAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'I DONT EXIST');
        transaction.integerAsset = factory.newRelationship('systest.transactions.assets', 'SimpleIntegerAsset', 'I DONT EXIST EITHER');
        return client
            .submitTransaction(transaction)
            .should.be.rejected;
    });

    it('should submit and execute a transaction that contains arrays of relationships to assets', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let stringAsset1 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset1.stringValue = 'party parrot in hursley';
        let stringAsset2 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2');
        stringAsset2.stringValue = 'party parrot in san francisco';
        let integerAsset1 = factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1');
        integerAsset1.integerValue = 5318008;
        let integerAsset2 = factory.newResource('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset2');
        integerAsset2.integerValue = 56373351;
        let transaction = factory.newTransaction('systest.transactions.assets', 'SimpleTransactionWithAssetRelationshipArrays');
        transaction.stringAssets = [
            factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1'),
            factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2')
        ];
        transaction.integerAssets = [
            factory.newRelationship('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset1'),
            factory.newRelationship('systest.transactions.assets', 'SimpleIntegerAsset', 'integerAsset2')
        ];
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll([stringAsset1, stringAsset2]);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleIntegerAsset');
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
        let asset1 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset1.stringValue = 'party parrot in hursley';
        let asset2 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2');
        asset2.stringValue = 'party parrot in san francisco';
        let transaction = factory.newTransaction('systest.transactions.assets', 'GetAllAssetsFromAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset1);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'GetAssetFromAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and execute a transaction that tests the existance of an asset in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'ExistsAssetInAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            });
    });

    it('should submit and execute a transaction that adds an asset in the transaction to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions.assets', 'AddAssetInTransactionToAssetRegistryTransaction');
        transaction.stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        return client
            .submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'AddAssetWithRelationshipInTransactionToAssetRegistryTransaction');
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newResource('systest.transactions.assets', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.assets.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that adds a new asset to an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions.assets', 'AddNewAssetToAssetRegistryTransaction');
        return client
            .submitTransaction(transaction)
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'AddNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.assets.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that updates an asset in the transaction in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'UpdateAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'UpdateAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset1 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset1.stringValue = 'party parrot in hursley';
        let stringAsset2 = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2');
        stringAsset2.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newResource('systest.transactions.assets', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll([stringAsset1, stringAsset2]);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset2');
                transaction.relationshipAsset = relationshipAsset;
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.assets.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that updates a new asset in an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'UpdateNewAssetInAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'UpdateNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newResource('systest.transactions.assets', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.isRelationship().should.be.true;
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.assets.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that removes an asset in the transaction from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'RemoveAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'RemoveAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newResource('systest.transactions.assets', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
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
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            });
    });

    it('should submit and execute a transaction that removes a new asset from an asset registry', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'RemoveNewAssetInAssetRegistryTransaction');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
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
        let transaction = factory.newTransaction('systest.transactions.assets', 'RemoveNewAssetWithRelationshipInAssetRegistryTransaction');
        let stringAsset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newResource('systest.transactions.assets', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(stringAsset);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(relationshipAsset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleRelationshipAsset');
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
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get('stringAsset1');
            });
    });

    it('should submit and execute a transaction that validates that an asset add is only committed if the transaction is', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('systest.transactions.assets', 'AssetAddIsAtomic');
        return client
            .submitTransaction(transaction)
            .should.be.rejected
            .then(() => {
                return client.getAssetRegistry('systest.transactions.assets.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.exists('stringAsset1');
            })
            .then((exists) => {
                exists.should.be.false;
            });
    });

    it('should submit and execute a transaction that validates that an asset update is only committed if the transaction is', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'AssetUpdateIsAtomic');
        let assetRegistry;
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry_) => {
                assetRegistry = assetRegistry_;
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .should.be.rejected
            .then(() => {
                return assetRegistry.get('stringAsset1');
            })
            .then((asset) => {
                asset.stringValue.should.equal('party parrot in hursley');
            });
    });

    it('should submit and execute a transaction that validates that an asset remove is only committed if the transaction is', () => {
        let factory = client.getBusinessNetwork().getFactory();
        let asset = factory.newResource('systest.transactions.assets', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions.assets', 'AssetRemoveIsAtomic');
        let assetRegistry;
        return client
            .getAssetRegistry('systest.transactions.assets.SimpleStringAsset')
            .then((assetRegistry_) => {
                assetRegistry = assetRegistry_;
                return assetRegistry.add(asset);
            })
            .then(() => {
                return client.submitTransaction(transaction);
            })
            .should.be.rejected
            .then(() => {
                return assetRegistry.exists('stringAsset1');
            })
            .then((exists) => {
                exists.should.be.true;
            });
    });

});
