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

const Factory = require('../lib/factory');
const ModelManager = require('../lib/modelmanager');
const Relationship = require('../lib/model/relationship');
const Resource = require('../lib/model/resource');
const Concept = require('../lib/model/concept');
const Serializer = require('../lib/serializer');
const TypeNotFoundException = require('../lib/typenotfoundexception');

const should = require('chai').should();
const sinon = require('sinon');

describe('Serializer', () => {

    let sandbox;
    let factory;
    let modelManager;
    let serializer;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.sample

        asset SampleAsset identified by assetId {
        o String assetId
        --> SampleParticipant owner
        o String stringValue
        }

        participant SampleParticipant identified by participantId {
        o String participantId
        o String firstName
        o String lastName
        o ConceptArray[] conceptArray optional
        o DateTime theDate optional
        }

        transaction SampleTransaction {
        --> SampleAsset asset
        o String newValue
        }

        concept Address {
            o String city
            o String country
        }

        event SampleEvent{
        --> SampleAsset asset
        o String newValue
        }

        enum SampleEnum {
            o EMPEROR
            o KING
            o CHINSTRAP
            o GENTOO
          }

        concept ConceptArray {
            o NestedConcept nestedConcept
        }

        concept NestedConcept {
            o String value
        }

        `);
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw if factory not specified', () => {
            (() => {
                new Serializer(null, modelManager);
            }).should.throw(/Factory cannot be null/);
        });

        it('should throw if modelManager not specified', () => {
            (() => {
                new Serializer(factory, null);
            }).should.throw(/ModelManager cannot be null/);
        });

    });

    describe('#toJSON', () => {

        it('should throw if resource not a Resource', () => {
            (() => {
                serializer.toJSON([{}]);
            }).should.throw(/only accepts/);
        });

        it('should throw if the class declaration cannot be found', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getFullyQualifiedType.returns('org.acme.sample.NoSuchAsset');
            (() => {
                serializer.toJSON(mockResource);
            }).should.throw(TypeNotFoundException, /NoSuchAsset/);
        });

        it('should generate a JSON object and validate if the validate flag is set to true', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = 'the value';
            let json = serializer.toJSON(resource, {
                validate: true
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: 'the value'
            });
        });

        it('should throw validation errors during JSON object generation if the validate flag is not specified and errors are present', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            (() => {
                serializer.toJSON(resource);
            }).should.throw(/missing required field/);
        });

        it('should throw validation errors during JSON object generation if the validate flag is set to true and errors are present', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            (() => {
                serializer.toJSON(resource, {
                    validate: true
                });
            }).should.throw(/missing required field/);
        });

        it('should generate a JSON object if errors are present but the validate flag is set to false', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            let json = serializer.toJSON(resource, {
                validate: false
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1'
            });
        });

        it('should not validate during JSON object generation if the default options specifies the validate flag set to false', () => {
            serializer.setDefaultOptions({ validate: false });
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            let json = serializer.toJSON(resource);
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1'
            });
        });

        it('should validate during JSON object generation if the default options specifies the validate flag set to false but the input options specify true', () => {
            serializer.setDefaultOptions({ validate: false });
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            (() => {
                serializer.toJSON(resource, {
                    validate: true
                });
            }).should.throw(/missing required field/);
        });

        it('should generate a concept', () => {
            let address = factory.newConcept('org.acme.sample', 'Address');
            address.city = 'Winchester';
            address.country = 'UK';
            const json = serializer.toJSON(address);
            json.should.deep.equal({
                $class: 'org.acme.sample.Address',
                country: 'UK',
                city: 'Winchester'
            });
        });

        it('should generate a field if an empty string is specififed', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            let json = serializer.toJSON(resource, {
                validate: true
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: ''
            });
        });

        it('should shortcut the retun if $original is present', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';

            const json = serializer.toJSON(resource);
            json.should.equal('penguin');

        });

        it('should not shortcut the retun if $original is present but is marked with $isDirty', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';
            resource.$isDirty = true;

            const json = serializer.toJSON(resource);
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: ''
            });
        });

        it('should shortcut the return if $original is present and convertResourcesToRelationships is passed as an option', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';

            const json = serializer.toJSON(resource, {
                convertResourcesToRelationships: true
            });
            json.should.equal('penguin');
        });

        it('should not shortcut the return if $original is present but permitResourcesForRelationships is passed as an option', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';

            const json = serializer.toJSON(resource, {
                permitResourcesForRelationships: true
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: ''
            });
        });

        it('should not shortcut the return if $original is present but deduplicateResources is passed as an option', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';

            const json = serializer.toJSON(resource, {
                deduplicateResources: true
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                $id: 'resource:org.acme.sample.SampleAsset#1',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: ''
            });
        });

        it('should not validate the resource if validation option is passed, but the original resource is unmodified and was validated upon generation', () => {
            const resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.stringValue = '';
            resource.$original = 'penguin';
            resource.$validated = true;

            const validationSpy = sandbox.spy(serializer, 'validationParameters');

            const json = serializer.toJSON(resource);
            json.should.equal('penguin');
            validationSpy.should.not.have.been.called;
        });
    });

    describe('#fromJSON', () => {

        it('should throw if object is not a class', () => {
            let serializer = new Serializer(factory, modelManager);
            (() => {
                serializer.fromJSON({});
            }).should.throw(/Does not contain a \$class type identifier/);
        });

        it('should throw if the class declaration cannot be found', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$class = 'org.acme.sample.NoSuchAsset';
            let serializer = new Serializer(factory, modelManager);
            (() => {
                serializer.fromJSON(mockResource);
            }).should.throw(TypeNotFoundException, /NoSuchAsset/);
        });

        it('should throw if the class declaration is an instance of Enum', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.$class = 'org.acme.sample.SampleEnum';
            let serializer = new Serializer(factory, modelManager);
            (() => {
                serializer.fromJSON(mockResource);
            }).should.throw(Error, /Attempting to create an ENUM declaration is not supported/);
        });

        it('should deserialize a valid asset', () => {
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                stringValue: 'the value'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Resource);
            resource.assetId.should.equal('1');
            resource.owner.should.be.an.instanceOf(Relationship);
            resource.stringValue.should.equal('the value');
        });

        it('should deserialize a valid transaction', () => {
            let json = {
                $class: 'org.acme.sample.SampleTransaction',
                asset: 'resource:org.acme.sample.SampleAsset#1',
                newValue: 'the value'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Resource);
            resource.transactionId.should.exist;
            resource.timestamp.should.exist;
            resource.asset.should.be.an.instanceOf(Relationship);
            resource.newValue.should.equal('the value');
        });

        it('should deserialize a valid event', () => {
            let json = {
                $class: 'org.acme.sample.SampleEvent',
                asset: 'resource:org.acme.sample.SampleAsset#1',
                newValue: 'the value'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Resource);
            resource.eventId.should.exist;
            resource.timestamp.should.exist;
            resource.asset.should.be.an.instanceOf(Relationship);
            resource.newValue.should.equal('the value');
        });

        it('should deserialize a valid concept', () => {
            let json = {
                $class: 'org.acme.sample.Address',
                city: 'Winchester',
                country: 'UK'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Concept);
            resource.city.should.equal('Winchester');
            resource.country.should.equal('UK');
        });

        it('should throw validation errors if the validate flag is not specified', () => {
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com'
            };
            (() => {
                serializer.fromJSON(json);
            }).should.throw(/missing required field/);
        });

        it('should throw validation errors if the validate flag is set to true', () => {
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com'
            };
            (() => {
                serializer.fromJSON(json, { validate: true });
            }).should.throw(/missing required field/);
        });

        it('should not validate if the validate flag is set to false', () => {
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com'
            };
            let resource = serializer.fromJSON(json, { validate: false });
            resource.should.be.an.instanceOf(Resource);
            resource.assetId.should.equal('1');
            resource.owner.should.be.an.instanceOf(Relationship);
            should.equal(resource.stringValue, undefined);
        });

        it('should not validate if the default options specifies the validate flag set to false', () => {
            serializer.setDefaultOptions({ validate: false });
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Resource);
            resource.assetId.should.equal('1');
            resource.owner.should.be.an.instanceOf(Relationship);
            should.equal(resource.stringValue, undefined);
        });

        it('should validate if the default options specifies the validate flag set to false but the input options specify true', () => {
            serializer.setDefaultOptions({ validate: false });
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com'
            };
            (() => {
                serializer.fromJSON(json, { validate: true });
            }).should.throw(/missing required field/);
        });

        it('should error on unexpected properties', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: 'blah'
            };
            (() => serializer.fromJSON(json))
                .should.throw(/WRONG/);
        });

        it('should not error on unexpected properties if their value is undefined', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined
            };
            const result = serializer.fromJSON(json);
            result.should.be.an.instanceOf(Resource);
        });

        it('should create a proxy object that has a $isDirty flag', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined
            };
            const result = serializer.fromJSON(json);
            result.should.be.an.instanceOf(Resource);
            result.$isDirty.should.be.equal(false);
        });

        it('should create a proxy object that changes the $isDirty flag when a property is modified', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.firstName = 'Blocky';
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when a property is added', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.newProperty = 'shiny';
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when a property is deleted', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            delete result.firstName;
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when an array element is modified', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined,
                conceptArray: [
                    { nestedConcept: { value : 'tiger'}},
                    { nestedConcept: { value : 'leopard'}},
                    { nestedConcept: { value : 'puma'}}
                ]
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.conceptArray[1] = { nestedConcept: { value : 'kitten'}};
            result.conceptArray[1].nestedConcept.value.should.equal('kitten');
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when a nested concept is modified', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined,
                conceptArray: [
                    { nestedConcept: { value : 'tiger'}},
                    { nestedConcept: { value : 'leopard'}},
                    { nestedConcept: { value : 'puma'}}
                ]
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.conceptArray[1].nestedConcept.value = 'kitten';
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when a nested concept array item is deleted', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined,
                conceptArray: [
                    { nestedConcept: { value : 'tiger'}},
                    { nestedConcept: { value : 'leopard'}},
                    { nestedConcept: { value : 'puma'}}
                ]
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.conceptArray.length.should.be.equal(3);
            result.conceptArray.pop();
            result.conceptArray.length.should.be.equal(2);
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that changes the $isDirty flag when a nested concept array item is appended', () => {
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined,
                conceptArray: [
                    { nestedConcept: { value : 'tiger'}},
                    { nestedConcept: { value : 'leopard'}},
                    { nestedConcept: { value : 'puma'}}
                ]
            };
            const result = serializer.fromJSON(json);
            result.$isDirty.should.be.equal(false);
            result.conceptArray.length.should.be.equal(3);
            result.conceptArray.push({ nestedConcept: { value : 'lynx'}});
            result.conceptArray.length.should.be.equal(4);
            result.$isDirty.should.be.equal(true);
        });

        it('should create a proxy object that enables functions to be called on properties', () => {
            const myDate = new Date();
            const json = {
                $class: 'org.acme.sample.SampleParticipant',
                participantId: 'alphablock',
                firstName: 'Block',
                lastName: 'Norris',
                WRONG: undefined,
                theDate: myDate.toISOString()
            };
            const result = serializer.fromJSON(json);
            result.theDate.toISOString().should.equal(myDate.toISOString());

        });
    });

});
