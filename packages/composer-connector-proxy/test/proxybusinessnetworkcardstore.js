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

/* const ProxyBusinessNetworkCardStore = */
require('..');
const serializerr = require('serializerr');

const IdCard = require('composer-common').IdCard;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('ProxyBusinessNetworkCardStore', () => {

    const cardName = 'myCard';
    const card = new IdCard({userName : 'banana'}, {name : 'profileOne'});
    const cardOne = new IdCard({userName : 'bob'}, {name : 'profileTwo'});

    const serializedError = serializerr(new TypeError('such type error'));

    let mockSocketFactory;
    let mockSocket;
    let ProxyBusinessNetworkCardStore;

    let businessNetworkCardStore;

    beforeEach(() => {
        mockSocket = {
            emit : sinon.stub(),
            once : sinon.stub(),
            on : sinon.stub()
        };

        mockSocketFactory = sinon.stub().returns(mockSocket);
        ProxyBusinessNetworkCardStore = proxyquire('../lib/proxybusinessnetworkcardstore', {
            'socket.io-client' : mockSocketFactory
        });
    });

    describe('#setConnectorServerURL', () => {
        it('should change the URL used to connect to the connector server', () => {
            ProxyBusinessNetworkCardStore.setConnectorServerURL('http://blah.com:2393');
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            new ProxyBusinessNetworkCardStore();
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://blah.com:2393');
        });
    });

    describe('#constructor', () => {
        let businessNetworkCardStore;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            businessNetworkCardStore = new ProxyBusinessNetworkCardStore();
        });

        it('should create a new socket connection and listen for a connect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the connect callback.
            businessNetworkCardStore.connected.should.be.false;
            mockSocket.on.args[0][0].should.equal('connect');
            mockSocket.on.args[0][1]();
            businessNetworkCardStore.connected.should.be.true;
        });

        it('should create a new socket connection and listen for a disconnect event', () => {
            sinon.assert.calledOnce(mockSocketFactory);
            sinon.assert.calledWith(mockSocketFactory, 'http://localhost:15699');
            // Trigger the disconnect callback.
            businessNetworkCardStore.connected = true;
            mockSocket.on.args[1][0].should.equal('disconnect');
            mockSocket.on.args[1][1]();
            businessNetworkCardStore.connected.should.be.false;
        });
    });

    describe('#ensureConnected', () => {
        let connectionManager;

        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            connectionManager = new ProxyBusinessNetworkCardStore();
        });

        it('should do nothing if already connected', () => {
            connectionManager.connected = true;
            return connectionManager.ensureConnected();
        });

        it('should wait for a connection if not connected', () => {
            mockSocket.once.withArgs('connect').yields();
            connectionManager.connected = false;
            return connectionManager.ensureConnected()
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.once);
                    sinon.assert.calledWith(mockSocket.once, 'connect');
                });
        });
    });

    describe('#get', () => {
        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            businessNetworkCardStore = new ProxyBusinessNetworkCardStore();
            businessNetworkCardStore.connected = true;
        });

        it('should send a load call to the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreGet', cardName, sinon.match.func).yields(null, card);
            return businessNetworkCardStore.get(cardName)
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/businessNetworkCardStoreGet', cardName, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                    result.should.deep.equal(card);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreGet', cardName, sinon.match.func).yields(serializedError);
            return businessNetworkCardStore.get(cardName)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#put', () => {
        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            businessNetworkCardStore = new ProxyBusinessNetworkCardStore();
            businessNetworkCardStore.connected = true;
        });

        it('should send a put call to the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStorePut', cardName, card, sinon.match.func).yields(null);
            return businessNetworkCardStore.put(cardName, card)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/businessNetworkCardStorePut', cardName, card, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStorePut', cardName, card, sinon.match.func).yields(serializedError);
            return businessNetworkCardStore.put(cardName, card)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#getAll', () => {
        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            businessNetworkCardStore = new ProxyBusinessNetworkCardStore();
            businessNetworkCardStore.connected = true;
        });

        it('should send a getAll call to the connector server', () => {
            let cardObject = {
                'cardOne' : card,
                'cardTwo' : cardOne
            };
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreGetAll', sinon.match.func).yields(null, cardObject);
            return businessNetworkCardStore.getAll()
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/businessNetworkCardStoreGetAll', sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);

                    result.size.should.equal(2);
                    result.get('cardOne').should.deep.equal(card);
                    result.get('cardTwo').should.deep.equal(cardOne);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreGetAll', sinon.match.func).yields(serializedError);
            return businessNetworkCardStore.getAll()
                .should.be.rejectedWith(TypeError, /such type error/);
        });
    });

    describe('#delete', () => {
        beforeEach(() => {
            mockSocket.on.withArgs('connect').returns();
            mockSocket.on.withArgs('disconnect').returns();
            businessNetworkCardStore = new ProxyBusinessNetworkCardStore();
            businessNetworkCardStore.connected = true;
        });

        it('should send a delete call to the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreDelete', cardName, sinon.match.func).yields(null);
            return businessNetworkCardStore.delete(cardName)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/businessNetworkCardStoreDelete', cardName, sinon.match.func);
                    sinon.assert.calledTwice(mockSocket.on);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/businessNetworkCardStoreDelete', cardName, sinon.match.func).yields(serializedError);
            return businessNetworkCardStore.delete(cardName)
                .should.be.rejectedWith(TypeError, /such type error/);
        });
    });
});
