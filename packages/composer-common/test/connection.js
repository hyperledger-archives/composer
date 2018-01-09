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

const BusinessNetworkDefinition = require('../lib/businessnetworkdefinition');
const Connection = require('../lib/connection');
const ConnectionManager = require('../lib/connectionmanager');
const SecurityContext = require('../lib/securitycontext');
const Util = require('../lib/util');
const Serializer = require('../lib/serializer');
const chai = require('chai');
const Factory = require('../lib/factory');
const Resource = require('../lib/model/resource');

chai.should();
chai.use(require('chai-as-promised'));

const sinon = require('sinon');

describe('Connection', () => {

    let mockConnectionManager;
    let mockSecurityContext;
    let mockBusinessNetworkDefinition;
    let connection;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        connection = new Connection(mockConnectionManager, 'devFabric1', 'org.acme.Business');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw if connection manager not specified', () => {
            (() => {
                new Connection(null, 'debFabric1', 'org.acme.Business');
            }).should.throw(/connectionManager not specified/);
        });

        it('should throw if connection profile not specified', () => {
            (() => {
                new Connection(mockConnectionManager, null, 'org.acme.Business');
            }).should.throw(/connectionProfile not specified/);
        });

        it('should set the connection manager', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            c.connectionManager.should.equal(mockConnectionManager);
        });

    });

    describe('#getConnectionManager', () => {

        it('should return the connection manager', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            c.getConnectionManager().should.equal(mockConnectionManager);
        });

    });

    describe('#getIdentifier', () => {

        it('should work with both profile and network', () => {
            let c = new Connection(mockConnectionManager, 'profile', 'network');
            c.getIdentifier().should.equal('network@profile');
        });

        it('should work with just profile', () => {
            let c = new Connection(mockConnectionManager, 'profile', null );
            c.getIdentifier().should.equal('profile');
        });

    });

    describe('#disconnect', () => {

        it('should call _disconnect and handle no error', () => {
            sinon.stub(connection, '_disconnect').yields(null);
            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledWith(connection._disconnect);
                });
        });

        it('should call _disconnect and handle an error', () => {
            sinon.stub(connection, '_disconnect').yields(new Error('error'));
            return connection.disconnect()
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._disconnect);
                });
        });

    });

    describe('#_disconnect', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._disconnect();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#login', () => {

        it('should call _login and handle no error', () => {
            sinon.stub(connection, '_login').yields(null, mockSecurityContext);
            return connection.login('id', 'secret')
                .should.eventually.be.equal(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledWith(connection._login, 'id', 'secret');
                });
        });

        it('should call _login and handle an error', () => {
            sinon.stub(connection, '_login').yields(new Error('error'));
            return connection.login('id', 'secret')
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._login, 'id', 'secret');
                });
        });

    });

    describe('#_login', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._login('id', 'secret');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#install', () => {

        it('should call _install and handle no error', () => {
            sinon.stub(connection, '_install').yields(null);
            return connection.install(mockSecurityContext, 'org-acme-biznet', { install: 'options' })
                .then(() => {
                    sinon.assert.calledWith(connection._install, mockSecurityContext, 'org-acme-biznet', { install: 'options' });
                });
        });

        it('should call _install and handle an error', () => {
            sinon.stub(connection, '_install').yields(new Error('error'));
            return connection.install(mockSecurityContext, 'org-acme-biznet', { install: 'options' })
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._install, mockSecurityContext, 'org-acme-biznet', { install: 'options' });
                });
        });

    });

    describe('#_install', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._install(mockSecurityContext, 'org-acme-biznet', { install: 'options' });
            }).should.throw(/abstract function called/);
        });

    });

    describe('#start', () => {

        it('should call _start and handle no error', () => {
            sinon.stub(connection, '_start').yields(null);
            return connection.start(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' })
                .then(() => {
                    sinon.assert.calledWith(connection._start, mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' });
                });
        });

        it('should call _start and handle an error', () => {
            sinon.stub(connection, '_start').yields(new Error('error'));
            return connection.start(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' })
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._start, mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' });
                });
        });

    });

    describe('#_start', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._start(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { start: 'options' });
            }).should.throw(/abstract function called/);
        });

    });

    describe('#deploy', () => {

        it('should call _deploy and handle no error', () => {
            sinon.stub(connection, '_deploy').yields(null);
            return connection.deploy(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { deploy: 'options' })
                .then(() => {
                    sinon.assert.calledWith(connection._deploy, mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { deploy: 'options' });
                });
        });

        it('should call _deploy and handle an error', () => {
            sinon.stub(connection, '_deploy').yields(new Error('error'));
            return connection.deploy(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { deploy: 'options' })
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._deploy, mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { deploy: 'options' });
                });
        });

    });

    describe('#_deploy', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._deploy(mockSecurityContext, 'org-acme-biznet', { $class: 'org.hyerledger.composer.system.StartBusinessNetwork' }, { deploy: 'options' });
            }).should.throw(/abstract function called/);
        });

    });

    describe('#reset', () => {

        it('should throw an error when no name given', ()=>{
            return connection.reset(mockSecurityContext).should.eventually.be.rejectedWith(/not specified/);
        });
        it('should handle wrong network name data', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            return connection.reset(mockSecurityContext,'wrong-network')
                    .should.eventually.be.rejectedWith(/Incorrect Business Network Identifier/);

        });
        it('should handle valid data', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            return connection.reset(mockSecurityContext,'acme-network')
                    .then(()=>{
                        sinon.assert.called(Util.invokeChainCode);
                        sinon.assert.called(Util.queryChainCode);
                    });

        });

        it('should handle valid data', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockTransaction.getIdentifier.returns(null);
            mockTransaction.timestamp=new Date();

            return connection.reset(mockSecurityContext,'acme-network')
                    .then(()=>{
                        sinon.assert.called(Util.invokeChainCode);
                        sinon.assert.called(Util.queryChainCode);
                    });

        });

    });

    describe('#update', () => {

        it('should reject if no network defn given',()=>{
            (()=>{
                connection.update(mockSecurityContext,null);
            }).should.throw(/business network definition not specified/);
        });

        it('should handle valid data', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            return connection.update(mockSecurityContext, mockBusinessNetworkDefinition)
            .then(()=>{
                sinon.assert.called(Util.invokeChainCode);
                sinon.assert.called(Util.queryChainCode);
                sinon.assert.calledWith(mockBusinessNetworkDefinition.toArchive, { date: new Date(545184000000) });
            });

        });

        it('should handle valid data minus tx id and with a hardcoded timestamp', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns(null);
            mockTransaction.timestamp='the epoch';

            return connection.update(mockSecurityContext, mockBusinessNetworkDefinition)
            .then(()=>{
                sinon.assert.called(Util.invokeChainCode);
                sinon.assert.called(Util.queryChainCode);
                sinon.assert.calledWith(mockBusinessNetworkDefinition.toArchive, { date: new Date(545184000000) });
            });

        });

    });

    describe('#upgrade', () => {

        it('should call _upgrade and handle no error', () => {
            sinon.stub(connection, '_upgrade').yields(null);
            return connection.upgrade(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledWith(connection._upgrade, mockSecurityContext);
                });
        });

        it('should call _upgrade and handle an error', () => {
            sinon.stub(connection, '_upgrade').yields(new Error('error'));
            return connection.upgrade(mockSecurityContext)
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._upgrade, mockSecurityContext);
                });
        });

    });

    describe('#_upgrade', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._upgrade(mockSecurityContext);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#undeploy', () => {

        it('should call _undeploy and handle no error', () => {
            sinon.stub(connection, '_undeploy').yields(null);
            return connection.undeploy(mockSecurityContext, 'org-acme-biznet')
                .then(() => {
                    sinon.assert.calledWith(connection._undeploy, mockSecurityContext, 'org-acme-biznet');
                });
        });

        it('should call _undeploy and handle an error', () => {
            sinon.stub(connection, '_undeploy').yields(new Error('error'));
            return connection.undeploy(mockSecurityContext, 'org-acme-biznet')
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._undeploy, mockSecurityContext), 'org-acme-biznet';
                });
        });

    });

    describe('#_undeploy', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._undeploy(mockSecurityContext, 'org-acme-biznet');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#ping', () => {

        it('should call _ping and handle no error', () => {
            sinon.stub(connection, '_ping').yields(null, { ping: 'result' });
            return connection.ping(mockSecurityContext)
                .should.eventually.be.deep.equal({ ping: 'result' })
                .then(() => {
                    sinon.assert.calledWith(connection._ping, mockSecurityContext);
                });
        });

        it('should call _ping and handle an error', () => {
            sinon.stub(connection, '_ping').yields(new Error('error'));
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._ping, mockSecurityContext);
                });
        });

    });

    describe('#_ping', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._ping(mockSecurityContext);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#queryChainCode', () => {

        it('should call _queryChainCode and handle no error', () => {
            sinon.stub(connection, '_queryChainCode').yields(null, { queryChainCode: 'result' });
            return connection.queryChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .should.eventually.be.deep.equal({ queryChainCode: 'result' })
                .then(() => {
                    sinon.assert.calledWith(connection._queryChainCode, mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
                });
        });

        it('should call _queryChainCode and handle an error', () => {
            sinon.stub(connection, '_queryChainCode').yields(new Error('error'));
            return connection.queryChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._queryChainCode, mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
                });
        });

    });

    describe('#_queryChainCode', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._queryChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#invokeChainCode', () => {

        it('should call _invokeChainCode and handle no error', () => {
            sinon.stub(connection, '_invokeChainCode').yields(null);
            return connection.invokeChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .then(() => {
                    sinon.assert.calledWith(connection._invokeChainCode, mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
                });
        });

        it('should call _invokeChainCode and handle an error', () => {
            sinon.stub(connection, '_invokeChainCode').yields(new Error('error'));
            return connection.invokeChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ])
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._invokeChainCode, mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
                });
        });

    });

    describe('#_invokeChainCode', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._invokeChainCode(mockSecurityContext, 'fcn', [ 'arg1', 'arg2', 'arg3' ]);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#createIdentity', () => {

        it('should call _createIdentity and handle no error', () => {
            sinon.stub(connection, '_createIdentity').yields(null, { createIdentity: 'result' });
            return connection.createIdentity(mockSecurityContext, 'user id', { createIdentity: 'options' })
                .should.eventually.be.deep.equal({ createIdentity: 'result' })
                .then(() => {
                    sinon.assert.calledWith(connection._createIdentity, mockSecurityContext, 'user id', { createIdentity: 'options' });
                });
        });

        it('should call _createIdentity and handle an error', () => {
            sinon.stub(connection, '_createIdentity').yields(new Error('error'));
            return connection.createIdentity(mockSecurityContext, 'user id', { createIdentity: 'options' })
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._createIdentity, mockSecurityContext, 'user id', { createIdentity: 'options' });
                });
        });

    });

    describe('#_createIdentity', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._createIdentity(mockSecurityContext, 'user id', { createIdentity: 'options' });
            }).should.throw(/abstract function called/);
        });

    });

    describe('#list', () => {

        it('should call _list and handle no error', () => {
            sinon.stub(connection, '_list').yields(null, [ 'biznet1', 'biznet2', 'biznet3' ]);
            return connection.list(mockSecurityContext)
                .should.eventually.be.deep.equal([ 'biznet1', 'biznet2', 'biznet3' ])
                .then(() => {
                    sinon.assert.calledWith(connection._list, mockSecurityContext);
                });
        });

        it('should call _list and handle an error', () => {
            sinon.stub(connection, '_list').yields(new Error('error'));
            return connection.list(mockSecurityContext)
                .should.be.rejectedWith(/error/)
                .then(() => {
                    sinon.assert.calledWith(connection._list, mockSecurityContext);
                });
        });

    });

    describe('#_list', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._list(mockSecurityContext);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#createTransactionId', () => {

        it('should call _createTransactionId and handle no error', () => {
            sinon.stub(connection, '_createTransactionId').yields(null,['5d5s6s78d7f6']);
            return connection.createTransactionId(mockSecurityContext)
                        .should.eventually.be.deep.equal(['5d5s6s78d7f6'])
                        .then(() => {
                            sinon.assert.calledWith(connection._createTransactionId, mockSecurityContext);
                        });
        });

        it('should call _createTransactionId and handle an error', () => {
            sinon.stub(connection, '_createTransactionId').yields(new Error('error'));
            return connection.createTransactionId(mockSecurityContext)
                        .should.be.rejectedWith(/error/)
                        .then(() => {
                            sinon.assert.calledWith(connection._createTransactionId, mockSecurityContext);
                        });
        });

    });

    describe('#_createTransactionId', () => {

        it('should throw as abstract method', () => {
            (() => {
                connection._createTransactionId(mockSecurityContext);
            }).should.throw(/abstract function called/);
        });

    });

    describe('#setLogLevel', () => {

        it('should throw an error when no loglevel given', ()=>{
            return connection.setLogLevel(mockSecurityContext).should.eventually.be.rejectedWith(/not specified/);
        });
        it('should handle setting to a new level', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns('txid');

            return connection.setLogLevel(mockSecurityContext,'debug');


        });
        it('should handle setting to a new level - alternate paths', () => {
            const buffer = Buffer.from(JSON.stringify({
                data: 'aGVsbG8='
            }));

            const buffer2 = Buffer.from(JSON.stringify({
                data: 'aGsad33VsbG8='
            }));
            sandbox.stub(Util, 'queryChainCode').withArgs(mockSecurityContext, 'getBusinessNetwork', []).resolves(buffer);
            sandbox.stub(Util, 'invokeChainCode').resolves();
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
            mockBusinessNetworkDefinition.toArchive.resolves(buffer2);
            let mockFactory = sinon.createStubInstance(Factory);
            let mockSerializer = sinon.createStubInstance(Serializer);
            let mockTransaction = sinon.createStubInstance(Resource);

            mockFactory.newTransaction.returns(mockTransaction);
            mockBusinessNetworkDefinition.getFactory.returns(mockFactory);
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockBusinessNetworkDefinition.getName.returns('acme-network');
            mockSerializer.toJSON.returns({key:'value'});
            mockTransaction.getIdentifier.returns(null);
            mockTransaction.timestamp = new Date();

            return connection.setLogLevel(mockSecurityContext,'debug');


        });
    });
});
