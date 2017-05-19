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

const AccessController = require('../lib/accesscontroller');
const AccessException = require('../lib/accessexception');
const AclFile = require('composer-common').AclFile;
const AclManager = require('composer-common').AclManager;
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;

require('chai').should();
const sinon = require('sinon');

describe('AccessController', () => {

    let modelManager;
    let aclManager;
    let factory;
    let asset;
    let participant;
    let participant2;
    let transaction;
    let transaction2;
    let controller;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.base
        abstract asset BaseAsset {
            o String theValue
        }
        abstract participant BaseParticipant {
            o String theValue
        }
        abstract transaction BaseTransaction {
            o String theValue
        }`);
        modelManager.addModelFile(`
        namespace org.acme.test
        import org.acme.base.BaseAsset
        import org.acme.base.BaseParticipant
        import org.acme.base.BaseTransaction
        asset TestAsset identified by assetId extends BaseAsset {
            o String assetId
        }
        asset TestAsset2 identified by assetId extends BaseAsset {
            o String assetId
        }
        participant TestParticipant identified by participantId extends BaseParticipant {
            o String participantId
        }
        participant TestParticipant2 extends TestParticipant {

        }
        participant TestParticipant3 identified by participantId extends BaseParticipant {
            o String participantId
        }
        transaction TestTransaction identified by transactionId extends BaseTransaction {
            o String transactionId
        }
        transaction TestTransaction2 extends TestTransaction {

        }
        transaction TestTransaction3 identified by transactionId extends BaseTransaction {
            o String transactionId
        }`);
        modelManager.addModelFile(`
        namespace org.acme.test2
        import org.acme.base.BaseAsset
        import org.acme.base.BaseParticipant
        asset TestAsset2 identified by assetId extends BaseAsset {
            o String assetId
        }
        participant TestParticipant2 identified by participantId extends BaseParticipant {
            o String participantId
        }
        transaction TestTransaction2 identified by transactionId extends BaseParticipant {
            o String transactionId
        }`);
        aclManager = new AclManager(modelManager);
        factory = new Factory(modelManager);
        asset = factory.newResource('org.acme.test', 'TestAsset', 'A1234');
        participant = factory.newResource('org.acme.test', 'TestParticipant', 'P5678');
        participant2 = factory.newResource('org.acme.test', 'TestParticipant2', 'P7890');
        transaction = factory.newResource('org.acme.test', 'TestTransaction', 'T9012');
        transaction2 = factory.newResource('org.acme.test', 'TestTransaction2', 'T0123');
        controller = new AccessController(aclManager);
        controller.setParticipant(participant);
        controller.setTransaction(transaction);
    });

    let setAclFile = (contents) => {
        let aclFile = new AclFile('test.acl', modelManager, contents);
        aclManager.setAclFile(aclFile);
    };

    describe('#getParticipant', () => {

        it('should return the current participant', () => {
            controller.getParticipant().should.equal(participant);
        });

    });

    describe('#setParticipant', () => {

        it('should set the current participant', () => {
            controller.participant = null;
            controller.setParticipant(participant);
            controller.participant.should.equal(participant);
        });

    });

    describe('#getTransaction', () => {

        it('should return the current transaction', () => {
            controller.getTransaction().should.equal(transaction);
        });

    });

    describe('#setTransaction', () => {

        it('should set the current transaction', () => {
            controller.transaction = null;
            controller.setTransaction(transaction);
            controller.transaction.should.equal(transaction);
        });

    });

    describe('#check', () => {

        it('should do nothing if there is no participant', () => {
            controller.setParticipant(null);
            controller.check(asset, 'READ');
        });

        it('should do nothing if there is no access control file', () => {
            controller.check(asset, 'READ');
        });

        it('should throw if there are no access control rules', () => {
            // The language doesn't allow this, but just incase one day it does - we add
            // an ACL file, and then stub the ACL manager to pretend like no rules exist.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW }');
            sinon.stub(aclManager, 'getAclRules').returns([]);
            (() => {
                controller.check(asset, 'READ');
            }).should.throw(AccessException, /does not have/);
        });

        it('should not throw if there is one matching ALLOW access control rule', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'checkRule');
            controller.check(asset, 'READ');
            sinon.assert.calledOnce(spy);
        });

        it('should throw if there is one matching DENY access control rule', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}');
            let spy = sinon.spy(controller, 'checkRule');
            (() => {
                controller.check(asset, 'READ');
            }).should.throw(AccessException, /does not have/);
            sinon.assert.calledOnce(spy);
        });

        it('should not throw if there is two non-matching ALLOW access control rules followed by one matching ALLOW access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            controller.check(asset, 'READ');
            sinon.assert.calledThrice(spy);
        });

        it('should not throw if there is two non-matching DENY access control rules followed by one matching ALLOW access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: DENY}' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            controller.check(asset, 'READ');
            sinon.assert.calledThrice(spy);
        });

        it('should throw if there is two non-matching ALLOW access control rules followed by one matching DENY access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            (() => {
                controller.check(asset, 'READ');
            }).should.throw(AccessException, /does not have/);
            sinon.assert.calledThrice(spy);
        });

        it('should not throw if there is one matching ALLOW access control rule followed by two non-matching ALLOW access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            controller.check(asset, 'READ');
            sinon.assert.calledOnce(spy);
        });

        it('should not throw if there is one matching ALLOW access control rule followed by two non-matching DENY access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            controller.check(asset, 'READ');
            sinon.assert.calledOnce(spy);
        });

        it('should throw if there is one matching DENY access control rule followed by two non-matching ALLOW access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let spy = sinon.spy(controller, 'checkRule');
            (() => {
                controller.check(asset, 'READ');
            }).should.throw(AccessException, /does not have/);
            sinon.assert.calledOnce(spy);
        });

    });

    describe('#checkRule', () => {

        it('should return false if the noun is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A5678" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchNoun');
            controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the verb is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchVerb');
            controller.checkRule(asset, 'CREATE', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the participant is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P1234" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchParticipant');
            controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the transaction is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction3" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchTransaction');
            controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the predicate is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (false) action: ALLOW}');
            let spy = sinon.spy(controller, 'matchPredicate');
            controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return true if the rule matches and ALLOW is specified', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (true) action: ALLOW}');
            controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should throw if the rule matches and DENY is specified', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}');
            (() => {
                controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]);
            }).should.throw(AccessException, /does not have/);
        });

    });

    describe('#matchNoun', () => {

        it('should return true if the ACL rule specifies a matching fully qualified identifier', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified identifier', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A5678" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset2" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test2" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.false;
        });

    });

    describe('#matchVerb', () => {

        ['CREATE', 'READ', 'UPDATE', 'DELETE'].forEach((verb) => {

            it(`should return true for ${verb} if the ACL rule specifies ALL`, () => {
                setAclFile(`rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: ${verb} resource: "org.acme.test.TestAsset#A1234" action: ALLOW}`);
                controller.matchVerb(verb, aclManager.getAclRules()[0])
                    .should.be.true;
            });

            it(`should return true for ${verb} if the ACL rule specifies ${verb}`, () => {
                setAclFile(`rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: ${verb} resource: "org.acme.test.TestAsset#A1234" action: ALLOW}`);
                controller.matchVerb(verb, aclManager.getAclRules()[0])
                    .should.be.true;
            });

            it(`should return false for ${verb} if the ACL rule specifies something else`, () => {
                setAclFile(`rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: ${verb === 'READ' ? 'CREATE' : 'READ'} resource: "org.acme.test.TestAsset#A1234" action: ALLOW}`);
                controller.matchVerb(verb, aclManager.getAclRules()[0])
                    .should.be.false;
            });

            it(`should return true for ${verb} if the ACL rule specifies a list of verbs`, () => {
                setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE, READ, UPDATE, DELETE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
                controller.matchVerb(verb, aclManager.getAclRules()[0])
                    .should.be.true;
            });

        });

    });

    describe('#matchParticipant', () => {

        it('should return true if the ACL rule specifies ANY participant', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');

            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching fully qualified identifier', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified identifier', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P1234" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant2" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test2" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a fully qualified name of a supertype', () => {
            // Test with TestParticipant which extends BaseParticipant.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.base.BaseParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a fully qualified name of a nested supertype', () => {
            // Test with TestParticipant2 which extends TestParticipant which extends BaseParticipant.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.base.BaseParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant2, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a fully qualified name of a subtype', () => {
            // Test with TestParticipant which is extended by TestParticipant3.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant3" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.false;
        });

    });

    describe('#matchTransaction', () => {

        it('should return true if the ACL rule does not specify a transaction', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');

            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a transaction but no transaction is specified', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction" action: ALLOW}');
            controller.matchTransaction(null, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction2" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test2" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a fully qualified name of a supertype', () => {
            // Test with TestTransaction which extends BaseTransaction.
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.base.BaseTransaction" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a fully qualified name of a nested supertype', () => {
            // Test with TestTransaction2 which extends TestTransaction which extends BaseTransaction.
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.base.BaseTransaction" action: ALLOW}');
            controller.matchTransaction(transaction2, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a fully qualified name of a subtype', () => {
            // Test with TestTransaction which is extended by TestTransaction3.
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction3" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

    });

    describe('#matchPredicate', () => {

        it('should return true if the ACL rule specifies a predicate of (true)', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate of (false)', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (false) action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction" condition: ((3 + 6) / 3 === 3) action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction" condition: ((3 + 3) / 3 === 3) action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that accesses the bound resource and returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" condition: (asset.getFullyQualifiedIdentifier() === \'org.acme.test.TestAsset#A1234\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that accesses the bound resource and returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" condition: (asset.getFullyQualifiedIdentifier() !== \'org.acme.test.TestAsset#A1234\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that accesses the bound participant and returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (participant.getFullyQualifiedIdentifier() === \'org.acme.test.TestParticipant#P5678\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that accesses the bound participant and returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (participant.getFullyQualifiedIdentifier() !== \'org.acme.test.TestParticipant#P5678\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that accesses the bound transaction and returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction(tx): "org.acme.test.TestTransaction" condition: (tx.getFullyQualifiedIdentifier() === \'org.acme.test.TestTransaction#T9012\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that accesses the bound transaction and returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction(tx): "org.acme.test.TestTransaction" condition: (tx.getFullyQualifiedIdentifier() !== \'org.acme.test.TestTransaction#T9012\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that accesses the bound resource and participant and returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" condition: (asset.getFullyQualifiedIdentifier() !== participant.getFullyQualifiedIdentifier()) action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that accesses the bound resource and participant and returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" condition: (asset.getFullyQualifiedIdentifier() === participant.getFullyQualifiedIdentifier()) action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a predicate that accesses the bound resource, participant, and transaction and returns a truthy expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" transaction(tx): "org.acme.test.TestTransaction" condition: ((asset.getFullyQualifiedIdentifier() !== participant.getFullyQualifiedIdentifier()) && tx.getFullyQualifiedIdentifier() === \'org.acme.test.TestTransaction#T9012\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a predicate that accesses the bound resource, participant, and transaction and returns a falsey expression', () => {
            setAclFile('rule R1 {description: "Test R1" participant(participant): "org.acme.test.TestParticipant" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" transaction(tx): "org.acme.test.TestTransaction" condition: ((asset.getFullyQualifiedIdentifier() === participant.getFullyQualifiedIdentifier()) && tx.getFullyQualifiedIdentifier() !== \'org.acme.test.TestTransaction#T9012\') action: ALLOW}');
            controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should throw if the ACL rule specifies a predicate that is faulty and causes an exception to be thrown', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource(asset): "org.acme.test.TestAsset#A1234" condition: (asset.not.a.real.property = {}) action: ALLOW}');
            (() => {
                controller.matchPredicate(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]);
            }).should.throw(AccessException, /does not have/);
        });

    });

});
