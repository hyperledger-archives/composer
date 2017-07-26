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
const Relationship = require('../../lib/model/relationship');
const sinon = require('sinon');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('Relationship', function () {

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

    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
        modelManager.addModelFile(levelOneModel);
    });

    afterEach(function () {
        modelManager.clearModelFiles();
    });

    describe('#getClassDeclaration', function() {
        it('should throw with no ModelFile', function () {
            const relationship = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            const stub = sinon.stub(modelManager, 'getModelFile', function(){return null;});
            (function () {
                relationship.getClassDeclaration();
            }).should.throw(/No model for namespace org.acme.l1 is registered with the ModelManager/);
            stub.restore();
        });
        it('should throw with no type', function () {
            const relationship = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            const modelFile = modelManager.getModelFile('org.acme.l1');
            const stub = sinon.stub(modelFile, 'getType', function(type){return null;});
            (function () {
                relationship.getClassDeclaration();
            }).should.throw(/The namespace org.acme.l1 does not contain the type Person/);
            stub.restore();
        });
    });

    describe('#toJSON', () => {
        it('should throw is toJSON is called', function () {
            const relationship = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            (function () {
                relationship.toJSON();
            }).should.throw(/Use Serializer.toJSON to convert resource instances to JSON objects./);
        });
    });

    describe('#isRelationship', () => {
        it('should be true', () => {
            const relationship = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            relationship.isRelationship().should.be.true;
        });
    });

    describe('#isResource', () => {
        it('should be false', () => {
            const relationship = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            relationship.isResource().should.be.false;
        });
    });

    describe('#uri serialization', function() {
        it('check that relationships can be serialized to URI', function() {
            const rel = new Relationship(modelManager, 'org.acme.l1', 'Person', '123' );
            rel.toURI().should.equal('resource:org.acme.l1.Person#123');
        });

        it('check that unicode relationships can be serialized to URI', function() {
            let Omega = '\u03A9';
            const rel = new Relationship(modelManager, 'org.acme.l1', 'Person', Omega );
            rel.toURI().should.equal('resource:org.acme.l1.Person#%CE%A9');
        });

        it('check that relationships can be created from a URI', function() {
            const rel = Relationship.fromURI(modelManager, 'resource:org.acme.l1.Person#123' );
            rel.getNamespace().should.equal('org.acme.l1');
            rel.getType().should.equal('Person');
            rel.getIdentifier().should.equal('123');
        });

        it('check that relationships can be created from a unicode URI', function() {
            const rel = Relationship.fromURI(modelManager, 'resource:org.acme.l1.Person#%CE%A9' );
            rel.getNamespace().should.equal('org.acme.l1');
            rel.getType().should.equal('Person');
            let Omega = '\u03A9';
            rel.getIdentifier().should.equal(Omega);
        });

        it('check that relationships can be created from a legacy fully qualified identifier', function() {
            const rel = Relationship.fromURI(modelManager, 'org.acme.l1.Person#123' );
            rel.getNamespace().should.equal('org.acme.l1');
            rel.getType().should.equal('Person');
            rel.getIdentifier().should.equal('123');
        });

        it('check that relationships can be created from a legacy identifier', function() {
            const rel = Relationship.fromURI(modelManager, '123', 'org.acme.l1', 'Person' );
            rel.getNamespace().should.equal('org.acme.l1');
            rel.getType().should.equal('Person');
            rel.getIdentifier().should.equal('123');
        });

        it('check invalid name space gets error', function() {
            (function () {
                Relationship.fromURI(modelManager, '123', 'org.acme.empty', 'Person' );
            }).should.throw(/Cannot create relationship as namespace org.acme.empty is not known/);
        });

        it('check that relationships can be created from a URI', function() {
            (function () {
                Relationship.fromURI(modelManager, 'resource:org.acme.l1.Unkown#123' );
            }).should.throw(/Cannot instantiate Type Unkown in namespace org.acme.l1/);
        });

    });
});
