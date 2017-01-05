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

const assert = require('assert');
require('chai').should();
const fs = require('fs');
const ModelManager = require('../../lib/modelmanager');

describe('Test Relationships', function(){
    describe('#validate', function() {
        it('check that relationships to primitives are illegal', function() {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();

            let fileName = './test/data/parser/relationshiptoprimitive.cto';
            let model = fs.readFileSync(fileName, 'utf8');
            assert.throws( function() {modelManager.addModelFile(model);}, /.+Relationship cannot be to a primitive type/, 'did not throw with expected message');
        });
    });
});
