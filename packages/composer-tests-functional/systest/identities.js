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
const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

process.setMaxListeners(Infinity);

describe('Identity system tests', () => {
    let bnID;
    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });
    let businessNetworkDefinition;
    let client;
    let participant;

    before(function () {
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
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        bnID = businessNetworkDefinition.getName();
        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest-identities')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
    });

    beforeEach(() => {
        let factory = client.getBusinessNetwork().getFactory();
        participant = factory.newResource('systest.identities', 'SampleParticipant', 'bob@uk.ibm.com');
        participant.firstName = 'Bob';
        participant.lastName = 'Bobbington';
        return client.getParticipantRegistry('systest.identities.SampleParticipant')
            .then((participantRegistry) => {
                return participantRegistry.add(participant);
            });
    });

    afterEach(() => {
        return TestUtil.getClient('systest-identities')
            .then((result) => {
                client = result;
            });
    });

    it('should issue an identity and make it available for a ping request', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.ping();
            })
            .then((result) => {
                result.participant.should.equal(participant.getFullyQualifiedIdentifier());
            });
    });

    it('should bind an identity and make it available for a ping request', function () {
        let identity, certificate, privateKey;
        identity = uuid.v4();
        if (TestUtil.isHyperledgerFabricV1()) {
            const certificateFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem');
            certificate = fs.readFileSync(certificateFile, 'utf8');
            const privateKeyFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/key.pem');
            privateKey = fs.readFileSync(privateKeyFile, 'utf8');
        } else {
            certificate = [
                '----- BEGIN CERTIFICATE -----',
                Buffer.from('User1@org1.example.com' + ':' + uuid.v4()).toString('base64'),
                '----- END CERTIFICATE -----'
            ].join('\n').concat('\n');
            privateKey = 'not used';
        }
        return client.bindIdentity(participant, certificate)
            .then(() => {
                const admin = new AdminConnection();
                if (TestUtil.isHyperledgerFabricV1()) {
                    return admin.importIdentity('composer-systests-org1', identity, certificate, privateKey);
                } else {
                    return admin.importIdentity('composer-systests', identity, certificate, privateKey);
                }
            })
            .then(() => {
                return TestUtil.getClient('systest-identities', identity, 'not used');
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
        let identityName = uuid.v4();
        return client.issueIdentity(participant, identityName)
            .then((identity) => {
                return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.getIdentityRegistry();
            })
            .then((identityRegistry) => {
                return identityRegistry.getAll();
            })
            .then((identities) => {
                const identity = identities.find((identity) => {
                    return identity.name === identityName;
                });
                return client.revokeIdentity(identity);
            })
            .then(() => {
                return client.ping();
            })
            .should.be.rejectedWith(/The current identity has been revoked/);
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
                        return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
                    });
            })
            .then((result) => {
                client = result;
                return client.ping();
            })
            .should.be.rejectedWith(/The current identity is bound to a participant that does not exist/);
    });

    it('should issue an identity and make the participant available for transaction processor functions', () => {
        let identity = uuid.v4();
        return client.issueIdentity(participant, identity)
            .then((identity) => {
                return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            });
    });

    it('should bind an identity and make the participant available for transaction processor functions', function () {
        let identity, certificate, privateKey;
        identity = uuid.v4();
        if (TestUtil.isHyperledgerFabricV1()) {
            const certificateFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User2@org1.example.com/msp/signcerts/User2@org1.example.com-cert.pem');
            certificate = fs.readFileSync(certificateFile, 'utf8');
            const privateKeyFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User2@org1.example.com/msp/keystore/key.pem');
            privateKey = fs.readFileSync(privateKeyFile, 'utf8');
        } else {
            certificate = [
                '----- BEGIN CERTIFICATE -----',
                Buffer.from('User2@org1.example.com' + ':' + uuid.v4()).toString('base64'),
                '----- END CERTIFICATE -----'
            ].join('\n').concat('\n');
            privateKey = 'not used';
        }
        return client.bindIdentity(participant, certificate)
            .then(() => {
                const admin = new AdminConnection();
                if (TestUtil.isHyperledgerFabricV1()) {
                    return admin.importIdentity('composer-systests-org1', identity, certificate, privateKey);
                } else {
                    return admin.importIdentity('composer-systests', identity, certificate, privateKey);
                }
            })
            .then(() => {
                return TestUtil.getClient('systest-identities', identity, 'not used');
            })
            .then((result) => {
                client = result;
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            });
    });

    it('should throw an exception for a transaction processor function using a revoked identity', () => {
        let identityName = uuid.v4();
        return client.issueIdentity(participant, identityName)
            .then((identity) => {
                return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
            })
            .then((result) => {
                client = result;
                return client.getIdentityRegistry();
            })
            .then((identityRegistry) => {
                return identityRegistry.getAll();
            })
            .then((identities) => {
                const identity = identities.find((identity) => {
                    return identity.name === identityName;
                });
                return client.revokeIdentity(identity);
            })
            .then(() => {
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            })
            .should.be.rejectedWith(/The current identity has been revoked/);
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
                        return TestUtil.getClient('systest-identities', identity.userID, identity.userSecret);
                    });
            })
            .then((result) => {
                client = result;
                let factory = client.getBusinessNetwork().getFactory();
                let transaction = factory.newTransaction('systest.identities', 'SampleTransaction');
                return client.submitTransaction(transaction);
            })
            .should.be.rejectedWith(/The current identity is bound to a participant that does not exist/);
    });

    it('should export credentials for previously imported identity', function () {
        let profileName;
        let certificate;
        let privateKey;
        if (TestUtil.isHyperledgerFabricV1()) {
            profileName = 'composer-systests-org1';
            const certificateFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem');
            certificate = fs.readFileSync(certificateFile, 'utf8').replace(/\r/g, '');
            const privateKeyFile = path.resolve(__dirname, '../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/key.pem');
            privateKey = fs.readFileSync(privateKeyFile, 'utf8').replace(/\r/g, '');
        } else {
            profileName = 'composer-systests';
            certificate =
                '----- BEGIN CERTIFICATE -----\n' +
                Buffer.from('User2@org1.example.com' + ':' + uuid.v4()).toString('base64') + '\n' +
                '----- END CERTIFICATE -----\n';
            privateKey = 'FAKE_PRIVATE_KEY';
        }

        const identity = uuid.v4();

        const adminConnection = new AdminConnection();

        return adminConnection.importIdentity(profileName, identity, certificate, privateKey)
            .then(() => {
                return adminConnection.exportIdentity(profileName, identity);
            })
            .then((credentials) => {
                // Remove any carriage returns that may have been added by fabric
                credentials.certificate = credentials.certificate.replace(/\r/g, '');
                credentials.privateKey = credentials.privateKey.replace(/\r/g, '');

                credentials.should.deep.equal({
                    certificate: certificate,
                    privateKey: privateKey
                });
            });
    });

});
