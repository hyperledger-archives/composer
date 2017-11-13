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

const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkConnectionWrapper = require('../lib/businessnetworkconnectionwrapper');
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Introspector = require('composer-common').Introspector;
const ModelManager = require('composer-common').ModelManager;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('BusinessNetworkConnectionWrapper', () => {

    let settings;
    let mockBusinessNetworkConnection;
    let businessNetworkConnectionWrapper;
    let mockBusinessNetworkDefinition;
    let mockSerializer;
    let mockModelManager;
    let mockIntrospector;
    let mockCardStore;

    beforeEach(() => {
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockBusinessNetworkConnection.getBusinessNetwork.returns(mockBusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
        mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
        mockBusinessNetworkDefinition.getIntrospector.returns(mockIntrospector);
        mockCardStore = sinon.createStubInstance(BusinessNetworkCardStore);
        settings = {
            card: 'admin@biznet',
            cardStore: mockCardStore,
            multiuser: true
        };
        businessNetworkConnectionWrapper = new BusinessNetworkConnectionWrapper(settings);
        businessNetworkConnectionWrapper.businessNetworkConnection = mockBusinessNetworkConnection;
    });

    describe('#constructor', () => {

        it('should create a new business network connection wrapper', () => {
            const businessNetworkConnectionWrapper = new BusinessNetworkConnectionWrapper(settings);
            businessNetworkConnectionWrapper.businessNetworkConnection.should.be.an.instanceOf(BusinessNetworkConnection);
            businessNetworkConnectionWrapper.connected.should.be.false;
            businessNetworkConnectionWrapper.connecting.should.be.false;
        });

        it('should throw if card not specified', () => {
            delete settings.card;
            (() => {
                new BusinessNetworkConnectionWrapper(settings);
            }).should.throw(/card not specified/);
        });

    });

    describe('#ensureConnected', () => {

        it('should return the connection if already connected', () => {
            businessNetworkConnectionWrapper.connected = true;
            return businessNetworkConnectionWrapper.ensureConnected()
                .then((connection) => {
                    connection.should.equal(mockBusinessNetworkConnection);
                });
        });

        it('should return the connecting promise if already connecting', () => {
            businessNetworkConnectionWrapper.connecting = true;
            businessNetworkConnectionWrapper.connectionPromise = Promise.resolve('test value');
            return businessNetworkConnectionWrapper.ensureConnected()
                .then((connection) => {
                    connection.should.equal('test value');
                });
        });

        it('should connect if not already connected or connecting', () => {
            sinon.stub(businessNetworkConnectionWrapper, 'connect').resolves(mockBusinessNetworkConnection);
            return businessNetworkConnectionWrapper.ensureConnected()
                .then((connection) => {
                    sinon.assert.calledOnce(businessNetworkConnectionWrapper.connect);
                });
        });

    });

    describe('#connect', () => {

        it('should connect to the business network', () => {
            mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);
            return businessNetworkConnectionWrapper.connect()
                .then((businessNetworkConnection) => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                    businessNetworkConnectionWrapper.businessNetwork.should.equal(mockBusinessNetworkDefinition);
                    businessNetworkConnectionWrapper.serializer.should.equal(mockSerializer);
                    businessNetworkConnectionWrapper.modelManager.should.equal(mockModelManager);
                    businessNetworkConnectionWrapper.introspector.should.equal(mockIntrospector);
                    businessNetworkConnectionWrapper.connected.should.be.true;
                    businessNetworkConnectionWrapper.connecting.should.be.false;
                    businessNetworkConnection.should.equal(mockBusinessNetworkConnection);
                });
        });

        it('should handle errors connecting to the business network', () => {
            mockBusinessNetworkConnection.connect.rejects(new Error('such error'));
            return businessNetworkConnectionWrapper.connect()
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#disconnect', () => {

        it('should disconnect to the business network', () => {
            mockBusinessNetworkConnection.disconnect.resolves();
            return businessNetworkConnectionWrapper.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.removeAllListeners);
                    sinon.assert.calledOnce(mockBusinessNetworkConnection.disconnect);
                    businessNetworkConnectionWrapper.connected.should.be.false;
                    businessNetworkConnectionWrapper.connecting.should.be.false;
                });
        });

        it('should handle errors disconnecting from the business network', () => {
            mockBusinessNetworkConnection.disconnect.rejects(new Error('such error'));
            return businessNetworkConnectionWrapper.disconnect()
                .should.be.rejectedWith(/such error/);
        });

    });

    describe('#getBusinessNetworkConnection', () => {

        it('should get the business network connection', () => {
            businessNetworkConnectionWrapper.businessNetworkConnection = mockBusinessNetworkConnection;
            businessNetworkConnectionWrapper.getBusinessNetworkConnection().should.equal(mockBusinessNetworkConnection);
        });

    });

    describe('#getBusinessNetworkDefinition', () => {

        it('should get the business network definition', () => {
            businessNetworkConnectionWrapper.businessNetwork = mockBusinessNetworkDefinition;
            businessNetworkConnectionWrapper.getBusinessNetworkDefinition().should.equal(mockBusinessNetworkDefinition);
        });

    });

    describe('#getSerializer', () => {

        it('should get the serializer', () => {
            businessNetworkConnectionWrapper.serializer = mockSerializer;
            businessNetworkConnectionWrapper.getSerializer().should.equal(mockSerializer);
        });

    });

    describe('#getModelManager', () => {

        it('should get the model manager', () => {
            businessNetworkConnectionWrapper.modelManager = mockModelManager;
            businessNetworkConnectionWrapper.getModelManager().should.equal(mockModelManager);
        });

    });

    describe('#getIntrospector', () => {

        it('should get the introspector', () => {
            businessNetworkConnectionWrapper.introspector = mockIntrospector;
            businessNetworkConnectionWrapper.getIntrospector().should.equal(mockIntrospector);
        });

    });

    describe('#isConnected', () => {

        it('should get the connected flag', () => {
            businessNetworkConnectionWrapper.connected = true;
            businessNetworkConnectionWrapper.isConnected().should.be.true;
        });

    });

    describe('#isConnecting', () => {

        it('should get the connecting flag', () => {
            businessNetworkConnectionWrapper.connecting = true;
            businessNetworkConnectionWrapper.isConnecting().should.be.true;
        });

    });

});
