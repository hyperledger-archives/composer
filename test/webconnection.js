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

const Connection = require('@ibm/ibm-concerto-common').Connection;
const ConnectionManager = require('@ibm/ibm-concerto-common').ConnectionManager;
const Container = require('@ibm/ibm-concerto-runtime').Container;
const Context = require('@ibm/ibm-concerto-runtime').Context;
const Engine = require('@ibm/ibm-concerto-runtime').Engine;
const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;
const WebConnection = require('../lib/webconnection');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('WebConnection', () => {

    let mockConnectionManager;
    let mockSecurityContext;
    let connection;

    beforeEach(() => {
        mockConnectionManager = sinon.createStubInstance(ConnectionManager);
        mockSecurityContext = sinon.createStubInstance(SecurityContext);
        connection = new WebConnection(mockConnectionManager);
    });

    describe('#constructor', () => {

        it('should construct a new connection', () => {
            connection.should.be.an.instanceOf(Connection);
            connection.container.should.be.an.instanceOf(Container);
            connection.engine.should.be.an.instanceOf(Engine);
        });

    });

    describe('#disconnect', () => {

        it('should disconnect', () => {
            return connection.disconnect()
                .then(() => {
                    should.equal(connection.container, null);
                    should.equal(connection.engine, null);
                });
        });

    });

    describe('#login', () => {

        it('should return a new security context', () => {
            return connection.login('doge', 'suchs3cret')
                .should.eventually.be.an.instanceOf(SecurityContext);
        });

    });

    describe('#deploy', () => {

        it('should call the init engine method and ping', () => {
            sinon.stub(connection.engine, 'init').resolves();
            sinon.stub(connection, 'ping').resolves();
            return connection.deploy(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(connection.engine.init);
                    sinon.assert.calledWith(connection.engine.init, sinon.match.instanceOf(Context), 'init', []);
                    sinon.assert.calledOnce(connection.ping);
                });
        });

    });

    describe('#ping', () => {

        it('should submit a ping query request', () => {
            sinon.stub(connection, 'queryChainCode').resolves();
            return connection.ping(mockSecurityContext)
                .then(() => {
                    sinon.assert.calledOnce(connection.queryChainCode);
                    sinon.assert.calledWith(connection.queryChainCode, mockSecurityContext, 'ping', []);
                });
        });

    });

    describe('#queryChainCode', () => {

        it('should call the engine query method', () => {
            sinon.stub(connection.engine, 'query').resolves({ test: 'data from engine' });
            return connection.queryChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(connection.engine.query);
                    sinon.assert.calledWith(connection.engine.query, sinon.match.instanceOf(Context), 'testFunction', ['arg1', 'arg2']);
                    result.should.be.an.instanceOf(Buffer);
                    JSON.parse(result.toString()).should.deep.equal({ test: 'data from engine' });
                });
        });

    });

    describe('#invokeChainCode', () => {

        it('should call the engine invoke method', () => {
            sinon.stub(connection.engine, 'invoke').resolves({ test: 'data from engine' });
            return connection.invokeChainCode(mockSecurityContext, 'testFunction', ['arg1', 'arg2'])
                .then((result) => {
                    sinon.assert.calledOnce(connection.engine.invoke);
                    sinon.assert.calledWith(connection.engine.invoke, sinon.match.instanceOf(Context), 'testFunction', ['arg1', 'arg2']);
                    should.equal(result, undefined);
                });
        });

    });

});
