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

const Connection = require('composer-common').Connection;
const ConnectionManager = require('composer-common').ConnectionManager;
const ConnectionProfileManager = require('composer-common').ConnectionProfileManager;
const DataCollection = require('composer-runtime').DataCollection;
const uuid = require('uuid');
const WebConnectionManager = require('..');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('WebConnectionManager', () => {
    const testCertificate =
        '----- BEGIN CERTIFICATE -----\n' +
        'ZG9nZTpmODkyYzMwYS03Nzk5LTRlYWMtODM3Ny0wNmRhNTM2MDBlNQ==\n' +
        '----- END CERTIFICATE -----\n';
    const testPrivateKey =
        '-----BEGIN PRIVATE KEY-----\n' +
        Buffer.from('FAKE_PRIVATE_KEY').toString('base64') + '\n' +
        '-----END PRIVATE KEY-----\n';

    let mockConnectionProfileManager;
    let connectionManager;
    let sandbox;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        connectionManager = new WebConnectionManager(mockConnectionProfileManager);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should construct a new connection manager', () => {
            connectionManager.should.be.an.instanceOf(ConnectionManager);
        });

    });

    describe('#importIdentity', () => {
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connectionManager.dataService, 'ensureCollection').resolves(mockIdentitiesDataCollection);
        });

        it('should store a new identity', () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            return connectionManager.importIdentity('devFabric1', { connect: 'options' }, 'doge', testCertificate, testPrivateKey)
                .then(() => {
                    sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.add, 'doge', {
                        certificate: testCertificate,
                        identifier: '7f8069f60a72d71838d8dd7259a8910ebaf4c27a0638fb6e5f05aba959dd8d9a',
                        issuer: '89e0c13fa652f52d91fc90d568b70070d6ed1a59c5d9f452dfb1b2a199b1928e',
                        name: 'doge',
                        secret: 'f892c30a',
                        privateKey: testPrivateKey,
                        imported: true
                    });
                });
        });

    });

    describe('#exportIdentity', function() {
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connectionManager.dataService, 'ensureCollection').resolves(mockIdentitiesDataCollection);
        });

        it('retrieve stored credentials', function() {
            const identity = {
                name: 'ID',
                certificate: testCertificate,
                privateKey: testPrivateKey
            };
            mockIdentitiesDataCollection.exists.withArgs(identity.name).resolves(true);
            mockIdentitiesDataCollection.get.withArgs(identity.name).resolves(identity);
            return connectionManager.exportIdentity('devFabric1', { connect: 'options' }, identity.name)
                .should.become({
                    certificate: testCertificate,
                    privateKey: testPrivateKey
                });
        });

        it('generate dummy private key if none present', function() {
            const identity = {
                name: 'ID',
                certificate: testCertificate,
            };
            mockIdentitiesDataCollection.exists.withArgs(identity.name).resolves(true);
            mockIdentitiesDataCollection.get.withArgs(identity.name).resolves(identity);
            return connectionManager.exportIdentity('devFabric1', { connect: 'options' }, identity.name)
                .then((credentials) => {
                    credentials.should.have.all.keys('certificate', 'privateKey');
                    credentials.privateKey.should.be.a('String').that.is.not.empty;
                });
        });

        it('return null for non-existent identity', function() {
            const identity = 'conga';
            mockIdentitiesDataCollection.exists.withArgs(identity).resolves(false);
            mockIdentitiesDataCollection.get.withArgs(identity).rejects(new Error('nothing to get'));
            return connectionManager.exportIdentity('devFabric1', { connect: 'options' }, identity)
                .should.eventually.be.null;
        });

        it('return an error for non-existent identity that it thinks exists', function() {
            const identity = 'conga';
            mockIdentitiesDataCollection.exists.withArgs(identity).resolves(true);
            mockIdentitiesDataCollection.get.withArgs(identity).rejects(new Error('nothing to get'));

            return connectionManager.exportIdentity('devFabric1', { connect: 'options' }, identity)
                .should.be.rejectedWith(/nothing to get/);
        });

    });

    describe('#removeIdentity', () => {
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connectionManager.dataService, 'ensureCollection').resolves(mockIdentitiesDataCollection);
        });

        it('should remove an existing identity', () => {
            mockIdentitiesDataCollection.remove.withArgs('doge').resolves();
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            return connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge')
                .then((removed) => {
                    sinon.assert.calledOnce(mockIdentitiesDataCollection.exists);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.exists, 'doge');
                    sinon.assert.calledOnce(mockIdentitiesDataCollection.remove);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.remove, 'doge');
                    removed.should.be.true;
                });
        });

        it('should do nothing if identity doesn\'t exist', () => {
            mockIdentitiesDataCollection.remove.withArgs('doge').resolves();
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(false);
            return connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge')
                .then((removed) => {
                    sinon.assert.calledOnce(mockIdentitiesDataCollection.exists);
                    sinon.assert.calledWith(mockIdentitiesDataCollection.exists, 'doge');
                    sinon.assert.notCalled(mockIdentitiesDataCollection.remove);
                    removed.should.be.false;
                });
        });

        it('should throw an error if exists throws an error', () => {
            mockIdentitiesDataCollection.remove.withArgs('doge').resolves();
            mockIdentitiesDataCollection.exists.withArgs('doge').rejects(new Error('exists error'));
            return connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge')
                .should.eventually.be.rejectedWith(/exists error/);
        });

        it('should throw an error if remove throws an error', () => {
            mockIdentitiesDataCollection.remove.withArgs('doge').rejects(new Error('exists error'));
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            return connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge')
                .should.eventually.be.rejectedWith(/exists error/);
        });

    });


    describe('#connect', () => {

        it('should return a new connection', () => {
            return connectionManager.connect('devFabric1', 'org.acme.Business', {})
                .should.eventually.be.an.instanceOf(Connection);
        });

    });

});
