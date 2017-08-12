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

const AclFile = require('../lib/acl/aclfile');
const AclManager = require('../lib/aclmanager');
const fs = require('fs');
const ModelManager = require('../lib/modelmanager');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('AclManager', () => {

    const testAcl = fs.readFileSync(path.resolve(__dirname, 'data/acl', 'test.acl'), 'utf8');

    let modelManager;
    let aclFile;
    let sandbox;
    let dummyRules = ['test'];

    beforeEach(() => {
        modelManager = new ModelManager();
        aclFile = sinon.createStubInstance(AclFile);
        aclFile.getAclRules.returns(dummyRules);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let am = new AclManager(modelManager);
            let visitor = {
                visit: sinon.stub()
            };
            am.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, am, ['some', 'args']);
        });

    });

    describe('#createAclFile', () => {

        it('should create a new ACL file', () => {
            let am = new AclManager(modelManager);
            let acl = am.createAclFile('permissions.acl', testAcl);
            acl.should.be.an.instanceOf(AclFile);
        });

    });

    describe('#aclFile', () => {

        it('should set & get the acl file', () => {
            let am = new AclManager(modelManager);
            am.getAclRules().length.should.equal(0);
            am.setAclFile(aclFile);
            am.getAclFile().should.equal(aclFile);
            am.getAclRules().should.equal(dummyRules);
        });
    });

});
