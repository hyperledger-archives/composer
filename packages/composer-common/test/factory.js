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

describe('Factory', () => {

    let factory;
    let modelManager;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.acme.test
        abstract concept AbstractConcept {
            o String newValue
        }
        concept MyConcept {
            o String newValue
        }
        asset MyAsset identified by assetId {
            o String assetId
            o String newValue
        }
        transaction MyTransaction identified by transactionId {
            o String transactionId
            o String newValue
        }
        event MyEvent identified by eventId {
            o String eventId
            o String value
        }`);
        factory = new Factory(modelManager);
        sandbox = sinon.sandbox.create();
        sandbox.stub(uuid, 'v4').returns('5604bdfe-7b96-45d0-9883-9c05c18fe638');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#newResource', () => {

        it('should throw creating a new instance without an ID', () => {
            (() => {
                factory.newResource('org.acme.test', 'MyAsset', null);
            }).should.throw(/Invalid or missing identifier/);
        });

        it('should throw creating a new instance with an ID that is just whitespace', () => {
            (() => {
                factory.newResource('org.acme.test', 'MyAsset', '     ');
            }).should.throw(/Missing identifier/);
        });

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1');
            resource.assetId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            should.not.equal(resource.validate, undefined);
        });

        it('should create a new non-validating instance with a specified ID', () => {
            let resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1', { disableValidation: true });
            resource.assetId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            should.equal(resource.validate, undefined);
        });

        it('should create a new instance with a specified ID and generated empty data', () => {
            let resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1', { generate: 'empty' });
            resource.assetId.should.equal('MY_ID_1');
            resource.newValue.should.be.a('string');
            resource.newValue.length.should.equal(0);
            should.not.equal(resource.validate, undefined);
        });

        const validateSampleData = (resource) => {
            resource.assetId.should.equal('MY_ID_1');
            resource.newValue.should.be.a('string');
            resource.newValue.length.should.not.equal(0);
            should.not.equal(resource.validate, undefined);
        };

        it('should create a new instance with a specified ID and generated sample data', () => {
            const resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1', { generate: 'sample' });
            validateSampleData(resource);
        });

        it('should generate sample data if \'generate\' option is a boolean', () => {
            const resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1', { generate: true });
            validateSampleData(resource);
        });

    });

    describe('#newInstance', () => {

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newInstance('org.acme.test', 'MyAsset', 'MY_ID_1');
            resource.assetId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            should.not.equal(resource.validate, undefined);
        });

        it('should create a new non-validating instance with a specified ID', () => {
            let resource = factory.newInstance('org.acme.test', 'MyAsset', 'MY_ID_1', { disableValidation: true });
            resource.assetId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            should.equal(resource.validate, undefined);
        });

        it('should create a new instance with a specified ID and generated data', () => {
            let resource = factory.newInstance('org.acme.test', 'MyAsset', 'MY_ID_1', { generate: true });
            resource.assetId.should.equal('MY_ID_1');
            resource.newValue.should.be.a('string');
            should.not.equal(resource.validate, undefined);
        });

    });

    describe('#newConcept', () => {

        it('should throw if namespace missing', () => {
            (() => {
                factory.newConcept('org.acme.missing', 'MyConcept');
            }).should.throw(TypeNotFoundException);
        });

        it('should throw if Concept missing', () => {
            (() => {
                factory.newConcept('org.acme.test', 'MissingConcept');
            }).should.throw(TypeNotFoundException);
        });

        it('should throw if concept is abstract', () => {
            (() => {
                factory.newConcept('org.acme.test', 'AbstractConcept');
            }).should.throw(/Cannot instantiate Abstract Type AbstractConcept in namespace org.acme.test/);
        });

        it('should create a new concept', () => {
            let resource = factory.newConcept('org.acme.test', 'MyConcept');
            should.equal(resource.newValue, undefined);
            should.not.equal(resource.validate, undefined);
        });

        it('should create a new non-validating concept', () => {
            let resource = factory.newConcept('org.acme.test', 'MyConcept', { disableValidation: true });
            should.equal(resource.newValue, undefined);
            should.equal(resource.validate, undefined);
        });

        it('should create a new concept with generated data', () => {
            let resource = factory.newConcept('org.acme.test', 'MyConcept', { generate: true });
            resource.newValue.should.be.a('string');
            should.not.equal(resource.validate, undefined);
        });

    });

    describe('#newRelationship', function() {
        it('should throw if namespace missing', function() {
            (() => factory.newRelationship('org.acme.missing', 'MyAsset', 'id')).
                should.throw(TypeNotFoundException, /org.acme.missing/);
        });

        it('should throw if type missing', function() {
            (() => factory.newRelationship('org.acme.test', 'MissingType', 'id')).
                should.throw(TypeNotFoundException, /MissingType/);
        });

        it('should succeed for a valid type', function() {
            const relationship = factory.newRelationship('org.acme.test', 'MyAsset', 'id');
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
                factory.newTransaction('org.acme.test', null);
            }).should.throw(/type not specified/);
        });

        it('should throw if a non transaction type was specified', () => {
            (() => {
                factory.newTransaction('org.acme.test', 'MyAsset');
            }).should.throw(/not a transaction/);
        });

        it('should create a new instance with a generated ID', () => {
            let resource = factory.newTransaction('org.acme.test', 'MyTransaction');
            resource.transactionId.should.equal('5604bdfe-7b96-45d0-9883-9c05c18fe638');
            should.equal(resource.newValue, undefined);
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newTransaction('org.acme.test', 'MyTransaction', 'MY_ID_1');
            resource.transactionId.should.equal('MY_ID_1');
            should.equal(resource.newValue, undefined);
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should pass options onto newResource', () => {
            let spy = sandbox.spy(factory, 'newResource');
            factory.newTransaction('org.acme.test', 'MyTransaction', null, { hello: 'world' });
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'org.acme.test', 'MyTransaction', '5604bdfe-7b96-45d0-9883-9c05c18fe638', { hello: 'world' });
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
                factory.newEvent('org.acme.test', null);
            }).should.throw(/type not specified/);
        });

        it('should throw if a non event type was specified', () => {
            (() => {
                factory.newEvent('org.acme.test', 'MyTransaction');
            }).should.throw(/not an event/);
        });

        it('should create a new instance with a generated ID', () => {
            let resource = factory.newEvent('org.acme.test', 'MyEvent');
            resource.eventId.should.equal('valid');
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should create a new instance with a specified ID', () => {
            let resource = factory.newEvent('org.acme.test', 'MyEvent', 'MY_ID_1');
            resource.eventId.should.equal('MY_ID_1');
            resource.timestamp.should.be.an.instanceOf(Date);
        });

        it('should pass options onto newEvent', () => {
            let spy = sandbox.spy(factory, 'newResource');
            factory.newEvent('org.acme.test', 'MyEvent', null, { hello: 'world' });
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, 'org.acme.test', 'MyEvent', 'valid', { hello: 'world' });
        });
    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            let factory = new Factory(mockModelManager);
            factory.toJSON().should.deep.equal({});
        });

    });

});
