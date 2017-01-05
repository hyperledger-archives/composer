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
const SecurityContext = require('../lib/securitycontext');
const sinon = require('sinon');

require('chai').should();

describe('SecurityContext', function () {

    let mockConnection;
    let sandbox;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(Connection);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function () {

        it('should store the connection', function () {
            let securityContext = new SecurityContext(mockConnection);
            securityContext.connection.should.equal(mockConnection);
        });

    });

    describe('#getConnection', function () {

        it('should return the connection', function () {
            let securityContext = new SecurityContext(mockConnection);
            securityContext.getConnection().should.equal(mockConnection);
        });

    });

    describe('#getUser', function () {

        it('should throw as abstract method', function () {
            (() => {
                let securityContext = new SecurityContext(mockConnection);
                securityContext.getUser();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let securityContext = new SecurityContext(mockConnection);
            securityContext.toJSON().should.deep.equal({});
        });

    });

});
