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

const BaseException = require('../lib/baseexception');
const SecurityException = require('../lib/securityexception');

require('chai').should();

describe('SecurityException', function () {

    describe('#constructor', function () {

        it('should return an instance of BaseException', function () {
            let exc = new SecurityException('hello world');
            exc.should.be.an.instanceOf(BaseException);
        });

    });

});
