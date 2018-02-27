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

const WalletBackedCardStore = require('../../lib/cardstore/walletbackedcardstore');
const IdCard = require('../../lib/idcard');
const Wallet = require('../../lib/wallet');
const path = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
chai.use(require('chai-things'));

const sinon = require('sinon');

describe('WalletBackedCardStore', function() {

    let sandbox;
    let storeModuleMock;
    let fromArchiveStub;
    let walletMock;
    let cardMock;
    let cardMock2;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        walletMock = sinon.createStubInstance(Wallet);
        cardMock = sinon.createStubInstance(IdCard);
        cardMock2 = sinon.createStubInstance(IdCard);
        cardMock.toArchive.resolves(Buffer.from('I am a buffer'));
        storeModuleMock = { getStore : sinon.stub().returns(walletMock) };
        fromArchiveStub = sandbox.stub(IdCard,'fromArchive');
    });

    afterEach(() => {

        sandbox.restore();

    });



    describe('#constructor', function() {
        it('should throw error if no options are given on the constructor', () => {
            (()=>{
                new WalletBackedCardStore();
            }).should.throw(/Options must be given/);
        });

        it('should correctly handle the options', () => {

            new WalletBackedCardStore({StoreModule : storeModuleMock});
            sinon.assert.calledOnce(storeModuleMock.getStore);
            sinon.assert.calledWith(storeModuleMock.getStore,sinon.match({namePrefix:'cards'}));
        });

    });

    describe('#get', function() {
        it('should throw error if nothing there', function() {
            walletMock.get.rejects('data');
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            return store.get('fred').should.eventually.be.rejectedWith(/not found/);
        });

        it('should return the correct object', function() {
            walletMock.get.resolves('data');
            fromArchiveStub.resolves('data');
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            return store.get('fred').should.eventually.be.equal('data');
        });

    });

    describe('#put', function() {
        it('should throw error if no cardName', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            return store.put(null,cardMock).should.eventually.be.rejectedWith(/Invalid card name/);
        });

        it('should throw error if no cardName', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            return store.put('fred',null).should.eventually.be.rejectedWith(/no card to store/);
        });

        it('should throw error if can not correctly save', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            walletMock.put.rejects(new Error());
            return store.put('fred',cardMock).should.eventually.be.rejectedWith(/Failed to save card/);
        });

        it('should correctly save a card', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            walletMock.put.resolves();
            return store.put('fred',cardMock).should.be.fullfilled;
        });
    });

    describe('#has', function() {
        it('should return false if it does not have card', function() {
            walletMock.contains.returns(true);
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            store.has('name').should.be.true;
        });
        it('should return true if it does have card', function() {
            walletMock.contains.returns(false);
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            store.has('name').should.be.false;
        });
    });

    describe('#getAll', function() {
        it('should handle case where the store is empty', function() {
            walletMock.getAll = sinon.stub().resolves([]);
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            return store.getAll().should.eventually.deep.equal(new Map());
        });

        it('should handle case where the store has cards', function() {
            fromArchiveStub.resolves('hello');
            walletMock.getAll = sinon.stub().resolves([{'one':cardMock},{'two':cardMock2}]);
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});

            return store.getAll().should.eventually.deep.equal(new Map());
        });
    });

    describe('#delete', function() {
        it('should just call delete', function() {
            walletMock.remove.returns(true);
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            let r = store.delete('name');
            r.should.be.true;
            sinon.assert.calledOnce(walletMock.remove);
            sinon.assert.calledWith(walletMock.remove,'name');
        });
    });

    describe('#getWallet', function() {
        it('should return a valid wallet', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            store.getWallet('fred');
            sinon.assert.calledTwice(storeModuleMock.getStore);
            sinon.assert.calledWith(storeModuleMock.getStore,sinon.match({namePrefix:path.join('client-data','fred')}));
        });

        it('should return a valid wallet with default name', function() {
            let store = new WalletBackedCardStore({StoreModule : storeModuleMock});
            store.getWallet();
            sinon.assert.calledTwice(storeModuleMock.getStore);
            sinon.assert.calledWith(storeModuleMock.getStore,sinon.match({namePrefix:path.join('client-data','wallet')}));
        });
    });
});
