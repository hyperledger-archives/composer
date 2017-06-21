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

const Factory = require('composer-common').Factory;
const ModelManager = require('composer-common').ModelManager;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Serializer = require('composer-common').Serializer;
const TransactionLogger = require('../lib/transactionlogger');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('TransactionLogger', () => {

    let modelManager;
    let factory;
    let serializer;
    let mockRegistry;
    let mockRegistryManager;
    let oldAsset, newAsset;
    let transaction;
    let transactionLogger;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace org.acme
        asset MyAsset identified by assetId {
            o String assetId
            o String theValue
        }
        transaction MyTransaction {
        }`);
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        oldAsset = factory.newResource('org.acme', 'MyAsset', '1');
        oldAsset.theValue = 'new value';
        newAsset = factory.newResource('org.acme', 'MyAsset', '1');
        newAsset.theValue = 'new value';
        transaction = factory.newTransaction('org.acme', 'MyTransaction');
        mockRegistry = sinon.createStubInstance(Registry);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        transactionLogger = new TransactionLogger(transaction, mockRegistryManager, serializer);
    });

    describe('#onResourceAdded', () => {

        it('should do nothing', () => {
            let event = { registry: mockRegistry, resource: newAsset };
            transactionLogger.onResourceAdded(event);
        });

    });

    describe('#onResourceUpdated', () => {

        it('should do nothing', () => {
            let event = { registry: mockRegistry, oldResource: oldAsset, newResource: newAsset };
            transactionLogger.onResourceUpdated(event);
        });

    });

    describe('#onResourceRemoved', () => {

        it('should do nothing', () => {
            let event = { registry: mockRegistry, resource: newAsset };
            transactionLogger.onResourceRemoved(event);
        });

    });

});
