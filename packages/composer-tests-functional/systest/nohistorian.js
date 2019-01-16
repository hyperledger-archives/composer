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

if (process.setMaxListeners) {
    process.setMaxListeners(Infinity);
}

let client;
let cardStore;
let bnID;
let businessNetworkDefinition;

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

describe('No Historian Information recorded', function() {

    this.retries(TestUtil.retries());

    before(async () => {
        await TestUtil.setUp();
        const modelFiles = [
            { fileName: 'models/accesscontrols.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/accesscontrols.cto'), 'utf8')},
            { fileName: 'models/participants.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/participants.cto'), 'utf8')},
            { fileName: 'models/assets.cto',       contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/assets.cto'), 'utf8')},
            { fileName: 'models/transactions.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.cto'), 'utf8')},
            { fileName: 'models/events.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/events.cto'), 'utf8') }
        ];
        const scriptFiles = [
           { identifier: 'transactions.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/common-network/transactions.js'), 'utf8') },
           { identifier: 'events.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/events.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-no-historian@0.0.1', 'The network for the access controls system tests');
        businessNetworkDefinition.getMetadata().getPackageJson().disableHistorian = true;
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
        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-no-historian');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
    });

    afterEach(async () => {
        client = await TestUtil.getClient(cardStore,'systest-historian');
    });

    describe('CRUD Asset', () => {
        it('should track updates for CREATE asset calls ', () => {
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
                .then(() => {
                    return client.getHistorian();
                }).then((result) => {
                    historian = result;
                    return client.getTransactionRegistry('org.hyperledger.composer.system.AddAsset');
                }).then((result) => {
                    return historian.getAll();
                }).then((result) => {

                    // there should be a create asset record for the 3 assets
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });


        });


        it('should track updates for UPDATE asset calls ', () => {

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
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });




        });
        it('should track updates for DELETE asset calls ', () => {

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
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });
        });

    });

    describe('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => {
            let participantRegistry;
            let historian;
            let hrecords;
            return client.getHistorian()
                .then((result) => {
                    historian = result;
                    return historian.getAll();
                })
                .then((historianRecords) => {
                    historianRecords.length.should.equal(0);
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
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });
        });


        it('should track updates for UPDATE Participant calls ', () => {
            let participantRegistry;
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
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });
        });

        it('should track updates for DELETE Participant calls ', () => {
            let participantRegistry;
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
                    return historian.getAll();
                }).then((result) => {
                    hrecords = result;
                    hrecords.length.should.equal(0);
                });
        });
    });

    describe('Transaction invocations', () => {
        it('Successful transaction should have contents recorded', () => {
            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.transactions', 'SimpleTransactionWithPrimitiveTypes');
            let historian;
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
                    return historian.get(transaction.getIdentifier());
                }).should.be.rejectedWith(/does not exist/);
        });

        it('Successful transaction should have events recorded',async () => {
            let factory = client.getBusinessNetwork().getFactory();
            let transaction = factory.newTransaction('systest.events', 'EmitComplexEvent');
            let historian;
            this.timeout(1000); // Delay to prevent transaction failing

            // Listen for the event
            const promise = new Promise((resolve, reject) => {
                client.on('event', (ev) => {
                    resolve();
                });
            });

            await client.submitTransaction(transaction);
            await promise;
            historian = await client.getHistorian();
            await historian.get(transaction.getIdentifier()).should.be.rejectedWith(/does not exist/);
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

});
