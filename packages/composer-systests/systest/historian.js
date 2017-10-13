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

const uuid = require('uuid');
const TestUtil = require('./testutil');
const path = require('path');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
process.setMaxListeners(Infinity);
const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;
const fs = require('fs');
let client;
let bnID;
let createAsset = (assetId) => {
    let factory = client.getBusinessNetwork().getFactory();
    let asset = factory.newResource('systest.assets', 'SimpleAsset', assetId);
    asset.stringValue = 'hello world';
    asset.stringValues = ['hello', 'world'];
    asset.doubleValue = 3.142;
    asset.doubleValues = [4.567, 8.901];
    asset.integerValue = 1024;
    asset.integerValues = [32768, -4096];
    asset.longValue = 131072;
    asset.longValues = [999999999, -1234567890];
    asset.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
    asset.dateTimeValues = [new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z')];
    asset.booleanValue = true;
    asset.booleanValues = [false, true];
    asset.enumValue = 'WOW';
    asset.enumValues = ['SUCH', 'MANY', 'MUCH'];
    return asset;
};
let validateAsset = (asset, assetId) => {
    asset.getIdentifier().should.equal(assetId);
    asset.stringValue.should.equal('hello world');
    asset.stringValues.should.deep.equal(['hello', 'world']);
    asset.doubleValue.should.equal(3.142);
    asset.doubleValues.should.deep.equal([4.567, 8.901]);
    asset.integerValue.should.equal(1024);
    asset.integerValues.should.deep.equal([32768, -4096]);
    asset.longValue.should.equal(131072);
    asset.longValues.should.deep.equal([999999999, -1234567890]);
    let expectedDate = new Date('1994-11-05T08:15:30-05:00');
    asset.dateTimeValue.getTime().should.equal(expectedDate.getTime());
    let expectedDates = [new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z')];
    asset.dateTimeValues[0].getTime().should.equal(expectedDates[0].getTime());
    asset.dateTimeValues[1].getTime().should.equal(expectedDates[1].getTime());
    asset.booleanValue.should.equal(true);
    asset.booleanValues.should.deep.equal([false, true]);
    asset.enumValue.should.equal('WOW');
    asset.enumValues.should.deep.equal(['SUCH', 'MANY', 'MUCH']);
};

let createParticipant = (participantId) => {
    let factory = client.getBusinessNetwork().getFactory();
    let participant = factory.newResource('systest.participants', 'SimpleParticipant', participantId);
    participant.stringValue = 'hello world';
    participant.stringValues = ['hello', 'world'];
    participant.doubleValue = 3.142;
    participant.doubleValues = [4.567, 8.901];
    participant.integerValue = 1024;
    participant.integerValues = [32768, -4096];
    participant.longValue = 131072;
    participant.longValues = [999999999, -1234567890];
    participant.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
    participant.dateTimeValues = [new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z')];
    participant.booleanValue = true;
    participant.booleanValues = [false, true];
    participant.enumValue = 'WOW';
    participant.enumValues = ['SUCH', 'MANY', 'MUCH'];
    return participant;
};

let validateParticipant = (participant, participantId) => {
    participant.getIdentifier().should.equal(participantId);
    participant.stringValue.should.equal('hello world');
    participant.stringValues.should.deep.equal(['hello', 'world']);
    participant.doubleValue.should.equal(3.142);
    participant.doubleValues.should.deep.equal([4.567, 8.901]);
    participant.integerValue.should.equal(1024);
    participant.integerValues.should.deep.equal([32768, -4096]);
    participant.longValue.should.equal(131072);
    participant.longValues.should.deep.equal([999999999, -1234567890]);
    let expectedDate = new Date('1994-11-05T08:15:30-05:00');
    participant.dateTimeValue.getTime().should.equal(expectedDate.getTime());
    let expectedDates = [new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z')];
    participant.dateTimeValues[0].getTime().should.equal(expectedDates[0].getTime());
    participant.dateTimeValues[1].getTime().should.equal(expectedDates[1].getTime());
    participant.booleanValue.should.equal(true);
    participant.booleanValues.should.deep.equal([false, true]);
    participant.enumValue.should.equal('WOW');
    participant.enumValues.should.deep.equal(['SUCH', 'MANY', 'MUCH']);
};

let deployCommon =  ()=> {

    const modelFiles = [
        { fileName: 'models/accesscontrols.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/accesscontrols.cto'), 'utf8')},
        { fileName: 'models/participants.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/participants.cto'), 'utf8')},
        { fileName: 'models/assets.cto',       contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/assets.cto'), 'utf8')},
        { fileName: 'models/transactions.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.cto'), 'utf8')}

    ];
    const scriptFiles = [
       { identifier: 'transactions.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.js'), 'utf8') }
    ];
    let businessNetworkDefinition = new BusinessNetworkDefinition('common-network@0.0.1', 'The network for the access controls system tests');
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


