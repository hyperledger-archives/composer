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

const ConfigMediator = require('../../lib/config/configmediator');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');
const StoreProxy = require('../../lib/cardstore/walletbackedcardstore');

describe('NetworkCardStoreManager', function() {

    let NetworkCardStoreManager;
    let sandbox;

    beforeEach(() => {
        delete require.cache[require.resolve('../../lib/cardstore/networkcardstoremanager')];
        mockery.enable({
            warnOnReplace:false,
            warnOnUnregistered:false,
        });
        sandbox = sinon.sandbox.create();

    });

    afterEach(() => {
        delete require.cache[require.resolve('../../lib/cardstore/networkcardstoremanager')];
        sandbox.restore();
        mockery.deregisterAll();

    });

    describe('#getCardStore', function() {
        it('should correctly load the config module and the default object', () => {
            // const FileSystemWallet = require('../../lib/cardstore/filesystemwallet');

            NetworkCardStoreManager = require('../../lib/cardstore/networkcardstoremanager');

            let store = NetworkCardStoreManager.getCardStore();
            store.should.be.an.instanceOf(StoreProxy);

        });

        it('should correctly load the config module and the default object', () => {

            sandbox.spy(ConfigMediator,'get');
            NetworkCardStoreManager = require('../../lib/cardstore/networkcardstoremanager');
            // NetworkCardStoreManager.setCardStore(null);
            let store = NetworkCardStoreManager.getCardStore();
            store.should.be.an.instanceOf(StoreProxy);



            let store2 = NetworkCardStoreManager.getCardStore();
            store2.should.be.an.instanceOf(StoreProxy);

            sinon.assert.calledTwice(ConfigMediator.get);

        });

        it('should correctly load the config module and the default object', () => {
            sandbox.stub(ConfigMediator,'get').returns({ 'type': 'composer-wallet-filesystem' });


            NetworkCardStoreManager = require('../../lib/cardstore/networkcardstoremanager');

            let store = NetworkCardStoreManager.getCardStore();
            store.should.be.an.instanceOf(StoreProxy);

        });

        it('should correctly throw an error if an invalid name is given', () => {
            sandbox.stub(ConfigMediator,'get').returns({ 'type': 'random' });

            NetworkCardStoreManager = require('../../lib/cardstore/networkcardstoremanager');
            try {
                let store = NetworkCardStoreManager.getCardStore();
                store.should.be.an.instanceOf(StoreProxy);
            } catch (err){
                err.should.match(/Module give does not have valid name/);
            }

        });

    });



});
