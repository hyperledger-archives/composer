/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Connection = require('../lib/connection');
const ConnectionManager = require('../lib/connectionmanager');

require('chai').should();
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
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#login', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.login()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#deploy', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.deploy()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#ping', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.ping()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#queryChainCode', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.queryChainCode()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#invokeChainCode', () => {

        it('should throw as abstract method', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            return c.invokeChainCode()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let c = new Connection(mockConnectionManager, 'debFabric1', 'org.acme.Business');
            c.toJSON().should.deep.equal({});
        });

    });

});
