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

const ConnectionProfileManager = require('../lib/connectionprofilemanager');
const ConnectionProfileStore = require('../lib/connectionprofilestore');
const ConnectionManager = require('../lib/connectionmanager');
const Connection = require('../lib/connection');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');

describe('ConnectionProfileManager', () => {

    beforeEach(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    });

    afterEach(() => {
        mockery.deregisterAll();
        ConnectionProfileManager.removeAllConnectionManagers();
    });

    describe('#constructor', () => {

        it('should throw if no connection profile store', () => {

            (() => {
                let cpm = new ConnectionProfileManager(null);
                cpm.should.be.null;
            }).should.throw(/Must create ConnectionProfileManager/);
        });

        it('should be able to get connection profile store', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.getConnectionProfileStore().should.deep.equal(store);
        });
    });

    describe('#addConnectionManager', () => {

        it('should be able to set then get connection manager associated with a type', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.getConnectionManager( 'baz' )
            .then((result) => {
                result.should.equal(connectionManager);
            });
        });
    });

    describe('#getConnectionManager', () => {

        it('should throw if no connection manager available', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.be.rejectedWith(/Failed to load connector module/);
        });

        it('should dynamically load the connection manager', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            mockery.registerMock('composer-connector-foo', TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

        it('should use a registered connection manager', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            ConnectionProfileManager.registerConnectionManager('foo', TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

        it('should dynamically load the connection manager from a registered connection manager module', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            const module = {
                require: sinon.stub()
            };
            module.require.withArgs('composer-connector-foo').returns(TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            ConnectionProfileManager.registerConnectionManagerLoader(module);
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

        it('should handle an error loading the connection manager from a registered connection manager module', () => {
            /** test class */
            class TestConnectionManager extends ConnectionManager { }
            const module = {
                require: sinon.stub()
            };
            const module2 = {
                require: sinon.stub()
            };
            module.require.withArgs('composer-connector-foo').throws(new Error('such error'));
            module2.require.withArgs('composer-connector-foo').returns(TestConnectionManager);
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            ConnectionProfileManager.registerConnectionManagerLoader(module);
            ConnectionProfileManager.registerConnectionManagerLoader(module2);
            return cpm.getConnectionManager( 'baz' ).should.eventually.be.an.instanceOf(TestConnectionManager);
        });

    });

    describe('#connect', () => {

        it('should call connect on connection manager', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data'};
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            const stubConnection = sinon.createStubInstance(Connection);
            connectionManager.connect.returns(stubConnection);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.connect( 'foo', 'myNetwork' )
            .then((connection) => {
                connection.should.equal(stubConnection);
                sinon.assert.calledOnce(connectionManager.connect);
                sinon.assert.calledWith(connectionManager.connect, 'foo', 'myNetwork', {type: 'foo', data : 'data' });
            });
        });

        it('should call connect on connection manager applying any additional options', () => {
            const store = sinon.createStubInstance(ConnectionProfileStore);
            const profile = {type: 'foo', data : 'data', overrideMe: 'please' };
            store.load.returns( Promise.resolve(profile) );
            const connectionManager = sinon.createStubInstance(ConnectionManager);
            const stubConnection = sinon.createStubInstance(Connection);
            connectionManager.connect.returns(stubConnection);
            let cpm = new ConnectionProfileManager(store);
            cpm.should.not.be.null;
            cpm.addConnectionManager( 'foo', connectionManager);
            return cpm.connect( 'foo', 'myNetwork', { overrideMe: 'sure thing' } )
            .then((connection) => {
                connection.should.equal(stubConnection);
                sinon.assert.calledOnce(connectionManager.connect);
                sinon.assert.calledWith(connectionManager.connect, 'foo', 'myNetwork', {type: 'foo', data : 'data', overrideMe: 'sure thing' });
            });
        });

    });

});
