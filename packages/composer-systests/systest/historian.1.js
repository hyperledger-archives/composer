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

// Place holder for later tests



const uuid = require('uuid');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

process.setMaxListeners(Infinity);

let client;


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
describe.only('Historian.1', () => {



    describe('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => { });
        it('should track updates for RETRIEVE Participant calls ', () => { });
        it('should track updates for UPDATE Participant calls ', () => { });
        it('should track updates for DELETE Participant calls ', () => { });
    });

    describe('CRUD Identity', () => {
        it('should track updates for CREATE Identity calls ', () => { });
        it('should track updates for RETRIEVE Identity calls ', () => { });
        it('should track updates for UPDATE Identity calls ', () => { });
        it('should track updates for DELETE Identity calls ', () => { });
    });

    describe('CRUD Registry', () => {
        it('should track updates for CREATE Registry calls ', () => { });
        it('should track updates for RETRIEVE Registry calls ', () => { });
        it('should track updates for UPDATE Registry calls ', () => { });
        it('should track updates for DELETE Registry calls ', () => { });
    });

    describe('CRUD Network', () => {
        it('should track updates for CREATE Network calls ', () => { });
        it('should track updates for RETRIEVE Network calls ', () => { });
        it('should track updates for UPDATE Network calls ', () => { });
        it('should track updates for DELETE Network calls ', () => { });
    });

    describe('Transaction invocations', () => {
        it('Succesful transaction should have contents recorded', () => {
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

        it('Unsuccesful transaction should not cause issues', () => {

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
        let businessNetworkDefinition;
        let aliceClient, bobClient, charlieClient;
        let alice, bob, charlie;
        let aliceAssetRegistry, bobAssetRegistry;
        let aliceParticipantRegistry, bobParticipantRegistry;
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
            return client.getParticipantRegistry('systest.accesscontrols.SampleParticipant')
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
                })
                .then(() => {
                    return aliceClient.getAssetRegistry('systest.accesscontrols.SampleAsset');
                })
                .then((assetRegistry) => {
                    aliceAssetRegistry = assetRegistry;
                    return bobClient.getAssetRegistry('systest.accesscontrols.SampleAsset');
                })
                .then((assetRegistry) => {
                    bobAssetRegistry = assetRegistry;
                    return aliceClient.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
                })
                .then((participantRegistry) => {
                    aliceParticipantRegistry = participantRegistry;
                    return bobClient.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
                })
                .then((participantRegistry) => {
                    bobParticipantRegistry = participantRegistry;
                });
        });
        it('Check the issue identity calls are there', () => {
            let historian;
            return client.getHistorian()
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                }).then((result) => {

                    result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.IssueIdentity';
                    }).length.should.equal(3);

                    result.filter((element) => {
                        return element.transactionType === 'org.hyperledger.composer.system.ActivateCurrentIdentity';
                    }).length.should.equal(3);
                });
        });
        it('Allow alice access to historian', () => {
            return aliceClient.getHistorian();
        });
        it('Deny bob alice access to historian', () => {
            return bobClient.getHistorian();
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
                    console.log('Charlie getting all historian records');
                    return historian.getAll();
                })
                .then((result) => {

                    let records = result.filter((e) => { e.transactionType === 'org.hyperledger.composer.system.AddAsset'; });
                    console.log(records);
                    // return charlieClient.getTransactionRegistry('org.hyperledger.composer.system.AddAsset').should.be.rejected();
                });

            // add a new participant charlie, who can not access the relationships parts.


        });
        it('Allow acces to historian regsitry, but not to event information', () => { });
        it('Allow acces to historian regsitry, but not to participant or identity information', () => { });
    });

    describe('Query', () => {
        it('For a set of historian records, then select these base on the transaction timestamp', () => {

            let assetRegistry;
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
                        return element.transactionType === 'org.hyperledger.composer.system.AddAsset';
                    }).sort((a, b) => {
                        // console.log(a.transactionTimestamp,b.transactionTimestamp);
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

                    // hrecords.forEach((e)=>{console.log(e.transactionTimestamp);});

                    let now = new Date(hrecords[1].transactionTimestamp);

                    let q1 = client.buildQuery('SELECT org.hyperledger.composer.system.HistorianRecord  WHERE (transactionTimestamp > _$justnow)');
                    return client.query(q1, { justnow: now });
                })
                .then((result) => {
                    result.length.should.equal(2);

                });


        });

        it('For a given particpant track how what they have changed over time', () => { });

        it('For a given identity track how what they have changed over time', () => { });

        it('For a given regsitry track how what has affected over time', () => { });

        it('For a given transaction track what it has been used for', () => { });
    });


    before(function () {
        // need factor this deployCommon out shortly.
        console.log('before');
        return TestUtil.deployCommon()
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
