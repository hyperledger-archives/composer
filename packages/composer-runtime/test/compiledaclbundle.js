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

const AclManager = require('composer-common').AclManager;
const CompiledAclBundle = require('../lib/compiledaclbundle');
const ModelManager = require('composer-common').ModelManager;
const Resource = require('composer-common').Resource;

require('chai').should();
const sinon = require('sinon');


describe('CompiledAclBundle', () => {

    let modelManager;
    let aclManager;
    let aclRules;
    let missingAclRule;
    let mockGeneratorFunction;
    let bundle;
    let compiledScriptBundle;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme
        asset TestAsset identified by assetId {
            o String assetId
        }
        participant TestParticipant identified by participantId {
            o String participantId
        }
        transaction TestTransaction {
        }
        transaction TestTransaction2 {
        }
        transaction TestTransaction3 {
        }
        transaction TestTransaction4 {
        }`);
        aclManager = new AclManager(modelManager);
        aclManager.setAclFile(aclManager.createAclFile('permissions.acl', `
        rule R1 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (true)
            action: ALLOW
        }
        rule R2 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R3 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource(THERES): "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R4 {
            description: "test acl rule"
            participant: "ANY"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R5 {
            description: "test acl rule"
            participant(THEPART): "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            condition: (doIt())
            action: ALLOW
        }
        rule R6 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction: "org.acme.TestTransaction"
            condition: (doIt())
            action: ALLOW
        }
        rule R7 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction(THETX): "org.acme.TestTransaction"
            condition: (doIt())
            action: ALLOW
        }
        rule R8 {
            description: "test acl rule"
            participant(p): "org.acme.TestParticipant"
            operation: ALL
            resource(r): "org.acme.TestAsset"
            transaction(t): "org.acme.TestTransaction"
            condition: (testItAll(p, r, t))
            action: ALLOW
        }
        rule R9 {
            description: "test acl rule"
            participant: "org.acme.TestParticipant"
            operation: ALL
            resource: "org.acme.TestAsset"
            transaction: "org.acme.TestTransaction"
            condition: (testItAll(__participant, __resource, __transaction))
            action: ALLOW
        }
        `));
        aclRules = aclManager.getAclRules();
        missingAclRule = aclRules.pop();
        bundle = {
            R1: sinon.stub().returns(true),
            R2: sinon.stub().throws(new Error('such error'))
        };
        mockGeneratorFunction = sinon.stub().returns(bundle);
        compiledScriptBundle = new CompiledAclBundle(aclRules, mockGeneratorFunction);
    });

    describe('#execute', () => {

        let mockParticipant, mockAsset, mockTransaction;

        beforeEach(() => {
            mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.participantId = 'P1';
            mockAsset = sinon.createStubInstance(Resource);
            mockAsset.assetId = 'A1';
            mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.transactionId = 'T1';
        });

        it('should throw if no functions could be found', () => {
            (() => {
                compiledScriptBundle.execute(missingAclRule, mockAsset, mockParticipant, mockTransaction);
            }).should.throw(/The ACL rule .* does not exist/);
        });

        it('should call a function', () => {
            const result = compiledScriptBundle.execute(aclRules[0], mockAsset, mockParticipant, mockTransaction);
            result.should.be.true;
            sinon.assert.calledOnce(mockGeneratorFunction);
            sinon.assert.calledWith(mockGeneratorFunction);
            sinon.assert.calledOnce(bundle.R1);
            sinon.assert.calledWith(bundle.R1, mockAsset, mockParticipant, mockTransaction);
        });

        it('should handle a function throwing an error', () => {
            const result = compiledScriptBundle.execute(aclRules[1], mockAsset, mockParticipant, mockTransaction);
            result.should.be.false;
            sinon.assert.calledOnce(mockGeneratorFunction);
            sinon.assert.calledWith(mockGeneratorFunction);
            sinon.assert.calledOnce(bundle.R2);
            sinon.assert.calledWith(bundle.R2, mockAsset, mockParticipant, mockTransaction);
        });

    });

});
