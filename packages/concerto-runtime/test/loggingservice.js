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

const LoggingService = require('../lib/loggingservice');

require('chai').should();

describe('LoggingService', () => {

    let loggingService = new LoggingService();

    describe('#logCritical', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logCritical('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logDebug', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logDebug('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logError', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logError('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logInfo', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logInfo('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logNotice', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logNotice('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#logWarning', () => {

        it('should throw as abstract method', () => {
            (() => {
                loggingService.logWarning('wow such log');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            loggingService.toJSON().should.deep.equal({});
        });

    });

});
