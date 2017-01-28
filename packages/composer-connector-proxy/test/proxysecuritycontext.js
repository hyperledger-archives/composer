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

const ProxyConnection = require('../lib/proxyconnection');
const ProxySecurityContext = require('../lib/proxysecuritycontext');
const SecurityContext = require('composer-common').SecurityContext;

require('chai').should();
const sinon = require('sinon');

describe('ProxySecurityContext', () => {

    let mockProxyConnection;
    let proxySecurityContext;

    beforeEach(() => {
        mockProxyConnection = sinon.createStubInstance(ProxyConnection);
        proxySecurityContext = new ProxySecurityContext(mockProxyConnection, 'aea015ec-3428-45cb-a481-900eadd0ba33');
    });

    describe('#constructor', () => {

        it('should construct a new security context', () => {
            proxySecurityContext.should.be.an.instanceOf(SecurityContext);
        });

    });

    describe('#getUser', () => {

        it('should throw an error', () => {
            (() => {
                proxySecurityContext.getUser();
            }).should.throw(/TODO/);
        });

    });

    describe('#getSecurityContextID', () => {

        it('should return the security context ID', () => {
            proxySecurityContext.getSecurityContextID().should.equal('aea015ec-3428-45cb-a481-900eadd0ba33');
        });

    });

});
