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

const AccessController = require('../lib/accesscontroller');
const Api = require('../lib/api');
const AssetRegistry = require('../lib/api/assetregistry');
const CompiledQueryBundle = require('../lib/compiledquerybundle');
const Context = require('../lib/context');
const DataService = require('../lib/dataservice');
const EventService = require('../lib/eventservice');
const HTTPService = require('../lib/httpservice');
const Factory = require('../lib/api/factory');
const ModelManager = require('composer-common').ModelManager;
const ParticipantRegistry = require('../lib/api/participantregistry');
const Query = require('../lib/api/query');
const realFactory = require('composer-common').Factory;
const realSerializer = require('composer-common').Serializer;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;
const Serializer = require('../lib/api/serializer');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('Api', () => {

    let mockContext;
    let modelManager;
    let factory;
    let serializer;
    let mockParticipant;
    let mockRegistryManager;
    let mockEventService;
    let mockHTTPService;
    let mockDataService;
    let mockAccessController;
    let mockCompiledQueryBundle;
    let api;

    beforeEach(() => {
        mockContext = sinon.createStubInstance(Context);
        modelManager = new ModelManager();
        modelManager.addModelFile(`
        namespace org.doge
        transaction DogeTransaction {
        }
        event DogeEvent {
        }`);
        modelManager.addModelFile(`
        namespace org.acme.sample
        asset SampleAsset identified by assetId {
            o String assetId
            o String value
        }`);
        factory = new realFactory(modelManager);
        mockContext.getFactory.returns(factory);
        serializer = new realSerializer(factory, modelManager);
        mockContext.getSerializer.returns(serializer);
        mockParticipant = sinon.createStubInstance(Resource);
        mockContext.getParticipant.returns(mockParticipant);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockEventService = sinon.createStubInstance(EventService);
        mockContext.getEventService.returns(mockEventService);
        mockHTTPService = sinon.createStubInstance(HTTPService);
        mockContext.getHTTPService.returns(mockHTTPService);
        mockDataService = sinon.createStubInstance(DataService);
        mockContext.getDataService.returns(mockDataService);
        mockAccessController = sinon.createStubInstance(AccessController);
        mockAccessController.check.resolves();
        mockContext.getAccessController.returns(mockAccessController);
        mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
        mockContext.getCompiledQueryBundle.returns(mockCompiledQueryBundle);
        api = new Api(mockContext);
    });

    describe('#getMethodNames', () => {

        it('should return a list of method names', () => {
            const propertyNames = Object.getOwnPropertyNames(api);
            Api.getMethodNames().should.deep.equal(propertyNames);
        });

    });

    describe('#constructor', () => {

        it('should obscure any implementation details', () => {
            Object.isFrozen(api).should.be.true;
            Object.getOwnPropertyNames(api).forEach((prop) => {
                api[prop].should.be.a('function');
            });
            Object.getOwnPropertySymbols(api).should.have.lengthOf(0);
        });

    });

    describe('#getFactory', () => {

        it('should return the factory', () => {
            api.getFactory().should.be.an.instanceOf(Factory);
        });

    });

    describe('#getSerializer', () => {

        it('should return the serialzier', () => {
            api.getSerializer().should.be.an.instanceOf(Serializer);
        });

    });

    describe('#getAssetRegistry', () => {

        it('should return the specified asset registry', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').resolves(mockRegistry);
            return api.getAssetRegistry('org.doge.Doge')
                .should.eventually.be.an.instanceOf(AssetRegistry);
        });

        it('should handle any errors', () => {
            mockRegistryManager.get.withArgs('Asset', 'org.doge.Doge').rejects(new Error('wow such error'));
            return api.getAssetRegistry('org.doge.Doge')
                .should.be.rejectedWith(/wow such error/);
        });

    });

    describe('#getParticipantRegistry', () => {

        it('should return the specified participant registry', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Participant', 'org.doge.Doge').resolves(mockRegistry);
            return api.getParticipantRegistry('org.doge.Doge')
                .should.eventually.be.an.instanceOf(ParticipantRegistry);
        });

        it('should handle any errors', () => {
            mockRegistryManager.get.withArgs('Participant', 'org.doge.Doge').rejects(new Error('wow such error'));
            return api.getParticipantRegistry('org.doge.Doge')
                .should.be.rejectedWith(/wow such error/);
        });

    });

    describe('#getCurrentParticipant', () => {

        it('should return the current participant', () => {
            api.getCurrentParticipant().should.equal(mockParticipant);
        });

    });

    describe('#post', () => {
        let transaction;
        let spy;

        beforeEach(() => {
            transaction = factory.newResource('org.doge', 'DogeTransaction', 'doge1');
            transaction.timestamp = new Date(545184000000);
            mockHTTPService.post.resolves({foo : 'bar'});
            spy = sinon.spy(serializer, 'toJSON');
        });

        it('should make an POST request using the HTTP service', () => {
            return api.post('url', transaction, {options: true})
                .should.eventually.have.property('foo')
                .then(() => {
                    sinon.assert.calledWith(spy, transaction, { options: true, validate: true });
                    sinon.assert.calledOnce(mockHTTPService.post);
                    sinon.assert.calledWith(mockHTTPService.post, 'url', {
                        $class: 'org.doge.DogeTransaction',
                        timestamp: '1987-04-12T00:00:00.000Z',
                        transactionId: 'doge1'
                    } );
                });
        });
    });

    describe('#emit', () => {
        let transaction;
        let event;
        let spy;

        beforeEach(() => {
            transaction = factory.newResource('org.doge', 'DogeTransaction', 'doge1');
            transaction.timestamp = new Date(545184000000);
            event = factory.newResource('org.doge', 'DogeEvent', 'doge1');
            event.timestamp = new Date(545184000000);
            mockContext.getTransaction.returns(transaction);
            mockContext.getEventNumber.returns(0);
            spy = sinon.spy(serializer, 'toJSON');
        });

        it('should emit the event using the event service', () => {
            api.emit(event);
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, event, { convertResourcesToRelationships: true, validate: true });
            sinon.assert.calledOnce(mockEventService.emit);
            sinon.assert.calledWith(mockEventService.emit, {
                $class: 'org.doge.DogeEvent',
                timestamp: '1987-04-12T00:00:00.000Z',
                eventId: 'doge1#0'
            });
        });
    });

    describe('#buildQuery', () => {

        it('should build the query and return the built query', () => {
            mockCompiledQueryBundle.buildQuery.withArgs('SELECT org.acme.sample.SampleAsset').returns('73985df48b1bd00f737a7a38575b25dfcd2cf60fb5e09d11d370dfa28036bcf8');
            const query = api.buildQuery('SELECT org.acme.sample.SampleAsset');
            query.should.be.an.instanceOf(Query);
            query.getIdentifier().should.equal('73985df48b1bd00f737a7a38575b25dfcd2cf60fb5e09d11d370dfa28036bcf8');
        });

    });

    describe('#query', () => {

        const queryID = 'Q1';
        const queryHash = '73985df48b1bd00f737a7a38575b25dfcd2cf60fb5e09d11d370dfa28036bcf8';
        const queryParams = {
            param1: 'hello 1',
            param2: 100.56
        };
        let resources;

        beforeEach(() => {
            const mockObjects = [];
            resources = [];
            for (let i = 0; i < 5; i++) {
                const object = {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset',
                    assetId: 'ASSET_' + i,
                    value: 'the value ' + i
                };
                mockObjects.push(object);
                const resource = factory.newResource('org.acme.sample', 'SampleAsset', 'ASSET_' + i);
                resource.value = 'the value ' + i;
                if (i % 2 === 0) {
                    mockAccessController.check.withArgs(resource, 'READ').rejects(new Error('access denied'));
                } else {
                    resources.push(resource);
                }
            }
            mockCompiledQueryBundle.execute.withArgs(mockDataService, queryID).resolves(mockObjects);
            mockCompiledQueryBundle.execute.withArgs(mockDataService, queryHash).resolves(mockObjects);
        });

        it('should throw for invalid queries', () => {
            [undefined, null, 3.142, {}].forEach((thing) => {
                (() => {
                    api.query(thing);
                }).should.throw(/Invalid query/);
            });
        });

        it('should perform a query using a named query', () => {
            return api.query(queryID)
                .should.eventually.be.deep.equal(resources)
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, queryID);
                    sinon.assert.callCount(mockAccessController.check, 5);
                });
        });

        it('should perform a query using a named query and parameters', () => {
            return api.query(queryID, queryParams)
                .should.eventually.be.deep.equal(resources)
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, queryID, queryParams);
                    sinon.assert.callCount(mockAccessController.check, 5);
                });
        });

        it('should perform a query using a built query', () => {
            const query = new Query(queryHash);
            return api.query(query)
                .should.eventually.be.deep.equal(resources)
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, queryHash);
                    sinon.assert.callCount(mockAccessController.check, 5);
                });
        });

        it('should perform a query using a built query and parameters', () => {
            const query = new Query(queryHash);
            return api.query(query, queryParams)
                .should.eventually.be.deep.equal(resources)
                .then(() => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, queryHash, queryParams);
                    sinon.assert.callCount(mockAccessController.check, 5);
                });
        });

    });

});
