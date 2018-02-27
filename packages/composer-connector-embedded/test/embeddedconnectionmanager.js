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

        it('should store a new identity', async () => {
            sandbox.stub(uuid, 'v4').returns('f892c30a-7799-4eac-8377-06da53600e5');
            mockIdentitiesDataCollection.add.withArgs('doge').resolves();
            await connectionManager.importIdentity('devFabric1', { connect: 'options' }, 'doge', testCertificate, testPrivateKey);
            sinon.assert.calledTwice(mockIdentitiesDataCollection.add);
            const adminIdentityIdentifier = mockIdentitiesDataCollection.add.getCall(1).args[0];
            const adminIdentity1 = mockIdentitiesDataCollection.add.getCall(0).args[1];
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
            const adminIdentity2 = mockIdentitiesDataCollection.add.getCall(1).args[1];
            adminIdentity1.should.deep.equal(adminIdentity2);
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

        it('should just return', () => {
            return connectionManager.removeIdentity('devFabric1', { connect: 'options' }, 'doge')
                .should.eventually.be.resolved;
        });
    });

    describe('#connect', () => {

        it('should return a new connection', () => {
            return connectionManager.connect('devFabric1', 'org.acme.Business', {})
                .should.eventually.be.an.instanceOf(Connection);
        });

    });

});
