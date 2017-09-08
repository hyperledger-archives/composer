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



// const uuid = require('uuid');

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




describe('Historian', () => {

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
                    //console.log(hrecords);
                    rmAssetTransactionRegistry = result;
                    return rmAssetTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    //console.log(result);


                    result.resourceIds[0].should.equal('dogeAsset1');
                    return rmAssetTransactionRegistry.get('dogAsset1');

                }).should.be.rejectedWith(/does not exist/);


        });

    });

    describe.only('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => {
            let participantRegistry, addParticipantTransactionRegistry;
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
                .then(function () {
                    let participant = createParticipant('dogeParticipant2');
                    return participantRegistry.add(participant);
                })
                .then(function () {
                    let participant = createParticipant('dogeParticipant3');
                    return participantRegistry.add(participant);
                })
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return client.getTransactionRegistry('org.hyperledger.composer.system.AddParticipant');
                }).then((result) => {
                    addParticipantTransactionRegistry = result;
                    return historian.getAll();
                }).then((result) => {

                    // there should be a create participant record for the 3 participants
                    hrecords = result.filter((element) => {
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
                    //console.log(hrecords);
                    rmParticipantTransactionRegistry = result;
                    return rmParticipantTransactionRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    //console.log(result);


                    result.resourceIds[0].should.equal('dogeParticipant1');
                    return rmParticipantTransactionRegistry.get('dogParticipant1');

                }).should.be.rejectedWith(/does not exist/);


        });
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
        it('Succesful transaction should have contents recorded', () => { });
        it('Unsuccesful transaction should not cause issues', () => { });
    });

    describe('ACLs', () => {
        it('Retrict access to historian registry', () => { });
        it('Allow acces to historian regsitry, but not to transaction information', () => { });
        it('Allow acces to historian regsitry, but not to event information', () => { });
        it('Allow acces to historian regsitry, but not to participant or identity information', () => { });
    });

    describe('Query', () => {
        it('For a given asset track how it has changed over time', () => { });
        it('For a given particpant track how what they have changed over time', () => { });
        it('For a given identity track how what they have changed over time', () => { });
        it('For a given regsitry track how what has affected over time', () => { });
        it('For a given transaction track what it has been used for', () => { });
    });


    before(function () {
        // need factor this deployCommon out shortly.
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