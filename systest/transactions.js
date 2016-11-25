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

const fs = require('fs');
const path = require('path');
const Relationship = require('@ibm/ibm-concerto-common').Relationship;

const TestUtil = require('./testutil');
require('chai').should();

describe.skip('Transaction system tests', () => {

    let modelFiles;
    let concerto;
    let securityContext;

    before(function () {
        modelFiles = [
            fs.readFileSync(path.resolve(__dirname, 'data/transactions.cto'), 'utf8'),
        ];
        concerto = TestUtil.getConcerto();
        securityContext = TestUtil.getSecurityContext();
    });

    beforeEach(function () {
        let modelManager = concerto.getModelManager(securityContext);
        modelManager.clearModelFiles();
        modelFiles.forEach(function (modelFile) {
            modelManager.addModelFile(modelFile);
        });
        return concerto.saveModels(securityContext);
    });

    it('should submit and execute a transaction that contains primitive types', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
        transaction.stringValue = 'what a transaction';
        transaction.doubleValue = 3.142;
        transaction.integerValue = 2000000000;
        transaction.longValue = 16000000000000;
        transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
        transaction.booleanValue = true;
        transaction.enumValue = 'SUCH';
        return concerto.submitTransaction(securityContext, transaction);
    });

    it('should submit and report a failure executing a transaction', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
        transaction.stringValue = 'the wrong string value';
        transaction.doubleValue = 3.142;
        transaction.integerValue = 2000000000;
        transaction.longValue = 16000000000000;
        transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
        transaction.booleanValue = true;
        transaction.enumValue = 'SUCH';
        return concerto.submitTransaction(securityContext, transaction)
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/timed out waiting for transaction to complete/);
            });
    });

    it('should submit and execute a transaction that contains arrays of primitive types', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypeArrays');
        transaction.stringValues = ['what a transaction', 'hail the party parrot'];
        transaction.doubleValues = [3.142, 6.666];
        transaction.integerValues = [2000000000, 16384];
        transaction.longValues = [16000000000000, 32000000];
        transaction.dateTimeValues = [new Date('2016-10-14T18:30:30+00:00'), new Date('1066-10-14T18:30:30+00:00')];
        transaction.booleanValues = [true, false];
        transaction.enumValues = ['SUCH', 'MANY'];
        return concerto.submitTransaction(securityContext, transaction);
    });

    it('should submit and execute a transaction that contains assets', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssets');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        transaction.integerAsset = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        transaction.integerAsset.integerValue = 5318008;
        return concerto.submitTransaction(securityContext, transaction);
    });

    it('should submit and execute a transaction that contains arrays of assets', () => {
        let factory = concerto.getFactory(securityContext);
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
        return concerto.submitTransaction(securityContext, transaction);
    });

    it('should submit and execute a transaction that contains relationships to assets', () => {
        let factory = concerto.getFactory(securityContext);
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let integerAsset = factory.newInstance('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        integerAsset.integerValue = 5318008;
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.integerAsset = factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'integerAsset1');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleIntegerAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, integerAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            });
    });

    it('should submit and report a failure for a transaction that contains an invalid relationship to an asset', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithAssetRelationships');
        transaction.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'I DONT EXIST');
        transaction.integerAsset = factory.newRelationship('systest.transactions', 'SimpleIntegerAsset', 'I DONT EXIST EITHER');
        return concerto
            .submitTransaction(securityContext, transaction)
            .then(() => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/timed out waiting for transaction to complete/);
            });
    });

    it('should submit and execute a transaction that contains arrays of relationships to assets', () => {
        let factory = concerto.getFactory(securityContext);
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
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll(securityContext, [stringAsset1, stringAsset2]);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleIntegerAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.addAll(securityContext, [integerAsset1, integerAsset2]);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            });
    });

    it('should submit and execute a transaction that gets all assets from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset1 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset1.stringValue = 'party parrot in hursley';
        let asset2 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
        asset2.stringValue = 'party parrot in san francisco';
        let transaction = factory.newTransaction('systest.transactions', 'GetAllAssetsFromAssetRegistryTransaction');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset1);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset2);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            });
    });

    it('should submit and execute a transaction that gets an asset from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'GetAssetFromAssetRegistryTransaction');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            });
    });

    it('should submit and execute a transaction that adds an asset in the transaction to an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'AddAssetInTransactionToAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in hursley';
        return concerto
            .submitTransaction(securityContext, transaction)
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in hursley');
            });
    });

    it('should submit and execute a transaction that adds an asset with a relationship in the transaction to an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'AddAssetWithRelationshipInTransactionToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.should.be.an.instanceOf(Relationship);
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that adds a new asset to an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'AddNewAssetToAssetRegistryTransaction');
        return concerto
            .submitTransaction(securityContext, transaction)
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in hursley');
            });
    });

    it('should submit and execute a transaction that adds a new asset with a relationship to an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'AddNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.should.be.an.instanceOf(Relationship);
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset1');
            });
    });

    it('should submit and execute a transaction that updates an asset in the transaction in an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'UpdateAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in san francisco');
            });
    });

    it('should submit and execute a transaction that updates an asset with a relationship in the transaction in an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'UpdateAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset1 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset1.stringValue = 'party parrot in hursley';
        let stringAsset2 = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
        stringAsset2.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.addAll(securityContext, [stringAsset1, stringAsset2]);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, relationshipAsset);
            })
            .then(() => {
                relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset2');
                transaction.relationshipAsset = relationshipAsset;
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.should.be.an.instanceOf(Relationship);
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that updates a new asset in an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'UpdateNewAssetInAssetRegistryTransaction');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('stringAsset1');
                asset.stringValue.should.equal('party parrot in san francisco');
            });
    });

    it('should submit and execute a transaction that updates a new asset with a relationship in an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'UpdateNewAssetWithRelationshipToAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, relationshipAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                asset.getIdentifier().should.equal('relationshipAsset1');
                asset.stringAsset.should.be.an.instanceOf(Relationship);
                asset.stringAsset.getFullyQualifiedIdentifier().should.equal('systest.transactions.SimpleStringAsset#stringAsset2');
            });
    });

    it('should submit and execute a transaction that removes an asset in the transaction from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'RemoveAssetInTransactionInAssetRegistryTransaction');
        transaction.stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.stringAsset.stringValue = 'party parrot in san francisco';
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/does not exist/);
            });
    });

    it('should submit and execute a transaction that removes an asset with a relationship in the transaction from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'RemoveAssetWithRelationshipInTransactionInAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        transaction.relationshipAsset = relationshipAsset;
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, relationshipAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/does not exist/);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            });
    });

    it('should submit and execute a transaction that removes a new asset from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let asset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        asset.stringValue = 'party parrot in hursley';
        let transaction = factory.newTransaction('systest.transactions', 'RemoveNewAssetInAssetRegistryTransaction');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, asset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/does not exist/);
            });
    });

    it('should submit and execute a transaction that removes a new asset with a relationship from an asset registry', () => {
        let factory = concerto.getFactory(securityContext);
        let transaction = factory.newTransaction('systest.transactions', 'RemoveNewAssetWithRelationshipInAssetRegistryTransaction');
        let stringAsset = factory.newInstance('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        stringAsset.stringValue = 'party parrot in hursley';
        let relationshipAsset = factory.newInstance('systest.transactions', 'SimpleRelationshipAsset', 'relationshipAsset1');
        relationshipAsset.stringAsset = factory.newRelationship('systest.transactions', 'SimpleStringAsset', 'stringAsset1');
        return concerto
            .getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset')
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, stringAsset);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.add(securityContext, relationshipAsset);
            })
            .then(() => {
                return concerto.submitTransaction(securityContext, transaction);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleRelationshipAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'relationshipAsset1');
            })
            .then((asset) => {
                throw new Error('should not get here');
            })
            .catch((err) => {
                err.should.match(/does not exist/);
            })
            .then(() => {
                return concerto.getAssetRegistry(securityContext, 'systest.transactions.SimpleStringAsset');
            })
            .then((assetRegistry) => {
                return assetRegistry.get(securityContext, 'stringAsset1');
            });
    });

});
