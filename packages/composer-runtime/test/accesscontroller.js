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
const CompiledAclBundle = require('../lib/compiledaclbundle');
const Context = require('../lib/context');
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Resolver = require('../lib/resolver');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('AccessController', () => {

    let modelManager;
    let aclManager;
    let factory;
    let asset;
    let asset2;
    let participant;
    let participant2;
    let transaction;
    let transaction2;
    let controller;
    let mockCompiledAclBundle;
    let mockResolver;
    let mockContext;

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
        asset TestAsset2 extends TestAsset {

        }
        asset TestAsset3 identified by assetId extends BaseAsset {
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
        transaction TestTransaction extends BaseTransaction {
        }
        transaction TestTransaction2 extends TestTransaction {

        }
        transaction TestTransaction3 extends BaseTransaction {
        }`);
        modelManager.addModelFile(`
        namespace org.acme.test2
        import org.acme.base.BaseAsset
        import org.acme.base.BaseParticipant
        import org.acme.base.BaseTransaction
        asset TestAsset2 identified by assetId extends BaseAsset {
            o String assetId
        }
        participant TestParticipant2 identified by participantId extends BaseParticipant {
            o String participantId
        }
        transaction TestTransaction2 extends BaseTransaction {
        }`);
        aclManager = new AclManager(modelManager);
        factory = new Factory(modelManager);
        asset = factory.newResource('org.acme.test', 'TestAsset', 'A1234');
        asset2 = factory.newResource('org.acme.test', 'TestAsset2', 'A4321');
        participant = factory.newResource('org.acme.test', 'TestParticipant', 'P5678');
        participant2 = factory.newResource('org.acme.test', 'TestParticipant2', 'P7890');
        transaction = factory.newResource('org.acme.test', 'TestTransaction', 'T9012');
        transaction2 = factory.newResource('org.acme.test', 'TestTransaction2', 'T0123');
        mockCompiledAclBundle = sinon.createStubInstance(CompiledAclBundle);
        mockCompiledAclBundle.execute.returns(true);
        mockResolver = sinon.createStubInstance(Resolver);
        mockContext = sinon.createStubInstance(Context);
        mockContext.getAclManager.returns(aclManager);
        mockContext.getCompiledAclBundle.returns(mockCompiledAclBundle);
        mockContext.getResolver.returns(mockResolver);
        controller = new AccessController(mockContext);
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
            return controller.check(asset, 'READ');
        });

        it('should do nothing if there is no access control file', () => {
            return controller.check(asset, 'READ');
        });

        it('should throw if there are no access control rules', () => {
            // The language doesn't allow this, but just incase one day it does - we add
            // an ACL file, and then stub the ACL manager to pretend like no rules exist.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW }');
            sinon.stub(aclManager, 'getAclRules').returns([]);
            return controller.check(asset, 'READ')
                .should.be.rejectedWith(AccessException, /does not have/);
        });

        it('should not throw if there is one matching ALLOW access control rule', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.calledOnce(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should throw if there is one matching DENY access control rule', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}');
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .should.be.rejectedWith(AccessException, /does not have/)
                .then(() => {
                    sinon.assert.calledOnce(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should not throw if there is two non-matching ALLOW access control rules followed by one matching ALLOW access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should not throw if there is two non-matching DENY access control rules followed by one matching ALLOW access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should throw if there is two non-matching ALLOW access control rules followed by one matching DENY access control rule', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .should.be.rejectedWith(AccessException, /does not have/)
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should not throw if there is one matching ALLOW access control rule followed by two non-matching ALLOW access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should not throw if there is one matching ALLOW access control rule followed by two non-matching DENY access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: DENY}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should throw if there is one matching DENY access control rule followed by two non-matching ALLOW access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .should.be.rejectedWith(AccessException, /does not have/)
                .then(() => {
                    sinon.assert.calledThrice(matchRuleSpy);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

        it('should not throw if there are two matching ALLOW access control rule followed by two non-matching ALLOW access control rules', () => {
            setAclFile(
                'rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R2 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: ALL resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R3 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: CREATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n' +
                'rule R4 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: UPDATE resource: "org.acme.test.TestAsset#A1234" action: ALLOW}\n'
            );
            let matchRuleSpy = sinon.spy(controller, 'matchRule');
            let checkRuleSpy = sinon.spy(controller, 'checkRule');
            return controller.check(asset, 'READ')
                .then(() => {
                    sinon.assert.callCount(matchRuleSpy, 4);
                    sinon.assert.calledOnce(checkRuleSpy);
                });
        });

    });

    describe('#matchRule', () => {

        it('should return false if the noun is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A5678" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchNoun');
            controller.matchRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]).should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the verb is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchVerb');
            controller.matchRule(asset, 'CREATE', participant, transaction, aclManager.getAclRules()[0]).should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the participant is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P1234" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchParticipant');
            controller.matchRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]).should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return false if the transaction is not matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction3" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchTransaction');
            controller.matchRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]).should.be.false;
            sinon.assert.calledOnce(spy);
        });

        it('should return true if everything is matched', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            let spy = sinon.spy(controller, 'matchNoun');
            controller.matchRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0]).should.be.true;
            sinon.assert.calledOnce(spy);
        });

    });

    describe('#checkRule', () => {

        it('should return false if the predicate is not matched', () => {
            mockCompiledAclBundle.execute.returns(false);
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (false) action: ALLOW}');
            let spy = sinon.spy(controller, 'matchPredicate');
            return controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.eventually.be.false
                .then(() => {
                    sinon.assert.calledOnce(spy);
                });
        });

        it('should return true if the rule matches and ALLOW is specified', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (true) action: ALLOW}');
            return controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.eventually.be.true;
        });

        it('should throw if the rule matches and DENY is specified', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" action: DENY}');
            return controller.checkRule(asset, 'READ', participant, transaction, aclManager.getAclRules()[0])
                .should.be.rejectedWith(AccessException, /does not have/);
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
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.*" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.**" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching root recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "**" action: ALLOW}');
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
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test2.*" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test2.**" action: ALLOW}');
            controller.matchNoun(asset, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return true if the ACL rule specifies a fully qualified name of a nested supertype', () => {
            // Test with TestAsset2 which extends TestAsset which extends BaseAsset.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.base.BaseAsset" action: ALLOW}');
            controller.matchNoun(asset2, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a fully qualified name of a subtype', () => {
            // Test with TestAsset which is extended by TestAsset3.
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset3" action: ALLOW}');
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
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.*" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.**" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching root recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "**" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
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
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test2.*" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
            controller.matchParticipant(participant, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test2.**" operation: READ resource: "org.acme.test.TestAsset#A1234" action: ALLOW}');
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
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.*" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.**" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return true if the ACL rule specifies a matching root recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "**" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.true;
        });

        it('should return false if the ACL rule specifies a non-matching fully qualified name', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test.TestTransaction2" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test2.*" action: ALLOW}');
            controller.matchTransaction(transaction, aclManager.getAclRules()[0])
                .should.be.false;
        });

        it('should return false if the ACL rule specifies a non-matching recursive namespace', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" transaction: "org.acme.test2.**" action: ALLOW}');
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

        it('should call the compiled ACL bundle with an asset, participant, and transaction', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (resource.id == A1234) action: ALLOW}');
            mockResolver.prepare.withArgs(asset).resolves(asset2);
            mockResolver.prepare.withArgs(participant).resolves(participant2);
            mockResolver.prepare.withArgs(transaction).resolves(transaction2);
            return controller.matchPredicate(asset, participant, transaction, aclManager.getAclRules()[0])
                .should.eventually.be.true
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledAclBundle.execute);
                    sinon.assert.calledWith(mockCompiledAclBundle.execute, aclManager.getAclRules()[0], asset2, participant2, transaction2);
                });
        });

        it('should call the compiled ACL bundle with an asset and participant', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (resource.id == A1234) action: ALLOW}');
            mockResolver.prepare.withArgs(asset).resolves(asset2);
            mockResolver.prepare.withArgs(participant).resolves(participant2);
            return controller.matchPredicate(asset, participant, undefined, aclManager.getAclRules()[0])
                .should.eventually.be.true
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledAclBundle.execute);
                    sinon.assert.calledWith(mockCompiledAclBundle.execute, aclManager.getAclRules()[0], asset2, participant2, undefined);
                });
        });

        it('should call the compiled ACL bundle and lazily resolve relationships as they are accessed', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "ANY" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (resource.id == A1234) action: ALLOW}');
            mockResolver.prepare.withArgs(asset).resolves(asset2);
            mockResolver.prepare.withArgs(participant).resolves(participant2);
            mockResolver.prepare.withArgs(transaction).resolves(transaction2);
            const originalExecute = mockCompiledAclBundle.execute;
            let iterations = 3;
            mockCompiledAclBundle.execute = (aclRule, asset, participant, transaction) => {
                if (iterations) {
                    iterations--;
                    mockResolver.prepare.args[iterations][1](Promise.resolve());
                }
                return originalExecute(aclRule, asset, participant, transaction);
            };
            return controller.matchPredicate(asset, participant, transaction, aclManager.getAclRules()[0])
                .should.eventually.be.true
                .then(() => {
                    mockCompiledAclBundle.execute = originalExecute;
                    sinon.assert.callCount(mockCompiledAclBundle.execute, 4);
                    sinon.assert.calledWith(mockCompiledAclBundle.execute, aclManager.getAclRules()[0], asset2, participant2, transaction2);
                });
        });

        it('should not fully evaluate the predicate if the predicate expression is "true" ', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (true) action: ALLOW}');
            return controller.matchPredicate(asset, participant, transaction, aclManager.getAclRules()[0])
            .should.eventually.be.true
            .then(() => {
                sinon.assert.notCalled(mockCompiledAclBundle.execute);
            });
        });

        it('should not fully evaluate the predicate if the predicate expression is "false" ', () => {
            setAclFile('rule R1 {description: "Test R1" participant: "org.acme.test.TestParticipant#P5678" operation: READ resource: "org.acme.test.TestAsset#A1234" condition: (false) action: ALLOW}');
            return controller.matchPredicate(asset, participant, transaction, aclManager.getAclRules()[0])
            .should.eventually.be.false
            .then(() => {
                sinon.assert.notCalled(mockCompiledAclBundle.execute);
            });
        });

    });

});
