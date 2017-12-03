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

const InvalidRelationship = require('../lib/invalidrelationship');
const ModelManager = require('composer-common').ModelManager;
const Relationship = require('composer-common').Relationship;

require('chai').should();

describe('InvalidRelationship', () => {

    let modelManager;
    let classDecl;
    let relationship;

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
        relationship = new InvalidRelationship(new Relationship(modelManager, classDecl, 'org.acme.sample', 'SampleAsset', 'ASSET_1'), new Error('such error'));
    });

    describe('#constructor', () => {

        it('should be a relationship', () => {
            relationship.should.be.an.instanceOf(Relationship);
        });

        it('should not throw attempting to get the identifier', () => {
            relationship.getIdentifier().should.equal('ASSET_1');
            relationship.assetId.should.equal('ASSET_1');
        });

        it('should not throw attempting to set the identifier', () => {
            relationship.setIdentifier('ASSET_X');
            relationship.getIdentifier().should.equal('ASSET_X');
            relationship.assetId = 'ASSET_Y';
            relationship.getIdentifier().should.equal('ASSET_Y');
        });

        it('should throw attempting to get the primitive value', () => {
            (() => {
                relationship.value === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the primitive value', () => {
            (() => {
                relationship.value = 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to get the primitive array value', () => {
            (() => {
                relationship.values[1] === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the primitive array value', () => {
            (() => {
                relationship.values[1] = 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to get the concept value', () => {
            (() => {
                relationship.concept.value === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the concept value', () => {
            (() => {
                relationship.concept.value = 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to get the concept array value', () => {
            (() => {
                relationship.concepts[1].value === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the concept array value', () => {
            (() => {
                relationship.concepts[1].value = 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to get the relationship value', () => {
            (() => {
                relationship.owner.value === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the relationship value', () => {
            (() => {
                relationship.owner.value = 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to get the relationship array value', () => {
            (() => {
                relationship.owners[1].value === 'hello';
            }).should.throw(/such error/);
        });

        it('should throw attempting to set the relationship array value', () => {
            (() => {
                relationship.owners[1].value = 'hello';
            }).should.throw(/such error/);
        });

    });

});
