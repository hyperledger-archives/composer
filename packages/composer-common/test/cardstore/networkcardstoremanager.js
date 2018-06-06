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

const sinon = require('sinon');
const LoadModule = require('../../lib/module/loadModule');
const StoreProxy = require('../../lib/cardstore/walletbackedcardstore');

describe('NetworkCardStoreManager', function() {

    let NetworkCardStoreManager;
    let sandbox;
    let loadModuleSpy;

    beforeEach(() => {
        delete require.cache[require.resolve('../../lib/cardstore/networkcardstoremanager')];
        NetworkCardStoreManager = require('../../lib/cardstore/networkcardstoremanager');

        sandbox = sinon.sandbox.create();
        loadModuleSpy = sandbox.spy(LoadModule,'loadModule');
    });

    afterEach(() => {
        delete require.cache[require.resolve('../../lib/cardstore/networkcardstoremanager')];
        sandbox.restore();

    });

    describe('#getCardStore', function() {
        it('should correctly load the config module and the default object', () => {

            let store = NetworkCardStoreManager.getCardStore();
            store.should.be.an.instanceOf(StoreProxy);
            sinon.assert.calledOnce(loadModuleSpy);
            sinon.assert.calledWith(loadModuleSpy,'composer-wallet-filesystem',sinon.match.any);
        });

        it('should correctly throw an error if an invalid name is given', () => {
            sandbox.stub(ConfigMediator,'get').returns({ 'type': 'random' });
            try {
                NetworkCardStoreManager.getCardStore();
            } catch (err){
                err.should.match(/Module give does not have valid name/);
            }

        });

        it('should correctly load the config module from the cache second time', () => {
            let store1 = NetworkCardStoreManager.getCardStore();
            store1.should.be.an.instanceOf(StoreProxy);
            let store2 = NetworkCardStoreManager.getCardStore();
            store2.should.be.an.instanceOf(StoreProxy);
            sinon.assert.calledOnce(loadModuleSpy);
            sinon.assert.calledWith(loadModuleSpy,'composer-wallet-filesystem',sinon.match.any);
        });

        it('should correctly throw an error if the module is unloadable', () => {
            sandbox.stub(ConfigMediator,'get').returns({ 'type': 'composer-wallet-fault.js' });
            try {
                NetworkCardStoreManager.getCardStore();
            } catch (err){
                err.should.match(/Unable to load requested module/);
            }
        });


        it('should correctly throw an error if the module has thre wrong api', () => {
            sandbox.stub(ConfigMediator,'get').returns({ 'type': 'composer-wallet-fault.js' });
            try {
                NetworkCardStoreManager.getCardStore({'paths':[__dirname]});
            } catch (err){
                err.should.match(/Module loaded does not have correct interface /);
            }
        });

    });



});
