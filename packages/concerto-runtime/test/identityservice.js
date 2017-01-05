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

const IdentityService = require('../lib/identityservice');

require('chai').should();

describe('IdentityService', () => {

    let identityService = new IdentityService();

    describe('#getCurrentUserID', () => {

        it('should throw as abstract method', () => {
            (() => {
                identityService.getCurrentUserID();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            identityService.toJSON().should.deep.equal({});
        });

    });

});
