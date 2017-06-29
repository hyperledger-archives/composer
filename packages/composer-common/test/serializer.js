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
const Serializer = require('../lib/serializer');
const TypeNotFoundException = require('../lib/typenotfoundexception');

require('chai').should();
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
        o String value
        }

        participant SampleParticipant identified by participantId {
        o String participantId
        o String firstName
        o String lastName
        }

        transaction SampleTransaction {
        --> SampleAsset asset
        o String newValue
        }

        event SampleEvent{
        --> SampleAsset asset
        o String newValue
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
            }).should.throw(/only accepts instances of Resource/);
        });

        it('should throw if the class declaration cannot be found', () => {
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getFullyQualifiedType.returns('org.acme.sample.NoSuchAsset');
            (() => {
                serializer.toJSON(mockResource);
            }).should.throw(TypeNotFoundException, /NoSuchAsset/);
        });

        it('should validate if the validate flag is set to false', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.value = 'the value';
            let json = serializer.toJSON(resource, {
                validate: false
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                value: 'the value'
            });
        });

        it('should throw validation errors if the validate flag is set to true', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            (() => {
                serializer.toJSON(resource, {
                    validate: true
                });
            }).should.throw(/missing required field/);
        });

        it('should not validate if the validate flag is set to false', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            let json = serializer.toJSON(resource, {
                validate: false
            });
            json.should.deep.equal({
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1'
            });
        });

        it('should handle an error parsing the generated JSON', () => {
            let resource = factory.newResource('org.acme.sample', 'SampleAsset', '1');
            resource.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
            resource.value = 'the value';
            sandbox.stub(JSON, 'parse').throws();
            (() => {
                serializer.toJSON(resource);
            }).should.throw(/Generated invalid JSON/);
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

        it('should deserialize a valid asset', () => {
            let json = {
                $class: 'org.acme.sample.SampleAsset',
                assetId: '1',
                owner: 'resource:org.acme.sample.SampleParticipant#alice@email.com',
                value: 'the value'
            };
            let resource = serializer.fromJSON(json);
            resource.should.be.an.instanceOf(Resource);
            resource.assetId.should.equal('1');
            resource.owner.should.be.an.instanceOf(Relationship);
            resource.value.should.equal('the value');
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

    });

});
