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

const Logger = require('@ibm/concerto-client').Logger;
const TestUtil = require('./testutil');

before(() => {
    Logger.setFunctionalLogger({
        log: () => {

        }
    });
    return TestUtil.setUp();
});

beforeEach(() => {
    return TestUtil.resetBusinessNetwork();
});

after(() => {
    return TestUtil.tearDown();
});
