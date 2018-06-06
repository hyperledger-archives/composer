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
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { BusinessNetworkCardStore, IdCard } from 'composer-common';

const ProxyBusinessNetworkCardStore = require('composer-connector-proxy').ProxyBusinessNetworkCardStore;
import { PlaygroundBusinessNetworkCardStore } from './playgroundbusinessnetworkcardstore';
import * as sinon from 'sinon';
import { BrowserBusinessNetworkCardStore } from './browserbusinessnetworkcardstore';

describe('PlaygroundBusinessNetworkCardStore', () => {

    let businessNetworkCardStore: PlaygroundBusinessNetworkCardStore = null;
    let mockBrowserBusinessNetworkCardStore: any = null;
    let mockProxyBusinessNetworkCardStore: any = null;

    beforeEach(() => {
        businessNetworkCardStore = new PlaygroundBusinessNetworkCardStore();
        mockBrowserBusinessNetworkCardStore = sinon.createStubInstance(BrowserBusinessNetworkCardStore);
        mockProxyBusinessNetworkCardStore = sinon.createStubInstance(ProxyBusinessNetworkCardStore);
        businessNetworkCardStore.browserBusinessNetworkCardStore = mockBrowserBusinessNetworkCardStore;
        businessNetworkCardStore.proxyBusinessNetworkCardStore = mockProxyBusinessNetworkCardStore;
    });

    describe('#constructor', () => {
        it('should create a new business network card store', () => {
            let thisBusinessNetworkCardStore = new PlaygroundBusinessNetworkCardStore();
            thisBusinessNetworkCardStore.browserBusinessNetworkCardStore.should.be.an.instanceOf(BrowserBusinessNetworkCardStore);
            thisBusinessNetworkCardStore.proxyBusinessNetworkCardStore.should.be.an.instanceOf(ProxyBusinessNetworkCardStore);
        });

    });

    describe('#getWallet', () => {
        it('should return the dummy wallet', (done) => {
            let thisBusinessNetworkCardStore = new PlaygroundBusinessNetworkCardStore();
            return thisBusinessNetworkCardStore.getWallet()
                .then((result) => {
                    result.should.deep.equal({empty: 'playground-wallet'});
                    done();
                });

        });

    });

    describe('#get', () => {
        it('should get from the browser connection profile store', (done) => {
            mockBrowserBusinessNetworkCardStore.get.withArgs('web-card').resolves({userName: 'web'});
            mockBrowserBusinessNetworkCardStore.get.rejects(new Error('such error'));
            return businessNetworkCardStore.get('web-card')
                .then((result) => {
                    result.should.deep.equal({userName: 'web'});
                    done();
                });
        });

        it('should load from the proxy business network store if not in the browser business network card store', (done) => {
            mockBrowserBusinessNetworkCardStore.get.withArgs('myCard').rejects(new Error('such error'));
            mockProxyBusinessNetworkCardStore.get.resolves({userName: 'bob'});
            return businessNetworkCardStore.get('myCard')
                .then((result) => {
                    result.should.deep.equal({userName: 'bob'});
                    done();
                });
        });
    });

    describe('#has', () => {
        it('should return true if browser has card', (done) => {
            mockBrowserBusinessNetworkCardStore.has.withArgs('web-card').resolves(true);
            mockBrowserBusinessNetworkCardStore.has.rejects(new Error('such error'));
            return businessNetworkCardStore.has('web-card')
                .then((result) => {
                    result.should.deep.equal(true);
                    done();
                });
        });

        it('should check if it exists in the proxy card store if not in browser', (done) => {
            mockBrowserBusinessNetworkCardStore.has.withArgs('myCard').resolves(true);
            mockProxyBusinessNetworkCardStore.has.resolves(true);
            return businessNetworkCardStore.has('myCard')
                .then((result) => {
                    result.should.deep.equal(true);
                    done();
                });
        });

        it('should return false if not in either store', (done) => {
            mockBrowserBusinessNetworkCardStore.has.withArgs('myCard').resolves(false);
            mockProxyBusinessNetworkCardStore.has.resolves(false);
            return businessNetworkCardStore.has('myCard')
                .then((result) => {
                    result.should.deep.equal(false);
                    done();
                });
        });
    });

    describe('#put', () => {
        it('should save web cards to the browser card store', (done) => {
            let idCardOne = new IdCard({userName: 'banana'}, {'x-type': 'web', 'name': 'webProfile'});
            mockBrowserBusinessNetworkCardStore.put.resolves();
            mockProxyBusinessNetworkCardStore.put.rejects(new Error('such error'));
            return businessNetworkCardStore.put('web-card', idCardOne)
                .then((result) => {
                    sinon.assert.calledOnce(mockBrowserBusinessNetworkCardStore.put);
                    sinon.assert.calledWith(mockBrowserBusinessNetworkCardStore.put, 'web-card', idCardOne);
                    sinon.assert.notCalled(mockProxyBusinessNetworkCardStore.put);
                    done();
                });
        });

        it('should save other cards to the proxy card store', (done) => {
            mockBrowserBusinessNetworkCardStore.put.rejects(new Error('such error'));
            let idCardOne = new IdCard({userName: 'banana'}, {'x-type': 'hlfv1', 'name': 'hlfv1'});
            mockProxyBusinessNetworkCardStore.put.resolves();
            return businessNetworkCardStore.put('myCard', idCardOne)
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserBusinessNetworkCardStore.put);
                    sinon.assert.calledOnce(mockProxyBusinessNetworkCardStore.put);
                    sinon.assert.calledWith(mockProxyBusinessNetworkCardStore.put, 'myCard', idCardOne);
                    done();
                });
        });
    });

    describe('#getAll', () => {
        it('should get from both the browser and proxy card stores', (done) => {
            let idCardOne = new IdCard({userName: 'banana'}, {'x-type': 'web', 'name': 'webProfile'});
            let idCardTwo = new IdCard({userName: 'bob'}, {'x-type': 'web', 'name': 'webProfile'});

            let browserMap: Map<string, IdCard> = new Map<string, IdCard>();
            browserMap.set('browserCard1', idCardOne);
            browserMap.set('browserCard2', idCardTwo);

            let idCardThree = new IdCard({userName: 'fish'}, {'x-type': 'hlfv1', 'name': 'hlfv1'});
            let idCardFour = new IdCard({userName: 'fred'}, {'x-type': 'hlfv1', 'name': 'hlfv1'});

            let proxyMap: Map<string, IdCard> = new Map<string, IdCard>();
            proxyMap.set('proxyCard1', idCardThree);
            proxyMap.set('proxyCard2', idCardFour);

            mockBrowserBusinessNetworkCardStore.getAll.resolves(browserMap);
            mockProxyBusinessNetworkCardStore.getAll.resolves(proxyMap);
            return businessNetworkCardStore.getAll()
                .then((result) => {
                    result.size.should.equal(4);

                    let cards = Array.from(result.entries());

                    cards[0].should.deep.equal(['browserCard1', idCardOne]);
                    cards[1].should.deep.equal(['browserCard2', idCardTwo]);
                    cards[2].should.deep.equal(['proxyCard1', idCardThree]);
                    cards[3].should.deep.equal(['proxyCard2', idCardFour]);
                    done();
                });
        });
    });

    describe('#delete', () => {
        it('should ignore errors for cards that do not exist', (done) => {
            sinon.stub(businessNetworkCardStore, 'get').rejects(new Error('such error'));
            mockBrowserBusinessNetworkCardStore.delete.rejects(new Error('such error'));
            mockProxyBusinessNetworkCardStore.delete.rejects(new Error('such error'));
            return businessNetworkCardStore.delete('web-default')
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserBusinessNetworkCardStore.delete);
                    sinon.assert.notCalled(mockProxyBusinessNetworkCardStore.delete);
                    done();
                });
        });

        it('should delete web cards from the browser cards store', (done) => {
            sinon.stub(businessNetworkCardStore, 'get').resolves({userName: 'bob', connectionProfile: {'x-type': 'web'}});
            mockBrowserBusinessNetworkCardStore.delete.withArgs('web-card').resolves();
            mockProxyBusinessNetworkCardStore.delete.rejects(new Error('such error'));
            return businessNetworkCardStore.delete('web-card')
                .then((result) => {
                    sinon.assert.calledOnce(mockBrowserBusinessNetworkCardStore.delete);
                    sinon.assert.calledWith(mockBrowserBusinessNetworkCardStore.delete, 'web-card');
                    sinon.assert.notCalled(mockProxyBusinessNetworkCardStore.delete);
                    done();
                });
        });

        it('should delete other cards from the proxy card store', (done) => {
            sinon.stub(businessNetworkCardStore, 'get').resolves({userName: 'bob', connectionProfile: {'x-type': 'hlfv1'}});
            mockBrowserBusinessNetworkCardStore.delete.rejects(new Error('such error'));
            mockProxyBusinessNetworkCardStore.delete.withArgs('myCard').resolves();
            return businessNetworkCardStore.delete('myCard')
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserBusinessNetworkCardStore.delete);
                    sinon.assert.calledOnce(mockProxyBusinessNetworkCardStore.delete);
                    sinon.assert.calledWith(mockProxyBusinessNetworkCardStore.delete, 'myCard');
                    done();
                });
        });
    });
});
