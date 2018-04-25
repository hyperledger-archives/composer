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

const AclRule = require('../../lib/acl/aclrule');
const AclFile = require('../../lib/acl/aclfile');
const ModelManager = require('../../lib/modelmanager');
const Operation = require('../../lib/acl/operation');

require('chai').should();
const sinon = require('sinon');

describe('Operation', () => {

    let operation;
    let aclRule;
    let aclFile;
    let modelManager;
    let sandbox;
    const ast = {
        verbs: ['ALL']
    };

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        modelManager = new ModelManager();
        aclFile.getModelManager.returns(modelManager);
        aclRule = sinon.createStubInstance(AclRule);
        aclRule.getAclFile.returns(aclFile);
        aclRule.getName.returns('TestRule');
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null AclRule provided', () => {
            (() => {
                operation = new Operation( null, {} );
            }).should.throw(/Invalid AclRule or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                operation = new Operation( aclRule, null );
            }).should.throw(/Invalid AclRule or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            operation = new Operation( aclRule, ast );
            operation.validate();
            operation.getVerbs().should.deep.equal(['ALL']);
            operation.getAclRule().should.equal(aclRule);
        });

        it('should detect duplicated operation verbs', () => {
            const duplicateVerbAst = {
                verbs: ['READ', 'UPDATE', 'READ']
            };

            (() => {
                operation = new Operation( aclRule, duplicateVerbAst );
                operation.validate();
            }).should.throw(/The verb \'READ\' has been specified more than once in the ACL rule \'TestRule\'/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            operation = new Operation( aclRule, ast );
            let visitor = {
                visit: sinon.stub()
            };
            operation.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, operation, ['some', 'args']);
        });

    });
});
