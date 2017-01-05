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

const Factory = require('../lib/factory');
const ModelManager = require('../lib/modelmanager');

require('chai').should();
const sinon = require('sinon');

describe('Factory', () => {

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let mockModelManager = sinon.createStubInstance(ModelManager);
            let factory = new Factory(mockModelManager);
            factory.toJSON().should.deep.equal({});
        });

    });

});
