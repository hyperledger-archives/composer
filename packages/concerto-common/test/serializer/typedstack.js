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
const TypedStack = require('../../lib/serializer/typedstack');

require('chai').should();

describe('TypedStack', function () {

    describe('#push', function() {
        it('check push with wrong type', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.push(1, String);}, /.+Did not find expected type Function as argument to push. Found: 1/, 'did not throw with expected message');
        });

        it('check push with null', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.push(null);}, /.+Pushing null data!/, 'did not throw with expected message');
        });
    });

    describe('#pop', function() {
        it('check pop with empty stack', function() {
            const ts = new TypedStack('ROOT');
            ts.pop();
            assert.throws( function() {ts.pop();}, /.+Stack is empty!/, 'did not throw with expected message');
        });

        it('check pop with wrong type', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.pop(Number);}, /.+Found: \"ROOT\"/, 'did not throw with expected message');
        });
    });
});
