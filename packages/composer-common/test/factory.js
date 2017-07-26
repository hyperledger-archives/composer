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
const TypeNotFoundException = require('../lib/typenotfoundexception');
const uuid = require('uuid');

const should = require('chai').should();
const sinon = require('sinon');

describe('Factory', function() {
    const namespace = 'org.acme.test';
    const assetName = 'MyAsset';

    let factory;
    let modelManager;
    let sandbox;

    before(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.test
        abstract concept AbstractConcept {
            o String newValue
        }
        concept MyConcept {
            o String newValue
        }
        abstract asset AbstractAsset identified by assetId {
            o String assetId
        }
        asset MyAsset identified by assetId {
            o String assetId
            o String newValue
            o String optionalValue optional
        }
        transaction MyTransaction {
            o String newValue
        }
        event MyEvent {
            o String value
        }`);
        factory = new Factory(modelManager);
    });

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        sandbox.stub(uuid, 'v4').returns('5604bdfe-7b96-45d0-9883-9c05c18fe638');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#newResource', function() {
        it('should throw creating a new instance without an ID', function() {
            (() => {
                factory.newResource(namespace, assetName, null);
            }).should.throw(/Invalid or missing identifier/);
        });

        it('should throw creating a new instance with an ID that is just whitespace', function() {
            (() => {
                factory.newResource(namespace, assetName, '     ');
            }).should.throw(/Missing identifier/);
        });

        it('should throw creating an abstract asset', function() {
            (() => {
                factory.newResource(namespace, 'AbstractAsset', 'MY_ID_1');
            }).should.throw(/AbstractAsset/);
        });

        it('should throw creating a concept', function() {
            (() => {
                factory.newResource(namespace, 'MyConcept', 'MY_ID_1');
            }).should.throw(/MyConcept/);
        });

        it('should create a new instance with a specified ID', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1');
            resource.assetId.should.equal('MY_ID_1');
        });

        it('should create a new validating instance by default', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1');
            should.not.equal(resource.validate, undefined);
        });

        it('should create a new non-validating instance', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { disableValidation: true });
            should.equal(resource.validate, undefined);
        });

        it('should not define fields if \'generate\' option is not set', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1');
            should.equal(resource.newValue, undefined);
        });

        it('should generate empty field values', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'empty' });
            assertEmptyFieldValues(resource);
        });

        const assertEmptyFieldValues = function(resource) {
            should.not.equal(resource.newValue, undefined);
            resource.newValue.should.be.a('String');
            resource.newValue.length.should.equal(0);
        };

        it('should generate sample field values', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'sample' });
            assertSampleFieldValues(resource);
        });

        it('should generate sample field values if \'generate\' option is a boolean', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: true });
            assertSampleFieldValues(resource);
        });

        const assertSampleFieldValues = function(resource) {
            should.not.equal(resource.newValue, undefined);
            resource.newValue.should.be.a('String');
            resource.newValue.length.should.not.equal(0);
        };

        it('should not define optional fields with generated empty data if includeOptionalFields not specified', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'empty' });
            assertOptionalNotDefined(resource);
        });

        it('should not define optional fields with generated sample data if includeOptionalFields not specified', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'sample' });
            assertOptionalNotDefined(resource);
        });

        const assertOptionalNotDefined = function(resource) {
            should.equal(resource.optionalValue, undefined);
        };

        it ('should define optional fields with generated empty data if includeOptionalFields is specified', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'empty', includeOptionalFields: true });
            assertOptionalIsDefined(resource);
        });

        it ('should define optional fields with generated sample data if includeOptionalFields is specified', function() {
            const resource = factory.newResource(namespace, assetName, 'MY_ID_1', { generate: 'sample', includeOptionalFields: true });
            assertOptionalIsDefined(resource);
        });

        const assertOptionalIsDefined = function(resource) {
            should.not.equal(resource.optionalValue, undefined);
            resource.optionalValue.should.be.a('String');
        };

    });

    describe('#newConcept', () => {

        it('should throw if namespace missing', () => {
            (() => {
                factory.newConcept('org.acme.missing', 'MyConcept');
            }).should.throw(TypeNotFoundException);
        });

        it('should throw if Concept missing', () => {
            (() => {
                factory.newConcept(namespace, 'MissingConcept');
            }).should.throw(TypeNotFoundException);
        });

        it('should throw if concept is abstract', () => {
            (() => {
                factory.newConcept(namespace, 'AbstractConcept');
            }).should.throw(/Cannot instantiate Abstract Type AbstractConcept in namespace org.acme.test/);
        });

        it('should throw creating a non-concept', function() {
            (() => {
                factory.newConcept(namespace, assetName);
            }).should.throw(new RegExp(assetName));
        });

        it('should create a new concept', () => {
            let resource = factory.newConcept(namespace, 'MyConcept');
            should.equal(resource.newValue, undefined);
            should.not.equal(resource.validate, undefined);
        });

        it('should create a new non-validating concept', () => {
            let resource = factory.newConcept(namespace, 'MyConcept', { disableValidation: true });
            should.equal(resource.newValue, undefined);
            should.equal(resource.validate, undefined);
        });

        it('should create a new concept with generated data', () => {
            let resource = factory.newConcept(namespace, 'MyConcept', { generate: true });
            resource.newValue.should.be.a('string');
            should.not.equal(resource.validate, undefined);
        });

    });

    describe('#newRelationship', function() {
        it('should throw if namespace missing', function() {
            (() => factory.newRelationship('org.acme.missing', assetName, 'id')).
                should.throw(TypeNotFoundException, /org.acme.missing/);
        });

        it('should throw if type missing', function() {
            (() => factory.newRelationship(namespace, 'MissingType', 'id')).
                should.throw(TypeNotFoundException, /MissingType/);
        });

        it('should succeed for a valid type', function() {
            const relationship = factory.newRelationship(namespace, assetName, 'id');
            relationship.isRelationship().should.be.true;
        });
    });

    describe('#newTransaction', () => {

        it('should throw if ns not specified', () => {
            (() => {
                factory.newTransaction(null, 'MyTransaction');
            }).should.throw(/ns not specified/);
        });

        it('should throw if type not specified', () => {
            (() => {
                factory.newTransaction(namespace, null);
            }).should.throw(/type not specified/);
        });

        it('should throw if a non transaction type was specified', () => {
            (() => {
                factory.newTransaction(namespace, assetName);
            }).should.throw(/not a transaction/);
        });

        it('should create a new instance with a generated ID', () => {
            let resource = factory.newTransaction(namespace, 'MyTransaction');
            resource.transactionId.should.equal('5604bdfe-7b96-45d0-9883-9c05c18fe638');
            should.equal(resource.newValue, undefined);
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newTransaction(namespace, 'MyTransaction', 'MY_ID_1');
            resource.transactionId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should pass options onto newResource', () => {
            let spy = sandbox.spy(factory, 'newResource');
            factory.newTransaction(namespace, 'MyTransaction', null, { hello: 'world' });
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, namespace, 'MyTransaction', '5604bdfe-7b96-45d0-9883-9c05c18fe638', { hello: 'world' });
        });

    });

    describe('#newEvent', () => {
        it('should throw if ns not specified', () => {
            (() => {
                factory.newEvent(null, 'MyEvent');
            }).should.throw(/ns not specified/);
        });

        it('should throw if type not specified', () => {
            (() => {
                factory.newEvent(namespace, null);
            }).should.throw(/type not specified/);
        });

        it('should throw if a non event type was specified', () => {
            (() => {
                factory.newEvent(namespace, 'MyTransaction');
            }).should.throw(/not an event/);
        });

        it('should create a new instance with a generated ID', () => {
            let resource = factory.newEvent(namespace, 'MyEvent');
            resource.eventId.should.equal('valid');
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newEvent(namespace, 'MyEvent', 'MY_ID_1');
            resource.eventId.should.equal('MY_ID_1');
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should pass options onto newEvent', () => {
            let spy = sandbox.spy(factory, 'newResource');
            factory.newEvent(namespace, 'MyEvent', null, { hello: 'world' });
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, namespace, 'MyEvent', 'valid', { hello: 'world' });
        });
    });

});
