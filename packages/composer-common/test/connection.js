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

const Connection = require('../lib/connection');
const ConnectionManager = require('../lib/connectionmanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const sinon = require('sinon');

describe('Connection', () => {

    let mockConnectionManager;

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
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

    describe('#disconnect', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.disconnect()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#login', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.login()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#deploy', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.deploy()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#undeploy', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.undeploy()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#update', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.update()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#ping', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.ping()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#queryChainCode', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.queryChainCode()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#invokeChainCode', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.invokeChainCode()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#createIdentity', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.createIdentity()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#list', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.list()
                .should.be.rejectedWith(/abstract function called/);
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

});
