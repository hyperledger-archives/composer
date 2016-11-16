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

const Container = require('../lib/container');

require('chai').should();

describe('Container', () => {

    let container;

    beforeEach(() => {
        container = new Container();
    });

    describe('#getVersion', () => {

        it('should throw as abstract method', () => {
            (() => {
                container.getVersion();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getLoggingService', () => {

        it('should throw as abstract method', () => {
            (() => {
                container.getLoggingService();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            container.toJSON().should.deep.equal({});
        });

    });

});
