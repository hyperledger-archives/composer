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

const HLFWalletProxy = require('../lib/hlfwalletproxy');
const Wallet = require('composer-common').Wallet;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('HLFWalletProxy', () => {

    let mockWallet;
    let walletProxy;

    beforeEach(() => {
        mockWallet = sinon.createStubInstance(Wallet);
        walletProxy = new HLFWalletProxy(mockWallet);
    });

    describe('#getValue', () => {

        it('should pass back the value from the wallet', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(true);
            mockWallet.get.withArgs('member.bob1').resolves('hello world');
            return walletProxy.getValue('member.bob1')
                .then((value) => {
                    value.should.equal('hello world');
                });
        });

        it('should pass back null if it does not exist in the wallet', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(false);
            return walletProxy.getValue('member.bob1')
                .then((value) => {
                    should.equal(value, null);
                });
        });

        it('should pass back any errors from the wallet', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(true);
            mockWallet.get.withArgs('member.bob1').rejects('ENOPERM');
            return walletProxy.getValue('member.bob1')
                .should.be.rejectedWith(/ENOPERM/);
        });

    });

    describe('#setValue', () => {

        it('should add the value to the wallet and call the callback', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(false);
            return walletProxy.setValue('member.bob1', 'hello world')
                .then(() => {
                    sinon.assert.calledOnce(mockWallet.add);
                    sinon.assert.calledWith(mockWallet.add, 'member.bob1', 'hello world');
                });
        });

        it('should update the value in the wallet and call the callback', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(true);
            return walletProxy.setValue('member.bob1', 'hello world')
                .then(() => {
                    sinon.assert.calledOnce(mockWallet.update);
                    sinon.assert.calledWith(mockWallet.update, 'member.bob1', 'hello world');
                });
        });

        it('should pass back any errors from the wallet', () => {
            mockWallet.contains.withArgs('member.bob1').resolves(true);
            mockWallet.update.withArgs('member.bob1').rejects('ENOPERM');
            return walletProxy.setValue('member.bob1', 'hello world')
                .should.be.rejectedWith(/ENOPERM/);
        });

    });

});
