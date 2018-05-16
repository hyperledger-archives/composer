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

const { Certificate, CertificateUtil, Connection, ConnectionManager, ConnectionProfileManager } = require('composer-common');
const DataCollection = require('composer-runtime').DataCollection;
const EmbeddedConnectionManager = require('..');
const uuid = require('uuid');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('EmbeddedConnectionManager', () => {

    let testCertificate, testPrivateKey;
    let mockConnectionProfileManager;
    let connectionManager;
    let sandbox;

    beforeEach(() => {
        mockConnectionProfileManager = sinon.createStubInstance(ConnectionProfileManager);
        connectionManager = new EmbeddedConnectionManager(mockConnectionProfileManager);
        ({ certificate: testCertificate, privateKey: testPrivateKey} = CertificateUtil.generate({ commonName: 'doge' }));
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

        it('should store a new identity if the identity does not exist', async () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            await connectionManager.importIdentity('devFabric1', { connect: 'options' }, 'doge', testCertificate, testPrivateKey);
            sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
            //const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
            const adminIdentityIdentifier = adminIdentity1.identifier;
            const certificateObj = new Certificate(adminIdentity1.certificate);
            certificateObj.getIdentifier().should.equal(adminIdentityIdentifier);
            certificateObj.getIssuer().should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            certificateObj.getName().should.equal('doge');
            certificateObj.getPublicKey().should.be.a('string');
            adminIdentity1.identifier.should.equal(adminIdentityIdentifier);
            adminIdentity1.issuer.should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            adminIdentity1.name.should.equal('doge');
            adminIdentity1.secret.should.equal('f892c30a');
            adminIdentity1.imported.should.be.true;
            //const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            //adminIdentity1.should.deep.equal(adminIdentity2);
        });

        it('should replace existing identity with new identity if the identity exists', async () => {
            //sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.exists.withArgs('doge').resolves(true);
            mockIdentitiesDataCollection.get.withArgs('doge').resolves({secret: 'orgSecret'});
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();

            await connectionManager.importIdentity('devFabric1', { connect: 'options' }, 'doge', testCertificate, testPrivateKey);
            sinon.assert.calledOnce(mockIdentitiesDataCollection.remove);
            sinon.assert.calledWith(mockIdentitiesDataCollection.remove, 'doge');

            sinon.assert.calledOnce(mockIdentitiesDataCollection.add);
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
            //const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            //const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            //adminIdentity1.should.deep.equal(adminIdentity2);
            const adminIdentityIdentifier = adminIdentity1.identifier;
            const certificateObj = new Certificate(adminIdentity1.certificate);
            certificateObj.getIdentifier().should.equal(adminIdentityIdentifier);
            certificateObj.getIssuer().should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            certificateObj.getName().should.equal('doge');
            certificateObj.getPublicKey().should.be.a('string');
            adminIdentity1.identifier.should.equal(adminIdentityIdentifier);
            adminIdentity1.issuer.should.equal('a3e3a2d42f1c55e1485c4d06ba8b5c64f83f697939346687b32bacaae5e38c8f');
            adminIdentity1.name.should.equal('doge');
            adminIdentity1.secret.should.equal('orgSecret');
            adminIdentity1.imported.should.be.true;
        });


    });

    describe('#exportIdentity', function() {
        let mockIdentitiesDataCollection;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connectionManager.dataService, 'ensureCollection').resolves(mockIdentitiesDataCollection);
        });

        it('retrieve imported credentials', function() {
            const identity = {
                name: 'ID',
                imported: true,
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

        it('should return null for non imported credentials', function() {
            const identity = {
                name: 'ID',
                imported: false,
                certificate: testCertificate,
                privateKey: testPrivateKey
            };
            mockIdentitiesDataCollection.exists.withArgs(identity.name).resolves(true);
            mockIdentitiesDataCollection.get.withArgs(identity.name).resolves(identity);
            return connectionManager.exportIdentity('devFabric1', { connect: 'options' }, identity.name)
                .should.eventually.be.null;
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
        let mockIdentitiesDataCollection, notImportedIdentity, importedIdentity;

        beforeEach(() => {
            mockIdentitiesDataCollection = sinon.createStubInstance(DataCollection);
            sinon.stub(connectionManager.dataService, 'ensureCollection').resolves(mockIdentitiesDataCollection);
            importedIdentity = {
                identifier: 'ae360f8a430cc34deb2a8901ef3efed7a2eed753d909032a009f6984607be65a',
                name: 'bob1',
                issuer: 'ce295bc0df46512670144b84af55f3d9a3e71b569b1e38baba3f032dc3000665',
                secret: 'suchsecret',
                certificate: '',
                imported: true,
                options: {
                    issuer: true
                }
            };
            notImportedIdentity = {};
            Object.assign(notImportedIdentity, importedIdentity);
            notImportedIdentity.imported = false;

        });

        it('should simulate removal by marking as not imported if imported', async () => {
            mockIdentitiesDataCollection.get.resolves(importedIdentity);
            mockIdentitiesDataCollection.exists.resolves(true);
            const result = await connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge');
            result.should.be.true;
            sinon.assert.calledOnce(mockIdentitiesDataCollection.update);
            sinon.assert.calledWith(mockIdentitiesDataCollection.update.firstCall, 'doge', notImportedIdentity);
            //sinon.assert.calledWith(mockIdentitiesDataCollection.update.secondCall, notImportedIdentity.identifier, notImportedIdentity);
        });

        it('should do nothing if identity not imported', async () => {
            mockIdentitiesDataCollection.get.resolves(notImportedIdentity);
            mockIdentitiesDataCollection.exists.resolves(true);
            const result = await connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge');
            result.should.be.false;
            sinon.assert.notCalled(mockIdentitiesDataCollection.update);
        });

        it('should do nothing if identity not found', async () => {
            mockIdentitiesDataCollection.exists.resolves(false);
            const result = await connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge');
            result.should.be.false;
            sinon.assert.notCalled(mockIdentitiesDataCollection.update);
        });

    });

    describe('#connect', () => {

        it('should return a new connection', () => {
            return connectionManager.connect('devFabric1', 'org.acme.Business', {})
                .should.eventually.be.an.instanceOf(Connection);
        });

    });

});
