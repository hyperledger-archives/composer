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
const uuid = require('uuid');

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.should();

if (process.setMaxListeners) {
    process.setMaxListeners(Infinity);
}

describe('Access control system tests', function() {
    this.retries(TestUtil.retries());

    let bnID;
    let businessNetworkDefinition;
    let client, aliceClient, bobClient;
    let alice, bob;
    let aliceAssetRegistry, bobAssetRegistry;
    let aliceParticipantRegistry, bobParticipantRegistry;
    let aliceCar, bobCar;
    let cardStore;

    before(async () => {
        await TestUtil.setUp();
    });

    before(async () => {

        // In this systest we are fully specifying the model file with a fileName and content
        const modelFiles = [
            { fileName: 'models/accesscontrols.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.cto'), 'utf8')}
        ];
        const scriptFiles = [
            { identifier: 'identities.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-accesscontrols@0.0.1', 'The network for the access controls system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        let aclFile = businessNetworkDefinition.getAclManager().createAclFile('permissions.acl', fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.acl'), 'utf8'));
        businessNetworkDefinition.getAclManager().setAclFile(aclFile);


        bnID = businessNetworkDefinition.getName();

        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-accesscontrols');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
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
        const participantRegistry = await client.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
        await participantRegistry.addAll([alice, bob]);
        const aliceIdentity = await client.issueIdentity(alice, uuid.v4());
        aliceClient = await TestUtil.getClient(cardStore,'systest-accesscontrols', aliceIdentity.userID, aliceIdentity.userSecret);
        const bobIdentity = await client.issueIdentity(bob, uuid.v4());
        bobClient = await TestUtil.getClient(cardStore,'systest-accesscontrols', bobIdentity.userID, bobIdentity.userSecret);
        const assetRegistry = await client.getAssetRegistry('systest.accesscontrols.SampleAsset');
        await assetRegistry.addAll([aliceCar, bobCar]);
        aliceAssetRegistry = await aliceClient.getAssetRegistry('systest.accesscontrols.SampleAsset');
        bobAssetRegistry = await bobClient.getAssetRegistry('systest.accesscontrols.SampleAsset');
        aliceParticipantRegistry = await aliceClient.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
        bobParticipantRegistry = await bobClient.getParticipantRegistry('systest.accesscontrols.SampleParticipant');
    });

    afterEach(async () => {
        client = await TestUtil.getClient(cardStore,'systest-accesscontrols');
    });

    it('should reject transaction if you do not have permission to execute it', () => {
        let bobsfactory = bobClient.getBusinessNetwork().getFactory();
        let tx = bobsfactory.newTransaction('systest.accesscontrols','UpdateAssetValue');

        let alicesfactory = aliceClient.getBusinessNetwork().getFactory();
        let newAsset = alicesfactory.newResource('systest.accesscontrols','txAsset','aid001');
        newAsset.theValue='Mine all mine';
        let txAssetRegistry;
        return aliceClient.getAssetRegistry('systest.accesscontrols.txAsset')
        .then((_txAssetRegistry)=>{
            txAssetRegistry = _txAssetRegistry;
            return txAssetRegistry.add(newAsset);
        })
        .then(()=>{
            // bob tries to update it
            tx.newValue='Bob trying to steal Alice\'s asset';
            tx.theAsset = newAsset;
            return bobClient.submitTransaction(tx);
        }).should.be.rejectedWith(/ does not have \'CREATE\' access to resource/);

    });

    it('should be able to allow access only in a transaction function', () => {
        let bobsfactory = bobClient.getBusinessNetwork().getFactory();
        let alicesfactory = aliceClient.getBusinessNetwork().getFactory();

        let question = alicesfactory.newResource('systest.accesscontrols','Question','qid1');
        let answer = alicesfactory.newResource('systest.accesscontrols','Answer','aid1');
        let answerRelationship = alicesfactory.newRelationship('systest.accesscontrols','Answer','aid1');

        question.question='What is the meaning of life?';
        question.correctAnswer = answerRelationship;
        answer.text='42';

        let questionRegistry;
        let answerRegistry;

        return aliceClient.getAssetRegistry('systest.accesscontrols.Question')
            .then((result)=>{
                questionRegistry = result;
                return aliceClient.getAssetRegistry('systest.accesscontrols.Answer');
            })
            .then((result)=>{
                answerRegistry = result;
                return questionRegistry.add(question);
            })
           .then(()=>{
               return answerRegistry.add(answer);
           })
           .then(()=> {
                // bob should be able to submit a transaction to get his answer validated
               let tx = bobsfactory.newTransaction('systest.accesscontrols','MarkQuestion');
               let q = bobsfactory.newRelationship('systest.accesscontrols','Question','qid1');
               tx.question = q;
               tx.text = 'chocolate';
               return bobClient.submitTransaction(tx);
           }).should.be.rejectedWith(/uh-oh/);
    });


    it('should be able to enforce read access permissions on an asset registry via client getAll', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should only be able to read Alice's car.
                return aliceAssetRegistry.getAll()
                    .should.eventually.be.deep.equal([aliceCar]);
            })
            .then(() => {
                // Bob should only be able to read Bob's car.
                return bobAssetRegistry.getAll()
                    .should.eventually.be.deep.equal([bobCar]);
            });
    });

    it('should be able to enforce read access permissions on an asset registry via client get', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should be able to get her car by ID.
                return aliceAssetRegistry.get('AL1 CE')
                    .should.eventually.be.deep.equal(aliceCar);
            })
            .then(() => {
                // Alice should not be able to get Bob's car by ID.
                return aliceAssetRegistry.get('BO85 CAR')
                    .should.be.rejectedWith(/does not exist/);
            })
            .then(() => {
                // Bob should be able to get his car by ID.
                return bobAssetRegistry.get('BO85 CAR')
                    .should.eventually.be.deep.equal(bobCar);
            })
            .then(() => {
                // Bob should not be able to get Alice's car by ID.
                return bobAssetRegistry.get('AL1 CE')
                    .should.be.rejectedWith(/does not exist/);
            });
    });

    it('should be able to enforce read access permissions on an asset registry via client exists', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should be able to see if her car exists.
                return aliceAssetRegistry.exists('AL1 CE')
                    .should.eventually.be.equal(true);
            })
            .then(() => {
                // Alice should not be able to see if Bob's car exists.
                return aliceAssetRegistry.exists('BO85 CAR')
                    .should.eventually.be.equal(false);
            })
            .then(() => {
                // Bob should be able to see if his car exists.
                return bobAssetRegistry.exists('BO85 CAR')
                    .should.eventually.be.equal(true);
            })
            .then(() => {
                // Bob should not be able to see if Alice's car exists.
                return bobAssetRegistry.exists('AL1 CE')
                    .should.eventually.be.equal(false);
            });
    });

    it('should be able to enforce read access permissions on an asset registry via client query', function () {
        return Promise.resolve()
            .then(() => {
                const query = aliceClient.buildQuery('SELECT systest.accesscontrols.SampleAsset');
                return aliceClient.query(query)
                    .should.eventually.be.deep.equal([aliceCar]);
            })
            .then(() => {
                const query = bobClient.buildQuery('SELECT systest.accesscontrols.SampleAsset');
                return bobClient.query(query)
                    .should.eventually.be.deep.equal([bobCar]);
            });
    });

    it('should be able to enforce read access permissions on a participant registry via client getAll', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should only be able to read Alice's record.
                return aliceParticipantRegistry.getAll()
                    .should.eventually.be.deep.equal([alice]);
            })
            .then(() => {
                // Bob should only be able to read Bob's record.
                return bobParticipantRegistry.getAll()
                    .should.eventually.be.deep.equal([bob]);
            });
    });

    it('should be able to enforce read access permissions on a participant registry via client get', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should be able to get her record by ID.
                return aliceParticipantRegistry.get('alice@mailcorp.com')
                    .should.eventually.be.deep.equal(alice);
            })
            .then(() => {
                // Alice should not be able to get Bob's record by ID.
                return aliceParticipantRegistry.get('bob@mailcorp.com')
                    .should.be.rejectedWith(/does not exist/);
            })
            .then(() => {
                // Bob should be able to get his record by ID.
                return bobParticipantRegistry.get('bob@mailcorp.com')
                    .should.eventually.be.deep.equal(bob);
            })
            .then(() => {
                // Bob should not be able to get Alice's record by ID.
                return bobParticipantRegistry.get('alice@mailcorp.com')
                    .should.be.rejectedWith(/does not exist/);
            });
    });

    it('should be able to enforce read access permissions on a participant registry via client exists', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should be able to see if her record exists.
                return aliceParticipantRegistry.exists('alice@mailcorp.com')
                    .should.eventually.be.equal(true);
            })
            .then(() => {
                // Alice should not be able to see if Bob's record exists.
                return aliceParticipantRegistry.exists('bob@mailcorp.com')
                    .should.eventually.be.equal(false);
            })
            .then(() => {
                // Bob should be able to see if his record exists.
                return bobParticipantRegistry.exists('bob@mailcorp.com')
                    .should.eventually.be.equal(true);
            })
            .then(() => {
                // Bob should not be able to see if Alice's record exists.
                return bobParticipantRegistry.exists('alice@mailcorp.com')
                    .should.eventually.be.equal(false);
            });
    });

    it('should be able to enforce read access permissions on a participant registry via client query', function () {
        return Promise.resolve()
            .then(() => {
                const query = aliceClient.buildQuery('SELECT systest.accesscontrols.SampleParticipant');
                return aliceClient.query(query)
                    .should.eventually.be.deep.equal([alice]);
            })
            .then(() => {
                const query = bobClient.buildQuery('SELECT systest.accesscontrols.SampleParticipant');
                return bobClient.query(query)
                    .should.eventually.be.deep.equal([bob]);
            });
    });

    it('should be able to enforce update access permissions on an asset registry via client update', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should not be able to update Bob's car.
                bobCar.theValue = 'lol alice is a haxxor';
                return aliceAssetRegistry.update(bobCar)
                    .should.be.rejected;
            })
            .then(() => {
                // Bob should not be able to update Alice's car.
                aliceCar.theValue = 'lol bob is a haxxor';
                return bobAssetRegistry.update(aliceCar)
                    .should.be.rejected;
            })
            .then(() => {
                // Alice should only be able to update Alice's car.
                aliceCar.theValue = 'alice rules';
                return aliceAssetRegistry.update(aliceCar);
            })
            .then(() => {
                // Bob should only be able to update Bob's car.
                bobCar.theValue = 'bob rules';
                return bobAssetRegistry.update(bobCar);
            });
    });

    it('should be able to enforce update access permissions on a participant registry via client update', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should not be able to update Bob's record.
                bob.lastName = 'lol alice is a haxxor';
                return aliceParticipantRegistry.update(bob)
                    .should.be.rejected;
            })
            .then(() => {
                // Bob should not be able to update Alice's record.
                alice.lastName = 'lol bob is a haxxor';
                return bobParticipantRegistry.update(alice)
                    .should.be.rejected;
            })
            .then(() => {
                // Alice should only be able to update Alice's record.
                alice.lastName = 'alice rules';
                return aliceParticipantRegistry.update(alice);
            })
            .then(() => {
                // Bob should only be able to update Bob's record.
                bob.lastName = 'bob rules';
                return bobParticipantRegistry.update(bob);
            });
    });

    it('should be able to enforce delete access permissions on an asset registry via client remove', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should not be able to remove Bob's car by ID.
                return aliceAssetRegistry.remove('BO85 CAR')
                    .should.be.rejected;
            })
            .then(() => {
                // Bob should not be able to remove Alice's car by ID.
                return bobAssetRegistry.remove('AL1 CE')
                    .should.be.rejected;
            })
            .then(() => {
                // Alice should only be able to remove Alice's car.
                return aliceAssetRegistry.remove('AL1 CE');
            })
            .then(() => {
                // Bob should only be able to remove Bob's car.
                return bobAssetRegistry.remove('BO85 CAR');
            });
    });

    it('should be able to enforce delete access permissions on a participant registry via client remove', () => {
        return Promise.resolve()
            .then(() => {
                // Alice should not be able to remove Bob's record by ID.
                return aliceParticipantRegistry.remove('bob@mailcorp.com')
                    .should.be.rejected;
            })
            .then(() => {
                // Bob should not be able to remove Alice's record by ID.
                return bobParticipantRegistry.remove('alice@mailcorp.com')
                    .should.be.rejected;
            })
            .then(() => {
                // Alice should only be able to remove Alice's record.
                return aliceParticipantRegistry.remove('alice@mailcorp.com');
            })
            .then(() => {
                // Bob should only be able to remove Bob's record.
                return bobParticipantRegistry.remove('bob@mailcorp.com');
            });
    });

});
