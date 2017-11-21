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

const ModelManager = require('../../lib/modelmanager');
const Resource = require('../../lib/model/resource');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('Resource', function () {

    const levelOneModel = `namespace org.acme.l1
  participant Person identified by ssn {
    o String ssn
  }
  asset Car identified by vin {
    o String vin
    -->Person owner
  }
  `;

    let modelManager = null;
    let classDecl = null;

    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
        modelManager.addModelFile(levelOneModel);
        classDecl = modelManager.getType('org.acme.l1.Person');
    });

    afterEach(function () {
        modelManager.clearModelFiles();
    });

    describe('#getClassDeclaration', function() {
        it('should return the class declaraction', function () {
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Person', '123' );
            resource.getClassDeclaration().should.equal(classDecl);
        });
    });

    describe('#toJSON', () => {
        it('should throw is toJSON is called', function () {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            (function () {
                resource.toJSON();
            }).should.throw(/Use Serializer.toJSON to convert resource instances to JSON objects./);
        });
    });

    describe('#isRelationship', () => {
        it('should be false', () => {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            resource.isRelationship().should.be.false;
        });
    });

    describe('#isResource', () => {
        it('should be true', () => {
            const resource = new Resource(modelManager, 'org.acme.l1', 'Person', '123' );
            resource.isResource().should.be.true;
        });
    });
});