describe('Historian', () => {



    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });

    describe('CRUD Asset', () => {
        it('should track updates for CREATE asset calls ', () => {
            // let factory = client.getBusinessNetwork().getFactory();
            let assetRegistry, addAssetTransactionRegistry;
            let historian;
            let hrecords;
            return client
                .getAssetRegistry('systest.assets.SimpleAsset')
                .then(function (result) {
                    assetRegistry = result;
                })
                .then(() => {
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset2');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset3');
                    return assetRegistry.add(asset);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return client.getTransactionRegistry('org.hyperledger.composer.system.AddAsset');
                }).then((result) => {
                    addAssetTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {

                    // there should be a create asset record for the 3 assets
                    hrecords = result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.AddAsset';
                    });
                    hrecords.length.should.equal(3);

                    let promises = [];
                    hrecords.forEach((transaction) => {
                        let promise = addAssetTransactionRegistry.get(transaction.transactionId)
                            .then((result) => {
                                return validateAsset(result.resources[0], result.resources[0].getIdentifier());
                            });
                        promises.push(promise);
                    });

                    return Promise.all(promises);
                });


        });


        it('should track updates for UPDATE asset calls ', () => {

            // let factory = client.getBusinessNetwork().getFactory();
            let assetRegistry, updateAssetTransactionRegistry;
            let historian;
            let hrecords;
            return client
                .getAssetRegistry('systest.assets.SimpleAsset')
                .then(function (result) {
                    assetRegistry = result;
                })
                .then(() => {
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return assetRegistry.get('dogeAsset1');
                }).then((asset) => {

                    asset.stringValue = 'ciao mondo';
                    asset.stringValues = ['ciao', 'mondo'];
                    return assetRegistry.update(asset);
                }).then(() => {

                    return assetRegistry.get('dogeAsset1');
                })
                .then((result) => {

                    return client.getTransactionRegistry('org.hyperledger.composer.system.UpdateAsset');
                }).then((result) => {
                    updateAssetTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {


                    hrecords = result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.UpdateAsset';
                    });
                    hrecords.length.should.equal(1);
                    return client.getTransactionRegistry('org.hyperledger.composer.system.UpdateAsset');
                }).then((result) => {
                    //console.log(hrecords);
                    updateAssetTransactionRegistry = result;
                    return updateAssetTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    //console.log(result);

                    result.resources[0].stringValue.should.equal('ciao mondo');
                    result.resources[0].stringValues.should.deep.equal(['ciao', 'mondo']);


                });




        });
        it('should track updates for DELETE asset calls ', () => {

            // let factory = client.getBusinessNetwork().getFactory();
            let assetRegistry, rmAssetTransactionRegistry;
            let historian;
            let hrecords;
            return client
                .getAssetRegistry('systest.assets.SimpleAsset')
                .then(function (result) {
                    assetRegistry = result;
                })
                .then(() => {
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return assetRegistry.get('dogeAsset1');
                })
                .then(() => {
                    return assetRegistry.remove('dogeAsset1');
                })
                .then((result) => {

                    return client.getTransactionRegistry('org.hyperledger.composer.system.RemoveAsset');
                }).then((result) => {
                    rmAssetTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.RemoveAsset';
                    });
                    hrecords.length.should.equal(1);
                    return client.getTransactionRegistry('org.hyperledger.composer.system.RemoveAsset');
                }).then((result) => {
                    rmAssetTransactionRegistry = result;
                    return rmAssetTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    result.resourceIds[0].should.equal('dogeAsset1');
                    return rmAssetTransactionRegistry.get('dogAsset1');
                }).should.be.rejectedWith(/does not exist/);

        });

    });

    describe('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => {
            let participantRegistry, addParticipantTransactionRegistry;
            let historian;
            let existingHistorianIDs;
            let hrecords;
            return client.getHistorian()
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                })
                .then((historianRecords) => {
                    existingHistorianIDs = historianRecords.map((historianRecord) => {
                        return historianRecord.getIdentifier();
                    });
                    return client.getParticipantRegistry('systest.participants.SimpleParticipant');
                })
                .then(function (result) {
                    participantRegistry = result;
                })
                .then(() => {
                    let participant = createParticipant('dogeParticipant1');
                    return participantRegistry.add(participant);
                })
                .then(function () {
                    let participant = createParticipant('dogeParticipant2');
                    return participantRegistry.add(participant);
                })
                .then(function () {
                    let participant = createParticipant('dogeParticipant3');
                    return participantRegistry.add(participant);
                })
                .then(() => {
                    return client.getTransactionRegistry('org.hyperledger.composer.system.AddParticipant');
                }).then((result) => {
                    addParticipantTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {

                    // there should be a create participant record for the 3 participants
                    hrecords = result.filter((element) => {
                        return existingHistorianIDs.indexOf(element.getIdentifier()) === -1;
                    }).filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.AddParticipant';
                    });
                    hrecords.length.should.equal(3);

                    let promises = [];
                    hrecords.forEach((transaction) => {
                        let promise = addParticipantTransactionRegistry.get(transaction.transactionId)
                            .then((result) => {
                                return validateParticipant(result.resources[0], result.resources[0].getIdentifier());
                            });
                        promises.push(promise);
                    });

                    return Promise.all(promises);
                });
        });


        it('should track updates for UPDATE Participant calls ', () => {
            let participantRegistry, updateParticipantTransactionRegistry;
            let historian;
            let hrecords;
            return client
                .getParticipantRegistry('systest.participants.SimpleParticipant')
                .then(function (result) {
                    participantRegistry = result;
                })
                .then(() => {
                    let participant = createParticipant('dogeParticipant1');
                    return participantRegistry.add(participant);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return participantRegistry.get('dogeParticipant1');
                }).then((participant) => {

                    participant.stringValue = 'ciao mondo';
                    participant.stringValues = ['ciao', 'mondo'];
                    return participantRegistry.update(participant);
                }).then(() => {

                    return participantRegistry.get('dogeParticipant1');
                })
                .then((result) => {

                    return client.getTransactionRegistry('org.hyperledger.composer.system.UpdateParticipant');
                }).then((result) => {
                    updateParticipantTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {


                    hrecords = result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.UpdateParticipant';
                    });
                    hrecords.length.should.equal(1);
                    return client.getTransactionRegistry('org.hyperledger.composer.system.UpdateParticipant');
                }).then((result) => {
                    //console.log(hrecords);
                    updateParticipantTransactionRegistry = result;
                    return updateParticipantTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    //console.log(result);

                    result.resources[0].stringValue.should.equal('ciao mondo');
                    result.resources[0].stringValues.should.deep.equal(['ciao', 'mondo']);


                });

        });
        it('should track updates for DELETE Participant calls ', () => {
            let participantRegistry, rmParticipantTransactionRegistry;
            let historian;
            let hrecords;
            return client
                .getParticipantRegistry('systest.participants.SimpleParticipant')
                .then(function (result) {
                    participantRegistry = result;
                })
                .then(() => {
                    let participant = createParticipant('dogeParticipant1');
                    return participantRegistry.add(participant);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return participantRegistry.get('dogeParticipant1');
                })
                .then(() => {
                    return participantRegistry.remove('dogeParticipant1');
                })
                .then((result) => {

                    return client.getTransactionRegistry('org.hyperledger.composer.system.RemoveParticipant');
                }).then((result) => {
                    rmParticipantTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.RemoveParticipant';
                    });
                    hrecords.length.should.equal(1);
                    return client.getTransactionRegistry('org.hyperledger.composer.system.RemoveParticipant');
                }).then((result) => {
                    rmParticipantTransactionRegistry = result;
                    return rmParticipantTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    result.resourceIds[0].should.equal('dogeParticipant1');
                    return rmParticipantTransactionRegistry.get('dogParticipant1');

                }).should.be.rejectedWith(/does not exist/);


        });
    });

    describe('Transaction invocations', () => {
        it('Successful transaction should have contents recorded', () => {
            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
            let historian, txRegistry;
            transaction.stringValue = 'what a transaction';
            transaction.doubleValue = 3.142;
            transaction.integerValue = 2000000000;
            transaction.longValue = 16000000000000;
            transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
            transaction.booleanValue = true;
            transaction.enumValue = 'SUCH';
            return client.submitTransaction(transaction)
                .then(() => {
                    // get the historian
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return client.getTransactionRegistry('systest.transactions.SimpleTransactionWithPrimitiveTypes');
                }).then((result) => {
                    txRegistry = result;
                    return historian.get(transaction.getIdentifier());
                })
                .then((record) => {
                    // got the record - need to validate it
                    record.transactionType.should.equals('systest.transactions.SimpleTransactionWithPrimitiveTypes');
                    return txRegistry.get(record.transactionInvoked.getIdentifier());
                }).then((tx) => {
                    tx.should.deep.equal(transaction);
                });
        });

        it('Unsuccessful transaction should not cause issues', () => {

            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
            let historian;

            transaction.stringValue = 'the wrong string value';
            transaction.doubleValue = 3.142;
            transaction.integerValue = 2000000000;
            transaction.longValue = 16000000000000;
            transaction.dateTimeValue = new Date('2016-10-14T18:30:30+00:00');
            transaction.booleanValue = true;
            transaction.enumValue = 'SUCH';
            return client.submitTransaction(transaction)
                .catch(() => { return; })
                .then(() => {
                    // get the historian
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return historian.get(transaction.getIdentifier());
                }).should.be.rejectedWith(/does not exist/);
        });
    });


    describe('ACLs', () => {

        let existingHistorianIDs;
        let aliceClient, bobClient, charlieClient;
        let alice, bob, charlie;

        let aliceCar, bobCar;

        before(() => {
            return TestUtil.getClient()
                .then((result) => {
                    client = result;
                });
        });

        beforeEach('ACLs setup beforeEach', () => {
            let factory = client.getBusinessNetwork().getFactory();
            alice = factory.newResource('systest.accesscontrols', 'SampleParticipant', 'alice@mailcorp.com');
            alice.firstName = 'Alice';
            alice.lastName = 'Ashley';
            alice.asset = factory.newRelationship('systest.accesscontrols', 'SampleAsset', 'AL1 CE');
            aliceCar = factory.newResource('systest.accesscontrols', 'SampleAsset', 'AL1 CE');
            aliceCar.theValue = 'Alice\'s car';
            aliceCar.owner = factory.newRelationship('systest.accesscontrols', 'SampleParticipant', 'alice@mailcorp.com');
            bob = factory.newResource('systest.accesscontrols', 'SampleParticipant', 'bob@mailcorp.com');
            bob.firstName = 'Bob';
            bob.lastName = 'Bradley';
            bob.asset = factory.newRelationship('systest.accesscontrols', 'SampleAsset', 'BO85 CAR');
            bobCar = factory.newResource('systest.accesscontrols', 'SampleAsset', 'BO85 CAR');
            bobCar.theValue = 'Bob\'s car';
            bobCar.owner = factory.newRelationship('systest.accesscontrols', 'SampleParticipant', 'bob@mailcorp.com');
            // --
            charlie = factory.newResource('systest.accesscontrols', 'SampleParticipant', 'charlie@mailcorp.com');
            charlie.firstName = 'Charlie';
            charlie.lastName = 'McCharlie';


            let aliceIdentity = uuid.v4(), bobIdentity = uuid.v4(), charlieIdentity = uuid.v4();
            return client.getHistorian()
                .then((historian) => {
                    return historian.getAll();
                })
                .then((historianRecords) => {
                    existingHistorianIDs = historianRecords.map((historianRecord) => {
                        return historianRecord.getIdentifier();
                    });
                    return client.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
                })
                .then((participantRegistry) => {
                    return participantRegistry.addAll([alice, bob, charlie]);
                })
                .then(() => {
                    return client.issueIdentity(alice, aliceIdentity);
                })
                .then((identity) => {
                    return TestUtil.getClient('common-network', identity.userID, identity.userSecret);
                })
                .then((result) => {
                    aliceClient = result;
                    return client.issueIdentity(bob, bobIdentity);
                })
                .then((identity) => {
                    return TestUtil.getClient('common-network', identity.userID, identity.userSecret);
                })
                .then((result) => {
                    bobClient = result;
                    return client.issueIdentity(charlie, charlieIdentity);
                })
                .then((identity) => {
                    return TestUtil.getClient('common-network', identity.userID, identity.userSecret);
                })
                .then((result) => {
                    charlieClient = result;
                    return client.getAssetRegistry('systest.accesscontrols.SampleAsset');
                })
                .then((assetRegistry) => {
                    return assetRegistry.addAll([aliceCar, bobCar]);
                });
        });
        it('Check the issue identity calls are there', () => {
            let historian;
            return client.getHistorian()
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                }).then((result) => {

                    result = result.filter((element) => {
                        return existingHistorianIDs.indexOf(element.getIdentifier()) === -1;
                    });

                    result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.IssueIdentity';
                    }).length.should.equal(3);

                    result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.ActivateCurrentIdentity';
                    }).length.should.equal(3);
                });
        });
        it('Allow alice access to historian', () => {
            let expectedTxTypes=['org.hyperledger.composer.system.AddAsset',
                'org.hyperledger.composer.system.IssueIdentity',
                'org.hyperledger.composer.system.ActivateCurrentIdentity',
                'org.hyperledger.composer.system.IssueIdentity',
                'org.hyperledger.composer.system.AddParticipant',
                'org.hyperledger.composer.system.ActivateCurrentIdentity',
                'org.hyperledger.composer.system.ActivateCurrentIdentity',
                'org.hyperledger.composer.system.IssueIdentity',
            ].sort();
            return aliceClient.getHistorian()
            .then((result) => {
                return result.getAll();
            }).then( (result)=>{
                result.filter((value) => {
                    return existingHistorianIDs.indexOf(value.getIdentifier()) === -1;
                }).map((value)=>{
                    return value.transactionType;
                }).sort().should.deep.equal(expectedTxTypes);
            } );
        });
        it('Deny bob alice access to historian', () => {

            return bobClient.getHistorian()
                     .then((result) => {
                         return result.getAll();
                     }).then((result)=>{result.length.should.equal(0);});
        });
        it('Allow acces to historian regsitry, but not to transaction information', () => {
            let historian;
            let assetRegistry;

            return client.getAssetRegistry('systest.assets.SimpleAsset')
                .then((result) => {
                    assetRegistry = result;
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(() => {
                    return charlieClient.getHistorian();
                })
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                })
                .then((result) => {
                    return charlieClient.getTransactionRegistry('org.hyperledger.composer.system.AddAsset').should.be.rejectedWith(/does not have \'READ\' access /);
                });
            // add a new participant charlie, who can not access the relationships parts.
        });

    });

    describe('Query', () => {
        it('For a set of historian records, then select these base on the transaction timestamp', () => {

            let existingHistorianIDs;
            let assetRegistry;
            let historian;
            let hrecords;
            return client.getHistorian()
                .then((historian) => {
                    return historian.getAll();
                })
                .then((historianRecords) => {
                    existingHistorianIDs = historianRecords.map((historianRecord) => {
                        return historianRecord.getIdentifier();
                    });
                    return client.getAssetRegistry('systest.assets.SimpleAsset');
                })
                .then(function (result) {
                    assetRegistry = result;
                })
                .then(() => {
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset2');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset3');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset4');
                    return assetRegistry.add(asset);
                })
                .then(()=>{return client.getHistorian();} )
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                }).then((result) => {

                    // there should be a create asset record for the 3 assets
                    hrecords = result.filter((element) => {
                        return existingHistorianIDs.indexOf(element.getIdentifier()) === -1;
                    }).filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.AddAsset';
                    }).sort((a, b) => {

                        let ats = new Date(a.transactionTimestamp);
                        let bts = new Date(b.transactionTimestamp);
                        if (ats < bts) {
                            return -1;
                        } else if (ats > bts) {
                            return 1;
                        }
                        // a must be equal to b
                        return 0;
                    });

                    let now = new Date(hrecords[1].transactionTimestamp);

                    let q1 = client.buildQuery('SELECT org.hyperledger.composer.system.HistorianRecord  WHERE (transactionTimestamp > _$justnow)');
                    return client.query(q1, { justnow: now });
                })
                .then((result) => {
                    result.length.should.equal(2);

                });


        });


    });


    before(function () {
        // need factor this deployCommon out shortly.
        return deployCommon()
            .then(() => {
                return TestUtil.getClient()
                    .then((result) => {
                        client = result;
                    });
            });
    });

    beforeEach(() => { });

    afterEach(() => {
        return TestUtil.getClient()
            .then((result) => {
                client = result;
            });
    });



});
