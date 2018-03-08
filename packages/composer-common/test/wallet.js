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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const should = chai.should();

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

    describe('#listNames', () => {

        it('should throw as abstract method', () => {
            return wallet.listNames().should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#contains', () => {

        it('should throw as abstract method', () => {
            return wallet.contains('id1').should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#get', () => {

        it('should throw as abstract method', () => {
            return wallet.get('id1').should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#put', () => {

        it('should throw as abstract method', () => {
            return wallet.put('id1', 'value1').should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#remove', () => {

        it('should throw as abstract method', () => {
            return wallet.remove('id1').should.be.rejectedWith(/abstract function called/);
        });

    });

});
