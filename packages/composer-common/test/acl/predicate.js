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
const Predicate = require('../../lib/acl/predicate');

require('chai').should();
const sinon = require('sinon');

describe('Predicate', () => {

    let predicate;
    let aclRule;
    let aclFile;
    let mockModelManager;
    let sandbox;
    const ast = '(true)';

    beforeEach(() => {
        aclFile = sinon.createStubInstance(AclFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        aclFile.getModelManager.returns(mockModelManager);
        aclRule = sinon.createStubInstance(AclRule);
        aclRule.getAclFile.returns(aclFile);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null AclRule provided', () => {
            (() => {
                predicate = new Predicate( null, {} );
            }).should.throw(/Invalid AclRule or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                predicate = new Predicate( aclRule, null );
            }).should.throw(/Invalid AclRule or AST/);
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            predicate = new Predicate( aclRule, ast );
            predicate.validate();
            predicate.getExpression().should.equal('(true)');
            predicate.getAclRule().should.equal(aclRule);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            predicate = new Predicate( aclRule, ast );
            let visitor = {
                visit: sinon.stub()
            };
            predicate.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, predicate, ['some', 'args']);
        });

    });
});
