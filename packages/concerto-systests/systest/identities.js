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

const BusinessNetworkDefinition = require('@ibm/concerto-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('Identity system tests', () => {

    let businessNetworkDefinition;
    let admin;
    let client;
    let participant;

    before(function () {
        if (TestUtil.isEmbedded() || TestUtil.isWeb()) {
            this.skip();
            return;
        }
        const modelFiles = [
            fs.readFileSync(path.resolve(__dirname, 'data/identities.cto'), 'utf8')
        ];
        const scriptFiles = [
            { identifier: 'identities.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/identities.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest.identities@0.0.1', 'The network for the identities system tests');
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
                return TestUtil.getClient('systest.identities')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    beforeEach(() => {
        let factory = client.getBusinessNetwork().getFactory();
        participant = factory.newInstance('systest.identities', 'SampleParticipant', 'bob@uk.ibm.com');
        participant.firstName = 'Bob';
        participant.lastName = 'Bobbington';
        return client.getParticipantRegistry('systest.identities.SampleParticipant')
            .then((participantRegistry) => {
                return participantRegistry.add(participant);
            });
    });

    afterEach(() => {
        return TestUtil.getClient('systest.identities')
            .then((result) => {
                client = result;
            });
    });

    it('should issue an identity and make it available for a ping request', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.ping();
            })
            .then((result) => {
                result.participant.should.equal(participant.getFullyQualifiedIdentifier());
            });
    });

    it('should throw an exception for a ping request using a revoked identity', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.revokeIdentity(identity);
            })
            .then(() => {
                return client.ping();
            })
            .should.be.rejectedWith(/The identity may be invalid or may have been revoked/);
    });

    it('should throw an exception for a ping request using a identity that is mapped to a non-existent participant', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return client.getParticipantRegistry('systest.identities.SampleParticipant')
                    .then((participantRegistry) => {
                        return participantRegistry.remove(participant);
                    })
                    .then(() => {
                        return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
                    });
            })
            .then((result) => {
                client = result;
                return client.ping();
            })
            .should.be.rejectedWith(/The identity may be invalid or may have been revoked/);
    });

    it('should issue an identity and make the participant available for transaction processor functions', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            });
    });

    it('should throw an exception for a transaction processor function using a revoked identity', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.revokeIdentity(identity);
            })
            .then(() => {
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            })
            .should.be.rejectedWith(/The identity may be invalid or may have been revoked/);
    });

    it('should throw an exception for a transaction processor function using a identity that is mapped to a non-existent participant', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return client.getParticipantRegistry('systest.identities.SampleParticipant')
                    .then((participantRegistry) => {
                        return participantRegistry.remove(participant);
                    })
                    .then(() => {
                        return TestUtil.getClient('systest.identities', identity.userID, identity.userSecret);
                    });
            })
            .then((result) => {
                client = result;
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            })
            .should.be.rejectedWith(/The identity may be invalid or may have been revoked/);
    });

});
