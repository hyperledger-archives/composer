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

require('chai').should();
const ManagementConnection = require('..').ManagementConnection;

describe('ManagementConnection', function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe('#constructor', function () {

        it('should create a new instance', function () {
            const managementConnection = new ManagementConnection();
            (managementConnection.enrolledMember === null).should.be.true;
            managementConnection.developmentMode.should.equal(false);
        });
    });
});
