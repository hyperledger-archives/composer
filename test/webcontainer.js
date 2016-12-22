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

const Container = require('@ibm/ibm-concerto-runtime').Container;
const DataService = require('@ibm/ibm-concerto-runtime').DataService;
const LoggingService = require('@ibm/ibm-concerto-runtime').LoggingService;
const WebContainer = require('..').WebContainer;
const uuid = require('uuid');
const version = require('../package.json').version;

require('chai').should();
const sinon = require('sinon');

describe('WebContainer', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should construct a new container with a new UUID', () => {
            sandbox.stub(uuid, 'v4').returns('eaaf183b-7d22-4601-be96-833e2b342c7a');
            let container = new WebContainer();
            container.should.be.an.instanceOf(Container);
            container.uuid.should.equal('eaaf183b-7d22-4601-be96-833e2b342c7a');
        });

        it('should construct a new container with the specified UUID', () => {
            let container = new WebContainer('761df21b-f620-434c-ad44-15d66c4d8575');
            container.should.be.an.instanceOf(Container);
            container.uuid.should.equal('761df21b-f620-434c-ad44-15d66c4d8575');
        });

    });

    describe('#getVersion', () => {

        it('should return the container version', () => {
            let container = new WebContainer();
            container.getVersion().should.equal(version);
        });

    });

    describe('#getDataService', () => {

        it('should return the container data service', () => {
            let container = new WebContainer();
            container.getDataService().should.be.an.instanceOf(DataService);
        });

    });

    describe('#getLoggingService', () => {

        it('should return the container logging service', () => {
            let container = new WebContainer();
            container.getLoggingService().should.be.an.instanceOf(LoggingService);
        });

    });

    describe('#getUUID', () => {

        it('should return the container UUID', () => {
            sandbox.stub(uuid, 'v4').returns('eaaf183b-7d22-4601-be96-833e2b342c7a');
            let container = new WebContainer();
            container.getUUID().should.equal('eaaf183b-7d22-4601-be96-833e2b342c7a');
        });

    });

});
