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
const WebContainer = require('..').WebContainer;

require('chai').should();

describe('WebContainer', () => {

    describe('#constructor', () => {

        it('should construct a new web container', () => {
            let container = new WebContainer();
            container.should.be.an.instanceOf(Container);
        });

    });

});
