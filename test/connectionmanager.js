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

const ConnectionManager = require('../lib/connectionmanager');

require('chai').should();

describe('ConnectionManager', () => {

    describe('#connect', () => {

        it('should throw as abstract method', () => {
            let cm = new ConnectionManager();
            return cm.connect({})
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            let cm = new ConnectionManager();
            cm.toJSON().should.deep.equal({});
        });

    });

});
