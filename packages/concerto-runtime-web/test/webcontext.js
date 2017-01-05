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

const Context = require('@ibm/concerto-runtime').Context;
const DataService = require('@ibm/concerto-runtime').DataService;
const Engine = require('@ibm/concerto-runtime').Engine;
const IdentityService = require('@ibm/concerto-runtime').IdentityService;
const WebContainer = require('..').WebContainer;
const WebContext = require('..').WebContext;

require('chai').should();
const sinon = require('sinon');

describe('WebContext', () => {

    let mockWebContainer;
    let mockDataService;
    let mockEngine;

    beforeEach(() => {
        mockWebContainer = sinon.createStubInstance(WebContainer);
        mockDataService = sinon.createStubInstance(DataService);
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockWebContainer);
        mockWebContainer.getDataService.returns(mockDataService);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            let context = new WebContext(mockEngine);
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container logging service', () => {
            let context = new WebContext(mockEngine);
            context.getDataService().should.be.an.instanceOf(DataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new WebContext(mockEngine);
            context.getIdentityService().should.be.an.instanceOf(IdentityService);
        });

    });

});
