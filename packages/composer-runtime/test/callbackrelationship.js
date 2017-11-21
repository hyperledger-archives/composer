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

const CallbackRelationship = require('../lib/callbackrelationship');
const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Relationship = require('composer-common').Relationship;

require('chai').should();
const sinon = require('sinon');

describe('CallbackRelationship', () => {

    let modelManager;
    let classDecl;
    let factory;
    let relationship;
    let cb;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace org.acme.sample

        concept SampleConcept {
            o String value
        }

        participant SampleParticipant identified by participantId {
            o String participantId
            o String value
        }

        asset SampleAsset identified by assetId {
            o String assetId
            o String value
            o String[] values
            o SampleConcept concept
            o SampleConcept[] concepts
            --> SampleParticipant owner
            --> SampleParticipant[] owners
        }`);
        classDecl = modelManager.getType('org.acme.sample.SampleAsset');
        factory = new Factory(modelManager);
        cb = sinon.stub();
        relationship = new CallbackRelationship(new Relationship(modelManager, classDecl, 'org.acme.sample', 'SampleAsset', 'ASSET_1'), cb);
    });

    describe('#constructor', () => {

        it('should be a relationship', () => {
            relationship.should.be.an.instanceOf(Relationship);
        });

        it('should not call the callback when attempting to get the identifier', () => {
            relationship.getIdentifier().should.equal('ASSET_1');
            relationship.assetId.should.equal('ASSET_1');
            sinon.assert.notCalled(cb);
        });

        it('should not call the callback when attempting to set the identifier', () => {
            relationship.setIdentifier('ASSET_X');
            relationship.getIdentifier().should.equal('ASSET_X');
            relationship.assetId = 'ASSET_Y';
            relationship.getIdentifier().should.equal('ASSET_Y');
            sinon.assert.notCalled(cb);
        });

        it('should call the callback when attempting to get the primitive value', () => {
            cb.returns('hello');
            relationship.value === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'value');
            relationship.value.should.equal('hello');
        });

        it('should call the callback when attempting to set the primitive value', () => {
            cb.returns('hello');
            relationship.value = 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'value', 'hello');
            relationship.value.should.equal('hello');
        });

        it('should call the callback when attempting to get the primitive array value', () => {
            cb.returns([ 'hello', 'world' ]);
            relationship.values[1] === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'values');
            relationship.values.should.deep.equal([ 'hello', 'world' ]);
        });

        it('should call the callback when attempting to set the primitive array value', () => {
            cb.returns([ 'hello', 'world' ]);
            relationship.values[1] = 'world';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'values');
            relationship.values.should.deep.equal([ 'hello', 'world' ]);
        });

        it('should call the callback when attempting to get the concept value', () => {
            const concept = factory.newConcept('org.acme.sample', 'SampleConcept');
            cb.returns(concept);
            relationship.concept.value === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'concept');
            relationship.concept.should.equal(concept);
        });

        it('should call the callback when attempting to set the concept value', () => {
            const concept = factory.newConcept('org.acme.sample', 'SampleConcept');
            cb.returns(concept);
            relationship.concept.value = 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'concept');
            relationship.concept.should.equal(concept);
        });

        it('should call the callback when attempting to get the concept array value', () => {
            const concept1 = factory.newConcept('org.acme.sample', 'SampleConcept');
            const concept2 = factory.newConcept('org.acme.sample', 'SampleConcept');
            cb.returns([ concept1, concept2 ]);
            relationship.concepts[1].value === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'concepts');
            relationship.concepts.should.deep.equal([ concept1, concept2 ]);
        });

        it('should call the callback when attempting to set the concept array value', () => {
            const concept1 = factory.newConcept('org.acme.sample', 'SampleConcept');
            const concept2 = factory.newConcept('org.acme.sample', 'SampleConcept');
            cb.returns([ concept1, concept2 ]);
            relationship.concepts[1].value = 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'concepts');
            relationship.concepts.should.deep.equal([ concept1, concept2 ]);
        });

        it('should call the callback when attempting to get the relationship value', () => {
            const childRelationship = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            cb.returns(childRelationship);
            relationship.owner.value === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'owner');
            relationship.owner.should.deep.equal(childRelationship);
        });

        it('should call the callback when attempting to set the relationship value', () => {
            const childRelationship = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            cb.returns(childRelationship);
            relationship.owner.value = 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'owner');
            relationship.owner.should.deep.equal(childRelationship);
        });

        it('should call the callback when attempting to get the relationship array value', () => {
            const childRelationship1 = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            const childRelationship2 = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            cb.returns([ childRelationship1, childRelationship2 ]);
            relationship.owners[1].value === 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'owners');
            relationship.owners.should.deep.equal([ childRelationship1, childRelationship2 ]);
        });

        it('should call the callback when attempting to set the relationship array value', () => {
            const childRelationship1 = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            const childRelationship2 = factory.newRelationship('org.acme.sample', 'SampleParticipant');
            cb.returns([ childRelationship1, childRelationship2 ]);
            relationship.owners[1].value = 'hello';
            sinon.assert.calledOnce(cb);
            sinon.assert.calledWith(cb, 'owners');
            relationship.owners.should.deep.equal([ childRelationship1, childRelationship2 ]);
        });

    });

});
