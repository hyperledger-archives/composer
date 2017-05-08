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

const Factory = require('../../lib/factory');
const fs = require('fs');
const ModelManager = require('../../lib/modelmanager');
const Serializer = require('../../lib/serializer');

require('chai').should();

describe('Wildcards Model', function () {

    let factory;
    let modelManager;
    let serializer;

    beforeEach(() => {
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        const files = [
            './test/data/model/dependencies/base/base.cto',
            './test/data/model/wildcards.cto'
        ];

        const models = [];

        for(let n=0; n < files.length; n++) {
            models.push(fs.readFileSync(files[n], 'utf8'));
        }

        modelManager.addModelFiles(models, files);
    });

    it('should parse a resource using types from a wildcard import', () => {
        const json = {
            $class: 'org.acme.wildcards.MyAsset',
            assetId: '1',
            concept: {
                $class: 'org.acme.wildcards.MyConcept',
                gender: 'FEMALE'
            },
            participant: {
                $class: 'org.acme.wildcards.MyParticipant',
                participantId: '1',
                firstName: 'Alice',
                lastName: 'A',
                contactDetails: {
                    $class: 'stdlib.base.ContactDetails',
                    email: 'alice@email.com'
                }
            },
            person: 'resource:stdlib.base.Person#ALICE_1'
        };
        const resource = serializer.fromJSON(json);
        resource.assetId.should.equal('1');
        resource.concept.gender.should.equal('FEMALE');
        resource.participant.participantId.should.equal('1');
        resource.participant.firstName.should.equal('Alice');
        resource.participant.lastName.should.equal('A');
        resource.participant.contactDetails.email.should.equal('alice@email.com');
        resource.person.getFullyQualifiedIdentifier().should.equal('stdlib.base.Person#ALICE_1');
    });

    it('should serialize a resource using types from a wildcard import', () => {
        const resource = factory.newResource('org.acme.wildcards', 'MyAsset', '1');
        resource.assetId = '1';
        resource.concept = factory.newConcept('org.acme.wildcards', 'MyConcept');
        resource.concept.gender = 'FEMALE';
        resource.participant = factory.newResource('org.acme.wildcards', 'MyParticipant', '1');
        resource.participant.firstName = 'Alice';
        resource.participant.lastName = 'A';
        resource.participant.contactDetails = factory.newConcept('stdlib.base', 'ContactDetails');
        resource.participant.contactDetails.email = 'alice@email.com';
        resource.person = factory.newRelationship('stdlib.base', 'Person', 'ALICE_1');
        const json = serializer.toJSON(resource);
        json.should.deep.equal({
            $class: 'org.acme.wildcards.MyAsset',
            assetId: '1',
            concept: {
                $class: 'org.acme.wildcards.MyConcept',
                gender: 'FEMALE'
            },
            participant: {
                $class: 'org.acme.wildcards.MyParticipant',
                participantId: '1',
                firstName: 'Alice',
                lastName: 'A',
                contactDetails: {
                    $class: 'stdlib.base.ContactDetails',
                    email: 'alice@email.com'
                }
            },
            person: 'resource:stdlib.base.Person#ALICE_1'
        });
    });

});
