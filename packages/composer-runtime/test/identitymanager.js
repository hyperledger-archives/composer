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

const Api = require('../lib/api');
const Context = require('../lib/context');
const Factory = require('composer-common').Factory;
const IdentityManager = require('../lib/identitymanager');
const IdentityService = require('../lib/identityservice');
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('IdentityManager', () => {

    let mockApi;
    let mockContext;
    let mockIdentityService;
    let mockRegistryManager;
    let mockIdentityRegistry;
    let modelManager;
    let factory;
    let identityManager;

    beforeEach(() => {
        mockApi = sinon.createStubInstance(Api);
        mockContext = sinon.createStubInstance(Context);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockContext.getIdentityService.returns(mockIdentityService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockIdentityRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager.get.withArgs('Asset', 'org.hyperledger.composer.system.Identity').resolves(mockIdentityRegistry);
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        participant SampleParticipant identified by participantId {
            o String participantId
        }
        `);
        factory = new Factory(modelManager);
        mockContext.getFactory.returns(factory);
        identityManager = new IdentityManager(mockContext);
    });

    describe('#getIdentityRegistry', () => {

        it('should get the identity registry', () => {
            return identityManager.getIdentityRegistry()
                .should.eventually.be.equal(mockIdentityRegistry);
        });

    });

    describe('#getIdentity', () => {

        it('should look up an identity using the identifier', () => {
            mockIdentityService.getIdentifier.returns('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63');
            let identity = factory.newResource('org.hyperledger.composer.system', 'Identity', '7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63');
            mockIdentityRegistry.get.withArgs('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63').resolves(identity);
            return identityManager.getIdentity()
                .should.eventually.be.equal(identity);
        });

        it('should look up an issued identity using the name and issuer', () => {
            mockIdentityService.getIdentifier.returns('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63');
            mockIdentityRegistry.get.withArgs('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63').rejects();
            mockIdentityService.getName.returns('admin');
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            let identity = factory.newResource('org.hyperledger.composer.system', 'Identity', '9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
            mockIdentityRegistry.get.withArgs('9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50').resolves(identity);
            return identityManager.getIdentity()
                .should.eventually.be.equal(identity);
        });

        it('should throw for an identity that does not exist', () => {
            mockIdentityService.getIdentifier.returns('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63');
            mockIdentityRegistry.get.withArgs('7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63').rejects();
            mockIdentityService.getName.returns('admin');
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            mockIdentityRegistry.get.withArgs('9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50').rejects();
            return identityManager.getIdentity()
                .should.be.rejectedWith(/The current identity, with the name \'admin\' and the identifier \'7d85a9672abea0dfa45705eed99a536b8470d192e2a17e50c1fb86cb4bccae63\', has not been registered/);
        });

    });

    describe('#validateIdentity', () => {

        let identity;

        beforeEach(() => {
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', '9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
            identity.name = 'admin';
        });

        it('should throw for a revoked identity', () => {
            identity.state = 'REVOKED';
            (() => {
                identityManager.validateIdentity(identity);
            }).should.throw(/The current identity, with the name \'admin\' and the identifier \'9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50\', has been revoked/);
        });

        it('should throw for an issued identity that requires activation', () => {
            identity.state = 'ISSUED';
            (() => {
                identityManager.validateIdentity(identity);
            }).should.throw(/The current identity, with the name \'admin\' and the identifier \'9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50\', must be activated \(ACTIVATION_REQUIRED\)/);
        });

        it('should throw for a bound identity that requires activation', () => {
            identity.state = 'BOUND';
            (() => {
                identityManager.validateIdentity(identity);
            }).should.throw(/The current identity, with the name \'admin\' and the identifier \'9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50\', must be activated \(ACTIVATION_REQUIRED\)/);
        });

        it('should throw for an identity in an unknown state', () => {
            identity.state = 'WOOPWOOP';
            (() => {
                identityManager.validateIdentity(identity);
            }).should.throw(/The current identity, with the name \'admin\' and the identifier \'9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50\', is in an unknown state/);
        });

        it('should not throw for an activated identity', () => {
            identity.state = 'ACTIVATED';
            identityManager.validateIdentity(identity);
        });

    });

    describe('#getParticipant', () => {

        let identity;
        let participant;
        let mockParticipantRegistry;

        beforeEach(() => {
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', '9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
            identity.name = 'admin';
            participant = factory.newResource('org.acme', 'SampleParticipant', 'alice@email.com');
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
            mockParticipantRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Participant', 'org.acme.SampleParticipant').resolves(mockParticipantRegistry);
        });

        it('should get the participant for the identity', () => {
            mockParticipantRegistry.get.withArgs('alice@email.com').resolves(participant);
            return identityManager.getParticipant(identity)
                .should.eventually.be.equal(participant);
        });

        it('should throw if the participant does not exist', () => {
            mockParticipantRegistry.get.withArgs('alice@email.com').rejects(new Error('such error'));
            return identityManager.getParticipant(identity)
                .should.be.rejectedWith(/The current identity, with the name \'admin\' and the identifier \'9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50\', is bound to a participant \'resource:org.acme.SampleParticipant#alice@email.com\' that does not exist/);
        });

    });

    describe('#issueIdentity', () => {

        it('should add a new identity to the identity registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'IssueIdentity');
            tx.participant = factory.newRelationship('org.acme','SampleParticipant', 'alice@email.com');
            tx.identityName = 'alice1';
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            return identityManager.issueIdentity(mockApi, tx)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityRegistry.add);
                    const identity = mockIdentityRegistry.add.args[0][0];
                    identity.getIdentifier().should.equal('e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
                    identity.name.should.equal('alice1');
                    identity.issuer.should.equal('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
                    identity.certificate.should.equal('');
                    identity.state.should.equal('ISSUED');
                    identity.participant.getNamespace().should.equal('org.acme');
                    identity.participant.getType().should.equal('SampleParticipant');
                    identity.participant.getIdentifier().should.equal('alice@email.com');
                });
        });

    });

    describe('#bindIdentity', () => {

        const pem = '-----BEGIN CERTIFICATE-----\nMIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\nWjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\nU2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\nWRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\nA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\nrRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\nCEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\nXVMHPa0iyC497vdNURA=\n-----END CERTIFICATE-----\n';

        it('should add a new identity to the identity registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
            tx.participant = factory.newRelationship('org.acme','SampleParticipant', 'alice@email.com');
            tx.certificate = pem;
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            return identityManager.bindIdentity(mockApi, tx)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityRegistry.add);
                    const identity = mockIdentityRegistry.add.args[0][0];
                    identity.getIdentifier().should.equal('2be26f6d4757b49fbae46f9fbb0c225b2f77508a882e4dd899700b56f62ad639');
                    identity.name.should.equal('');
                    identity.issuer.should.equal('');
                    identity.certificate.should.equal(pem);
                    identity.state.should.equal('BOUND');
                    identity.participant.getNamespace().should.equal('org.acme');
                    identity.participant.getType().should.equal('SampleParticipant');
                    identity.participant.getIdentifier().should.equal('alice@email.com');
                });
        });

    });

    describe('#activateCurrentIdentity', () => {

        const pem = '-----BEGIN CERTIFICATE-----\nMIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\nWjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\nU2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\nWRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\nA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\nrRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\nCEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\nXVMHPa0iyC497vdNURA=\n-----END CERTIFICATE-----\n';
        let tx;

        beforeEach(() => {
            tx = factory.newTransaction('org.hyperledger.composer.system', 'ActivateCurrentIdentity');
        });

        it('should activate an issued identity', () => {
            let identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = 'alice1';
            identity.issuer = '26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417';
            identity.certificate = '';
            identity.state = 'ISSUED';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
            sinon.stub(identityManager, 'getIdentity').resolves(identity);
            sinon.stub(identityManager, 'activateIssuedIdentity').resolves();
            return identityManager.activateCurrentIdentity(mockApi, tx)
                .then(() => {
                    sinon.assert.calledOnce(identityManager.activateIssuedIdentity);
                    sinon.assert.calledWith(identityManager.activateIssuedIdentity, mockIdentityRegistry, identity);
                });
        });

        it('should activate a bound identity', () => {
            let identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = 'alice1';
            identity.issuer = '26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417';
            identity.certificate = pem;
            identity.state = 'BOUND';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
            sinon.stub(identityManager, 'getIdentity').resolves(identity);
            sinon.stub(identityManager, 'activateBoundIdentity').resolves();
            return identityManager.activateCurrentIdentity(mockApi, tx)
                .then(() => {
                    sinon.assert.calledOnce(identityManager.activateBoundIdentity);
                    sinon.assert.calledWith(identityManager.activateBoundIdentity, mockIdentityRegistry, identity);
                });
        });

        it('should throw for an already activated identity', () => {
            let identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = 'alice1';
            identity.issuer = '26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417';
            identity.certificate = pem;
            identity.state = 'ACTIVATED';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
            sinon.stub(identityManager, 'getIdentity').resolves(identity);
            return identityManager.activateCurrentIdentity(mockApi, tx)
                .should.be.rejectedWith(/The current identity, with the name \'alice1\' and the identifier \'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f\', cannot be activated because it is in an unknown state \'ACTIVATED\'/);
        });

    });

    describe('#activateIssuedIdentity', () => {

        const pem = '-----BEGIN CERTIFICATE-----\nMIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\nWjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\nU2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\nWRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\nA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\nrRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\nCEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\nXVMHPa0iyC497vdNURA=\n-----END CERTIFICATE-----\n';

        let identity;

        beforeEach(() => {
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = 'alice1';
            identity.issuer = '26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417';
            identity.certificate = '';
            identity.state = 'ISSUED';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
        });

        it('should throw for an invalid issuer', () => {
            mockIdentityService.getIdentifier.returns('9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
            mockIdentityService.getName.returns('alice1');
            mockIdentityService.getIssuer.returns('f15148476b739e6329781a5b963cc30dc583a124408da8222418a7553843c251');
            mockIdentityService.getCertificate.returns(pem);
            mockIdentityRegistry.remove.resolves();
            mockIdentityRegistry.add.resolves();
            (() => {
                identityManager.activateIssuedIdentity(mockIdentityRegistry, identity);
            }).should.throw(/The current identity, with the name \'alice1\' and the identifier \'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f\', cannot be activated because the issuer is invalid/);
        });

        it('should remove and add the updated identity in the identity registry', () => {
            mockIdentityService.getIdentifier.returns('9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
            mockIdentityService.getName.returns('alice1');
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            mockIdentityService.getCertificate.returns(pem);
            mockIdentityRegistry.remove.resolves();
            mockIdentityRegistry.add.resolves();
            return identityManager.activateIssuedIdentity(mockIdentityRegistry, identity)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityRegistry.remove);
                    sinon.assert.calledWith(mockIdentityRegistry.remove, identity);
                    sinon.assert.calledOnce(mockIdentityRegistry.add);
                    const newIdentity = mockIdentityRegistry.add.args[0][0];
                    newIdentity.getIdentifier().should.equal('9f8b1a1e7280d40f4f14577ee4329473c60f04db3ea0f40c91f9684558c6ab50');
                    newIdentity.name.should.equal('alice1');
                    newIdentity.issuer.should.equal('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
                    newIdentity.certificate.should.equal(pem);
                    newIdentity.state.should.equal('ACTIVATED');
                    newIdentity.participant.getNamespace().should.equal('org.acme');
                    newIdentity.participant.getType().should.equal('SampleParticipant');
                    newIdentity.participant.getIdentifier().should.equal('alice@email.com');
                });
        });

    });

    describe('#activateBoundIdentity', () => {

        const pem = '-----BEGIN CERTIFICATE-----\nMIICGjCCAcCgAwIBAgIRANuOnVN+yd/BGyoX7ioEklQwCgYIKoZIzj0EAwIwczEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMTcwNjI2MTI0OTI2WhcNMjcwNjI0MTI0OTI2\nWjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\nU2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGu8KxBQ1GkxSTMVoLv7NXiYKWj5t6Dh\nWRTJBHnLkWV7lRUfYaKAKFadSii5M7Z7ZpwD8NS7IsMdPR6Z4EyGgwKjTTBLMA4G\nA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\nrRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0gAMEUCIQC4sKQ6\nCEgqbTYe48az95W9/hnZ+7DI5eSnWUwV9vCd/gIgS5K6omNJydoFoEpaEIwM97uS\nXVMHPa0iyC497vdNURA=\n-----END CERTIFICATE-----\n';

        let identity;

        beforeEach(() => {
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = 'alice1';
            identity.issuer = '26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417';
            identity.certificate = pem;
            identity.state = 'ISSUED';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
        });

        it('should update the identity in the identity registry', () => {
            mockIdentityService.getName.returns('alice1');
            mockIdentityService.getIssuer.returns('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
            mockIdentityRegistry.update.resolves();
            return identityManager.activateBoundIdentity(mockIdentityRegistry, identity)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityRegistry.update);
                    const newIdentity = mockIdentityRegistry.update.args[0][0];
                    newIdentity.getIdentifier().should.equal('e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
                    newIdentity.name.should.equal('alice1');
                    newIdentity.issuer.should.equal('26341f1fc63f30886c54abeba3aca520601126ae2a57869d1ec1a3f854ebc417');
                    newIdentity.certificate.should.equal(pem);
                    newIdentity.state.should.equal('ACTIVATED');
                    newIdentity.participant.getNamespace().should.equal('org.acme');
                    newIdentity.participant.getType().should.equal('SampleParticipant');
                    newIdentity.participant.getIdentifier().should.equal('alice@email.com');
                });
        });

    });

    describe('#revokeIdentity', () => {

        let identity;

        beforeEach(() => {
            identity = factory.newResource('org.hyperledger.composer.system', 'Identity', 'e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
            identity.name = '';
            identity.issuer = '';
            identity.certificate = '';
            identity.state = 'ISSUED';
            identity.participant = factory.newRelationship('org.acme', 'SampleParticipant', 'alice@email.com');
            mockIdentityRegistry.get.withArgs('e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f').resolves(identity);
        });

        it('should throw if the identity has already been revoked', () => {
            identity.state = 'REVOKED';
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
            tx.identity = identity;
            mockIdentityRegistry.update.resolves();
            return identityManager.revokeIdentity(mockApi, tx)
                .should.be.rejectedWith(/The specified identity has already been revoked/);
        });

        it('should update the identity in the identity registry', () => {
            const tx = factory.newTransaction('org.hyperledger.composer.system', 'BindIdentity');
            tx.identity = identity;
            mockIdentityRegistry.update.resolves();
            return identityManager.revokeIdentity(mockApi, tx)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityRegistry.update);
                    const newIdentity = mockIdentityRegistry.update.args[0][0];
                    newIdentity.getIdentifier().should.equal('e38b9db5b7167f8033fb48f04efe5d5fd7ec36c8d7be51ed019f81e1ac66657f');
                    newIdentity.name.should.equal('');
                    newIdentity.issuer.should.equal('');
                    newIdentity.certificate.should.equal('');
                    newIdentity.state.should.equal('REVOKED');
                    newIdentity.participant.getNamespace().should.equal('org.acme');
                    newIdentity.participant.getType().should.equal('SampleParticipant');
                    newIdentity.participant.getIdentifier().should.equal('alice@email.com');
                });
        });

    });

});
