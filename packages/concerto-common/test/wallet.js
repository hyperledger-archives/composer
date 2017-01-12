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

const Wallet = require('../lib/wallet');

const should = require('chai').should();

describe('Wallet', () => {

    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    afterEach(() => {
        Wallet.setWallet(null);
    });

    describe('#getWallet', () => {

        it('should return null by default', () => {
            should.equal(Wallet.getWallet(wallet), null);
        });

    });

    describe('#setWallet', () => {

        it('should set the wallet to a wallet instance', () => {
            Wallet.setWallet(wallet);
            Wallet.getWallet().should.equal(wallet);
        });

        it('should clear an existing wallet instance', () => {
            Wallet.setWallet(wallet);
            Wallet.getWallet().should.equal(wallet);
            Wallet.setWallet(null);
            should.equal(Wallet.getWallet(wallet), null);
        });

    });

    describe('#list', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.list();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#contains', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.contains('id1');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#get', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.get('id1');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#add', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.add('id1', 'value1');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#update', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.update('id1', 'value1');
            }).should.throw(/abstract function called/);
        });

    });

    describe('#remove', () => {

        it('should throw as abstract method', () => {
            (() => {
                wallet.remove('id1');
            }).should.throw(/abstract function called/);
        });

    });

});
