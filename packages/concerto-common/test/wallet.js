/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
