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

const LoggingService = require('@ibm/ibm-concerto-runtime').LoggingService;
const WebLoggingService = require('..').WebLoggingService;

require('chai').should();
const sinon = require('sinon');

describe('WebLoggingService', () => {

    let loggingService;
    let sandbox;

    beforeEach(() => {
        loggingService = new WebLoggingService();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a logging service', () => {
            loggingService.should.be.an.instanceOf(LoggingService);
        });

    });

    describe('#logCritical', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'error');
            loggingService.logCritical('doge');
            sinon.assert.calledOnce(console.error);
            sinon.assert.calledWith(console.error, 'doge');
        });

    });

    describe('#logDebug', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'debug');
            loggingService.logDebug('doge');
            sinon.assert.calledOnce(console.debug);
            sinon.assert.calledWith(console.debug, 'doge');
        });

    });

    describe('#logError', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'error');
            loggingService.logError('doge');
            sinon.assert.calledOnce(console.error);
            sinon.assert.calledWith(console.error, 'doge');
        });

    });

    describe('#logInfo', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'info');
            loggingService.logInfo('doge');
            sinon.assert.calledOnce(console.info);
            sinon.assert.calledWith(console.info, 'doge');
        });

    });

    describe('#logNotice', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'info');
            loggingService.logNotice('doge');
            sinon.assert.calledOnce(console.info);
            sinon.assert.calledWith(console.info, 'doge');
        });

    });

    describe('#logWarning', () => {

        it('should call the console logger', () => {
            sandbox.stub(console, 'warn');
            loggingService.logWarning('doge');
            sinon.assert.calledOnce(console.warn);
            sinon.assert.calledWith(console.warn, 'doge');
        });

    });

});
