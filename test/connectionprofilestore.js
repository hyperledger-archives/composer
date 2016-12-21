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

const ConnectionProfileStore = require('../lib/connectionprofilestore');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('ConnectionProfileStore', () => {

    describe('#load', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.load('profile')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#save', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.save('profile', {})
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

    describe('#loadAll', () => {

        it('should throw as abstract method', () => {

            let cps = new ConnectionProfileStore();
            return cps.loadAll()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.match(/abstract function called/);
                });
        });
    });

});
