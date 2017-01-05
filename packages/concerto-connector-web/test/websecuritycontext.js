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

const Connection = require('@ibm/concerto-common').Connection;
const SecurityContext = require('@ibm/concerto-common').SecurityContext;
const WebSecurityContext = require('../lib/websecuritycontext');

require('chai').should();
const sinon = require('sinon');

describe('WebSecurityContext', () => {

    let mockConnection;

    beforeEach(() => {
        mockConnection = sinon.createStubInstance(Connection);
    });

    describe('#constructor', () => {

        it('should construct a new security context', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.should.be.an.instanceOf(SecurityContext);
        });

    });

    describe('#getChaincodeID', () => {

        it('should get the chaincode ID', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.chaincodeID = 'ed916d6a-21af-4a2a-a9be-a86f69aa641b';
            securityContext.getChaincodeID().should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

    describe('#setChaincodeID', () => {

        it('should set the chaincode ID', () => {
            let securityContext = new WebSecurityContext(mockConnection);
            securityContext.setChaincodeID('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
            securityContext.chaincodeID.should.equal('ed916d6a-21af-4a2a-a9be-a86f69aa641b');
        });

    });

});
