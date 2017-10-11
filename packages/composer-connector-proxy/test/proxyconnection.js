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

const ConnectionManager = require('composer-common').ConnectionManager;
const ProxyConnection = require('../lib/proxyconnection');
const ProxySecurityContext = require('../lib/proxysecuritycontext');
const serializerr = require('serializerr');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('ProxyConnection', () => {

    const connectionProfile = 'defaultProfile';
    const businessNetworkIdentifier = 'org-acme-biznet';
    const connectionID = '3d382385-47a5-4be9-99b0-6b10166b9497';
    const enrollmentID = 'alice1';this;
    const enrollmentSecret = 'suchs3cret';
    const securityContextID = '9d05d73e-81bf-4d8a-a874-4b561670432e';
    const serializedError = serializerr(new TypeError('such type error'));

    let mockConnectionManager;
    let mockSocket;
    let connection;
    let mockSecurityContext;

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSocket = {
            emit: sinon.stub(),
            removeListener: sinon.stub()
        };
        mockSocket.emit.throws(new Error('unexpected call'));
        connection = new ProxyConnection(mockConnectionManager, connectionProfile, businessNetworkIdentifier, mockSocket, connectionID);
        mockSecurityContext = new ProxySecurityContext(connection, enrollmentID, securityContextID);
    });

    describe('#disconnect', () => {

        it('should send a disconnect call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionDisconnect', connectionID, sinon.match.func).yields(null);
            return connection.disconnect()
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionDisconnect', connectionID, sinon.match.func);
                    mockSocket.removeListener.withArgs('events', sinon.match.func).yield();
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionDisconnect', connectionID, sinon.match.func).yields(serializedError);
            return connection.disconnect()
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#login', () => {

        it('should send a login call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionLogin', connectionID, enrollmentID, enrollmentSecret, sinon.match.func).yields(null, securityContextID);
            return connection.login(enrollmentID, enrollmentSecret)
                .then((securityContext) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionLogin', connectionID, enrollmentID, enrollmentSecret, sinon.match.func);
                    securityContext.should.be.an.instanceOf(ProxySecurityContext);
                    securityContext.getUser().should.equal(enrollmentID);
                    securityContext.getSecurityContextID().should.equal(securityContextID);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionLogin', connectionID, enrollmentID, enrollmentSecret, sinon.match.func).yields(serializedError);
            return connection.login(enrollmentID, enrollmentSecret)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#install', () => {

        it('should send a install call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionInstall', connectionID, securityContextID, 'org-acme-biznet', undefined, sinon.match.func).yields(null);
            return connection.install(mockSecurityContext, businessNetworkIdentifier)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionInstall', connectionID, securityContextID, 'org-acme-biznet', undefined, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionInstall', connectionID, securityContextID, 'org-acme-biznet', undefined, sinon.match.func).yields(serializedError);
            return connection.install(mockSecurityContext, businessNetworkIdentifier)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });


    describe('#start', () => {

        it('should send a start call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionStart', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func).yields(null);
            return connection.start(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', { opt: 1 })
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionStart', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionStart', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func).yields(serializedError);
            return connection.start(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', { opt: 1 })
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });


    describe('#deploy', () => {

        it('should send a deploy call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionDeploy', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func).yields(null);
            return connection.deploy(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', { opt: 1 })
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionDeploy', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionDeploy', connectionID, securityContextID, 'org-acme-biznet', '{"start":"json"}', { opt: 1 }, sinon.match.func).yields(serializedError);
            return connection.deploy(mockSecurityContext, 'org-acme-biznet', '{"start":"json"}', { opt: 1 })
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });



    describe('#undeploy', () => {

        it('should send a undeploy call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionUndeploy', connectionID, securityContextID, businessNetworkIdentifier, sinon.match.func).yields(null);
            return connection.undeploy(mockSecurityContext, businessNetworkIdentifier)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionUndeploy', connectionID, securityContextID, businessNetworkIdentifier, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionUndeploy', connectionID, securityContextID, businessNetworkIdentifier, sinon.match.func).yields(serializedError);
            return connection.undeploy(mockSecurityContext, businessNetworkIdentifier)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#ping', () => {

        it('should send a ping call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionPing', connectionID, securityContextID, sinon.match.func).yields(null);
            return connection.ping(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionPing', connectionID, securityContextID, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionPing', connectionID, securityContextID, sinon.match.func).yields(serializedError);
            return connection.ping(mockSecurityContext)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#queryChainCode', () => {

        const functionName = 'func1';
        const args = [ 'arg1', 'arg2', 'arg3' ];

        it('should send a queryChainCode call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionQueryChainCode', connectionID, securityContextID, functionName, args, sinon.match.func).yields(null, 'hello world');
            return connection.queryChainCode(mockSecurityContext, functionName, args)
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionQueryChainCode', connectionID, securityContextID, functionName, args, sinon.match.func);
                    Buffer.isBuffer(result).should.be.true;
                    Buffer.from('hello world').compare(result).should.equal(0);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionQueryChainCode', connectionID, securityContextID, functionName, args, sinon.match.func).yields(serializedError);
            return connection.queryChainCode(mockSecurityContext, functionName, args)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#invokeChainCode', () => {

        const functionName = 'func1';
        const args = [ 'arg1', 'arg2', 'arg3' ];

        it('should send a invokeChainCode call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionInvokeChainCode', connectionID, securityContextID, functionName, args, sinon.match.func).yields(null);
            return connection.invokeChainCode(mockSecurityContext, functionName, args)
                .then(() => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionInvokeChainCode', connectionID, securityContextID, functionName, args, sinon.match.func);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionInvokeChainCode', connectionID, securityContextID, functionName, args, sinon.match.func).yields(serializedError);
            return connection.invokeChainCode(mockSecurityContext, functionName, args)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#createIdentity', () => {

        const userID = 'bob1';
        const options = {
            something: 'something',
            dark: 'side'
        };

        it('should send a createIdentity call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionCreateIdentity', connectionID, securityContextID, userID, options, sinon.match.func).yields(null, {
                userID: userID,
                userSecret: 'w0ws3cret'
            });
            return connection.createIdentity(mockSecurityContext, userID, options)
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionCreateIdentity', connectionID, securityContextID, userID, options, sinon.match.func);
                    result.should.deep.equal({
                        userID: userID,
                        userSecret: 'w0ws3cret'
                    });
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionCreateIdentity', connectionID, securityContextID, userID, options, sinon.match.func).yields(serializedError);
            return connection.createIdentity(mockSecurityContext, userID, options)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#list', () => {

        it('should send a list call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionList', connectionID, securityContextID, sinon.match.func).yields(null, ['org-acme-biznet1', 'org-acme-biznet2']);
            return connection.list(mockSecurityContext)
                .then((result) => {
                    sinon.assert.calledOnce(mockSocket.emit);
                    sinon.assert.calledWith(mockSocket.emit, '/api/connectionList', connectionID, securityContextID, sinon.match.func);
                    result.should.deep.equal(['org-acme-biznet1', 'org-acme-biznet2']);
                });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionList', connectionID, securityContextID, sinon.match.func).yields(serializedError);
            return connection.list(mockSecurityContext)
                .should.be.rejectedWith(TypeError, /such type error/);
        });

    });

    describe('#createTransactionId', () => {

        it('should send a list call to the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionCreateTransactionId', connectionID, securityContextID, sinon.match.func).yields(null, ['32']);
            return connection.createTransactionId(mockSecurityContext)
                        .then((result) => {
                            sinon.assert.calledOnce(mockSocket.emit);
                            sinon.assert.calledWith(mockSocket.emit, '/api/connectionCreateTransactionId', connectionID, securityContextID, sinon.match.func);
                            result.should.deep.equal(['32']);
                        });
        });

        it('should handle an error from the connector server', () => {
            mockSocket.emit.withArgs('/api/connectionCreateTransactionId', connectionID, securityContextID, sinon.match.func).yields(serializedError);
            return connection.createTransactionId(mockSecurityContext)
                        .should.be.rejectedWith(TypeError, /such type error/);
        });

    });
});
