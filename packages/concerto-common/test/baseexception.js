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

require('chai').should();

describe('BaseException', function () {

    describe('#constructor', function () {

        it('should return an instance of Error', function () {
            let exc = new BaseException('hello world');
            exc.should.be.an.instanceOf(Error);
        });

        it('should have a name', function () {
            let exc = new BaseException('hello world');
            exc.name.should.be.a('string');
        });

        it('should have a message', function () {
            let exc = new BaseException('hello world');
            exc.message.should.equal('hello world');
        });

        it('should have a stack trace', function () {
            let exc = new BaseException('hello world');
            exc.stack.should.be.a('string');
        });

    });

});
