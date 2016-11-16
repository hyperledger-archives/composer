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

const common = require('..');

const serializer = common.Serializer;
const modelManager = common.ModelManager;
const relationship = common.Relationship;
const resource = common.Resource;
const factory = common.Factory;

describe('Module', () => {
    describe('#instances', function() {
        it('check can get instances', function() {
            serializer.should.not.be.null;
            modelManager.should.not.be.null;
            relationship.should.not.be.null;
            resource.should.not.be.null;
            factory.should.not.be.null;
        });
    });
});
