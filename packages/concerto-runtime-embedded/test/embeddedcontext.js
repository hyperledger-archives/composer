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
const EmbeddedContainer = require('..').EmbeddedContainer;
const EmbeddedContext = require('..').EmbeddedContext;
const IdentityService = require('@ibm/concerto-runtime').IdentityService;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedContext', () => {

    let mockEmbeddedContainer;
    let mockDataService;
    let mockEngine;

    beforeEach(() => {
        mockEmbeddedContainer = sinon.createStubInstance(EmbeddedContainer);
        mockDataService = sinon.createStubInstance(DataService);
        mockEngine = sinon.createStubInstance(Engine);
        mockEngine.getContainer.returns(mockEmbeddedContainer);
        mockEmbeddedContainer.getDataService.returns(mockDataService);
    });

    describe('#constructor', () => {

        it('should construct a new context', () => {
            let context = new EmbeddedContext(mockEngine);
            context.should.be.an.instanceOf(Context);
        });

    });

    describe('#getDataService', () => {

        it('should return the container data service', () => {
            let context = new EmbeddedContext(mockEngine);
            context.getDataService().should.be.an.instanceOf(DataService);
        });

    });

    describe('#getIdentityService', () => {

        it('should return the container identity service', () => {
            let context = new EmbeddedContext(mockEngine);
            context.getIdentityService().should.be.an.instanceOf(IdentityService);
        });

    });

});
