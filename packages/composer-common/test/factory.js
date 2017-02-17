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
        }`);
        factory = new Factory(modelManager);
        sandbox = sinon.sandbox.create();
        sandbox.stub(uuid, 'v4').returns('5604bdfe-7b96-45d0-9883-9c05c18fe638');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#newResource', () => {

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

        it('should create a new instance with a specified ID and generated data', () => {
            let resource = factory.newResource('org.acme.test', 'MyAsset', 'MY_ID_1', { generate: true });
            resource.assetId.should.equal('MY_ID_1');
            resource.newValue.should.be.a('string');
            should.not.equal(resource.validate, undefined);
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
            }).should.throw(/ModelFile for namespace org.acme.missing has not been registered with the ModelManager/);
        });

        it('should throw if Concept missing', () => {
            (() => {
                factory.newConcept('org.acme.test', 'MissingConcept');
            }).should.throw(/Type MissingConcept is not declared in namespace org.acme.test/);
        });

        it('should throw if concept is abstract', () => {
            (() => {
                factory.newConcept('org.acme.test', 'AbstractConcept');
            }).should.throw(/Cannot create abstract type org.acme.test.AbstractConcept/);
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

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            let factory = new Factory(mockModelManager);
            factory.toJSON().should.deep.equal({});
        });

    });

});
