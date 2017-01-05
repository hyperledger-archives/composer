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

const TransactionExecutor = require('../lib/transactionexecutor');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('TransactionExecutor', () => {

    let transactionExecutor = new TransactionExecutor();

    describe('#getType', () => {

        it('should throw as abstract method', () => {
            (() => {
                transactionExecutor.getType();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#execute', () => {

        it('should throw as abstract method', () => {
            return transactionExecutor.execute()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            transactionExecutor.toJSON().should.deep.equal({});
        });

    });

});
