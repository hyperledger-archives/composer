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

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;
const { CertificateUtil, IdCard } = require('composer-common');
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

describe('Identity system tests', function() {

    this.retries(TestUtil.retries());

    let cardStore;
    let bnID;
    let businessNetworkDefinition;
    let client;
    let participant;

    before(async () => {
        await TestUtil.setUp();
        // In this systest we are intentionally not fully specifying the model file with a fileName, and supplying null as the value
        const modelFiles = [
            { fileName: null, contents: fs.readFileSync(path.resolve(__dirname, 'data/identities.cto'), 'utf8') }
        ];
        const scriptFiles = [
            { identifier: 'identities.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/identities.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-identities@0.0.1', 'The network for the identities system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            const scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        bnID = businessNetworkDefinition.getName();
        cardStore = await TestUtil.deploy(businessNetworkDefinition);
        client = await TestUtil.getClient(cardStore,'systest-identities');
    });

    after(async () => {
        await TestUtil.undeploy(businessNetworkDefinition);
        await TestUtil.tearDown();
    });

    beforeEach(async () => {
        await TestUtil.resetBusinessNetwork(cardStore,bnID, 0);
        const factory = client.getBusinessNetwork().getFactory();
        participant = factory.newResource('systest.identities', 'SampleParticipant', 'bob@uk.ibm.com');
        participant.firstName = 'Bob';
        participant.lastName = 'Bobbington';
        const participantRegistry = await client.getParticipantRegistry('systest.identities.SampleParticipant');
        await participantRegistry.add(participant);
    });

    afterEach(async () => {
        client = await TestUtil.getClient(cardStore,'systest-identities');
    });

    let identityIndex = 1;

    /**
     * Get the next identity.
     * @return {Object} The next identity.
     */
    function getNextIdentity() {
        let certificate, privateKey;
        if (TestUtil.isHyperledgerFabricV1()) {
            const certificateFile = path.resolve(__dirname, `../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User${identityIndex}@org1.example.com/msp/signcerts/User${identityIndex}@org1.example.com-cert.pem`);
            certificate = fs.readFileSync(certificateFile, 'utf8');
            const privateKeyFile = path.resolve(__dirname, `../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User${identityIndex}@org1.example.com/msp/keystore/key.pem`);
            privateKey = fs.readFileSync(privateKeyFile, 'utf8');
            identityIndex++;
        } else {
            ({ certificate, privateKey } = CertificateUtil.generate({ commonName: `User${identityIndex}@org1.example.com` }));
            identityIndex++;
        }
        return { certificate, privateKey };
    }

    it('should issue an identity and make the participant available for a ping request', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const result = await client.ping();
        result.participant.should.equal(participant.getFullyQualifiedIdentifier());
    });

    it('should issue an identity and make the identity available for a ping request', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const result = await client.ping();
        const identityRegistry = await client.getIdentityRegistry();
        const identities = await identityRegistry.getAll();
        const matchingIdentity = identities.find((identity) => {
            return identity.name === identityName;
        });
        result.identity.should.equal(matchingIdentity.getFullyQualifiedIdentifier());
    });

    it('should issue an identity that can issue another identity and make it available for a ping request', async () => {
        const identityName = uuid.v4();
        const identityName2 = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName, {issuer: true});
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const result = await client.ping();
        result.participant.should.equal(participant.getFullyQualifiedIdentifier());
        const factory = client.getBusinessNetwork().getFactory();
        const participant2 = factory.newResource('systest.identities', 'SampleParticipant', 'frank@uk.ibm.com');
        participant2.firstName = 'Frank';
        participant2.lastName = 'Frankly';
        const participantRegistry = await client.getParticipantRegistry('systest.identities.SampleParticipant');
        await participantRegistry.add(participant2);
        const identity2 = await client.issueIdentity(participant2, identityName2, {issuer: true});
        client = await TestUtil.getClient(cardStore,'systest-identities', identity2.userID, identity2.userSecret);
        const result2 = await client.ping();
        result2.participant.should.equal(participant2.getFullyQualifiedIdentifier());
    });

    it('should bind an identity and make it available for a ping request', async function () {
        const identityName = uuid.v4();
        const cardName = `${identityName}@systest-identities`;
        const { certificate, privateKey } = getNextIdentity();
        await client.bindIdentity(participant, certificate);
        const card = new IdCard({ businessNetwork: 'systest-identities', userName: identityName }, TestUtil.getCurrentConnectionProfile());
        card.setCredentials({ certificate, privateKey });
        const admin = new AdminConnection({ cardStore });
        await admin.importCard(cardName, card);
        client = new BusinessNetworkConnection({ cardStore });
        await client.connect(cardName);
        const result = await client.ping();
        result.participant.should.equal(participant.getFullyQualifiedIdentifier());
    });

    it('should throw an exception for a ping request using a revoked identity', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const identityRegistry = await client.getIdentityRegistry();
        const identities = await identityRegistry.getAll();
        const matchingIdentity = identities.find((identity) => {
            return identity.name === identityName;
        });
        await client.revokeIdentity(matchingIdentity);
        await client.ping()
            .should.be.rejectedWith(/The current identity, with the name \'.+?\' and the identifier \'.+?\', has been revoked/);
    });

    it('should throw an exception for a ping request using a identity that is mapped to a non-existent participant', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        const participantRegistry = await client.getParticipantRegistry('systest.identities.SampleParticipant');
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        await participantRegistry.remove(participant);
        await client.ping()
            .should.be.rejectedWith(/The current identity, with the name \'.+?\' and the identifier \'.+?\', is bound to a participant \'resource:systest.identities.SampleParticipant#bob@uk.ibm.com\' that does not exist/);
    });

    it('should issue an identity and make the participant available for transaction processor functions', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentParticipant');
        await client.submitTransaction(transaction);
    });

    it('should issue an identity and make the identity available for transaction processor functions', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentIdentity');
        await client.submitTransaction(transaction);
    });

    it('should bind an identity and make the participant available for transaction processor functions', async function () {
        const identityName = uuid.v4();
        const cardName = `${identityName}@systest-identities`;
        const { certificate, privateKey } = getNextIdentity();
        await client.bindIdentity(participant, certificate);
        const card = new IdCard({ businessNetwork: 'systest-identities', userName: identityName }, TestUtil.getCurrentConnectionProfile());
        card.setCredentials({ certificate, privateKey });
        const admin = new AdminConnection({ cardStore });
        await admin.importCard(cardName, card);
        client = new BusinessNetworkConnection({ cardStore });
        await client.connect(cardName);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentParticipant');
        await client.submitTransaction(transaction);
    });

    it('should bind an identity and make the identity available for transaction processor functions', async function () {
        const identityName = uuid.v4();
        const cardName = `${identityName}@systest-identities`;
        const { certificate, privateKey } = getNextIdentity();
        await client.bindIdentity(participant, certificate);
        const card = new IdCard({ businessNetwork: 'systest-identities', userName: identityName }, TestUtil.getCurrentConnectionProfile());
        card.setCredentials({ certificate, privateKey });
        const admin = new AdminConnection({ cardStore });
        await admin.importCard(cardName, card);
        client = new BusinessNetworkConnection({ cardStore });
        await client.connect(cardName);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentIdentity');
        await client.submitTransaction(transaction);
    });

    it('should throw an exception for a transaction processor function using a revoked identity', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        const identityRegistry = await client.getIdentityRegistry();
        const identities = await identityRegistry.getAll();
        const matchingIdentity = identities.find((identity) => {
            return identity.name === identityName;
        });
        await client.revokeIdentity(matchingIdentity);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentParticipant');
        await client.submitTransaction(transaction)
            .should.be.rejectedWith(/The current identity, with the name \'.+?\' and the identifier \'.+?\', has been revoked/);
    });

    it('should throw an exception for a transaction processor function using a identity that is mapped to a non-existent participant', async () => {
        const identityName = uuid.v4();
        const identity = await client.issueIdentity(participant, identityName);
        const participantRegistry = await client.getParticipantRegistry('systest.identities.SampleParticipant');
        client = await TestUtil.getClient(cardStore,'systest-identities', identity.userID, identity.userSecret);
        await participantRegistry.remove(participant);
        const factory = client.getBusinessNetwork().getFactory();
        const transaction = factory.newTransaction('systest.identities', 'TestGetCurrentParticipant');
        await client.submitTransaction(transaction)
            .should.be.rejectedWith(/The current identity, with the name \'.+?\' and the identifier \'.+?\', is bound to a participant \'resource:systest.identities.SampleParticipant#bob@uk.ibm.com\' that does not exist/);
    });

    it('should export credentials for previously imported identity', async () => {
        const identityName = uuid.v4();
        const cardName = `${identityName}@systest-identities`;
        const { certificate, privateKey } = getNextIdentity();
        const card = new IdCard({ businessNetwork: 'systest-identities', userName: identityName }, TestUtil.getCurrentConnectionProfile());
        card.setCredentials({ certificate, privateKey });
        const admin = new AdminConnection({ cardStore });
        await admin.importCard(cardName, card);
        const card2 = await admin.exportCard(cardName);
        // Remove any carriage returns that may have been added by fabric
        const credentials = card2.getCredentials();
        credentials.should.deep.equal({
            certificate: certificate,
            privateKey: privateKey
        });
    });

});
