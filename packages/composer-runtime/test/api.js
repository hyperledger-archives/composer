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

const Api = require('../lib/api');
const AssetRegistry = require('../lib/api/assetregistry');
const Factory = require('../lib/api/factory');
const Serializer = require('composer-common').Serializer;
const ParticipantRegistry = require('../lib/api/participantregistry');
const realFactory = require('composer-common').Factory;
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;
const EventService = require('../lib/eventservice');
const HTTPService = require('../lib/httpservice');
const Context = require('../lib/context');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Api', () => {

    let mockFactory;
    let mockSerializer;
    let mockParticipant;
    let mockRegistryManager;
    let mockEventService;
    let mockHTTPService;
    let mockContext;
    let api;

    beforeEach(() => {
        mockFactory = sinon.createStubInstance(realFactory);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockParticipant = sinon.createStubInstance(Resource);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockEventService = sinon.createStubInstance(EventService);
        mockHTTPService = sinon.createStubInstance(HTTPService);
        mockContext = sinon.createStubInstance(Context);
        api = new Api(mockFactory, mockSerializer, mockParticipant, mockRegistryManager, mockHTTPService, mockEventService, mockContext);
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
        let mockTransaction;

        beforeEach(() => {
            mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getFullyQualifiedType.returns('much.wow');
            mockHTTPService.post.resolves({foo : 'bar'});
            mockSerializer.toJSON.withArgs(mockTransaction).onFirstCall().returns({
                $class: 'org.doge.DogeTransaction',
                assetId: 'doge1'
            });
        });

        it('should make an POST request using the HTTP service', () => {
            return api.post('url', mockTransaction)
                .should.eventually.have.property('foo')
                .then(() => {
                    sinon.assert.calledOnce(mockSerializer.toJSON);
                    sinon.assert.calledWith(mockSerializer.toJSON, mockTransaction, { convertResourcesToRelationships: true, permitResourcesForRelationships: true });
                    sinon.assert.calledOnce(mockHTTPService.post);
                    sinon.assert.calledWith(mockHTTPService.post, 'url', {
                        $class: 'org.doge.DogeTransaction',
                        assetId: 'doge1'
                    });
                });
        });
    });

    describe('#emit', () => {
        let mockTransaction;
        let mockEvent;

        beforeEach(() => {
            mockTransaction = sinon.createStubInstance(Resource);
            mockEvent = sinon.createStubInstance(Resource);
            mockTransaction.getIdentifier.returns('much.wow');
            mockContext.getTransaction.returns(mockTransaction);
            mockContext.getEventNumber.returns(0);
            mockSerializer.toJSON.withArgs(mockEvent).onFirstCall().returns({
                $class: 'org.doge.DogeEvent',
                assetId: 'doge1'
            });
        });

        it('should emit the event using the event service', () => {
            api.emit(mockEvent);
            sinon.assert.calledOnce(mockSerializer.toJSON);
            sinon.assert.calledWith(mockSerializer.toJSON, mockEvent, { convertResourcesToRelationships: true });
            sinon.assert.calledOnce(mockEventService.emit);
            sinon.assert.calledWith(mockEventService.emit, {
                $class: 'org.doge.DogeEvent',
                assetId: 'doge1'
            });
        });
    });

});
