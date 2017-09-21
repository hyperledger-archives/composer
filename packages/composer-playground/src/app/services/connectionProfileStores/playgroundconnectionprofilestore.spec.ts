
import { ConnectionProfileStore } from 'composer-common';
/* tslint:disable:no-var-requires */
const ProxyConnectionProfileStore = require('composer-connector-proxy').ProxyConnectionProfileStore;
import { PlaygroundConnectionProfileStore } from './playgroundconnectionprofilestore';
import * as sinon from 'sinon';
import { BrowserConnectionProfileStore } from './browserconnectionprofilestore';

describe('PlaygroundConnectionProfileStore', () => {

    let connectionProfileStore: PlaygroundConnectionProfileStore = null;
    let mockBrowserConnectionProfileStore: any = null;
    let mockProxyConnectionProfileStore: any = null;

    beforeEach(() => {
        connectionProfileStore = new PlaygroundConnectionProfileStore();
        mockBrowserConnectionProfileStore = sinon.createStubInstance(ConnectionProfileStore);
        mockProxyConnectionProfileStore = sinon.createStubInstance(ConnectionProfileStore);
        connectionProfileStore.browserConnectionProfileStore = mockBrowserConnectionProfileStore;
        connectionProfileStore.proxyConnectionProfileStore = mockProxyConnectionProfileStore;
    });

    describe('#constructor', () => {
        it('should create a new connection profile store', () => {
            let thisConnectionProfileStore = new PlaygroundConnectionProfileStore();
            thisConnectionProfileStore.browserConnectionProfileStore.should.be.an.instanceOf(BrowserConnectionProfileStore);
            thisConnectionProfileStore.proxyConnectionProfileStore.should.be.an.instanceOf(ProxyConnectionProfileStore);
        });

    });

    describe('#load', () => {
        it('should load from the browser connection profile store', () => {
            mockBrowserConnectionProfileStore.load.withArgs('web-default').resolves({type: 'web'});
            mockProxyConnectionProfileStore.load.rejects(new Error('such error'));
            return connectionProfileStore.load('web-default')
                .then((result) => {
                    result.should.deep.equal({type: 'web'});
                });
        });

        it('should load from the proxy connection profile store if not in the browser connection profile store', () => {
            mockBrowserConnectionProfileStore.load.withArgs('hlfv1-default').rejects(new Error('such error'));
            mockProxyConnectionProfileStore.load.resolves({type: 'hlfv1'});
            return connectionProfileStore.load('hlfv1-default')
                .then((result) => {
                    result.should.deep.equal({type: 'hlfv1'});
                });
        });
    });

    describe('#save', () => {
        it('should save web profiles to the browser connection profile store', () => {
            mockBrowserConnectionProfileStore.save.withArgs('web-default', {type: 'web'}).resolves();
            mockProxyConnectionProfileStore.save.rejects(new Error('such error'));
            return connectionProfileStore.save('web-default', {type: 'web'})
                .then((result) => {
                    sinon.assert.calledOnce(mockBrowserConnectionProfileStore.save);
                    sinon.assert.calledWith(mockBrowserConnectionProfileStore.save, 'web-default', {type: 'web'});
                    sinon.assert.notCalled(mockProxyConnectionProfileStore.save);
                });
        });
        it('should save other profiles to the proxy connection profile store', () => {
            mockBrowserConnectionProfileStore.save.rejects(new Error('such error'));
            mockProxyConnectionProfileStore.save.withArgs('hlfv1-default', {type: 'hlfv1'}).resolves();
            return connectionProfileStore.save('hlfv1-default', {type: 'hlfv1'})
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserConnectionProfileStore.save);
                    sinon.assert.calledOnce(mockProxyConnectionProfileStore.save);
                    sinon.assert.calledWith(mockProxyConnectionProfileStore.save, 'hlfv1-default', {type: 'hlfv1'});
                });
        });
    });

    describe('#loadAll', () => {
        it('should load from both the browser and proxy connection profile stores', () => {
            mockBrowserConnectionProfileStore.loadAll.resolves({
                'web-default': {
                    type: 'web'
                },
                'web-default2': {
                    type: 'web'
                }
            });
            mockProxyConnectionProfileStore.loadAll.resolves({
                'hlfv1-default': {
                    type: 'hlfv1'
                },
                'hlfv1-default2': {
                    type: 'hlfv1'
                }
            });
            return connectionProfileStore.loadAll()
                .then((result) => {
                    result.should.deep.equal({
                        'web-default': {
                            type: 'web'
                        },
                        'web-default2': {
                            type: 'web'
                        },
                        'hlfv1-default': {
                            type: 'hlfv1'
                        },
                        'hlfv1-default2': {
                            type: 'hlfv1'
                        }
                    });
                });
        });
    });

    describe('#delete', () => {
        it('should ignore errors for profiles that do not exist', () => {
            sinon.stub(connectionProfileStore, 'load').rejects(new Error('such error'));
            mockBrowserConnectionProfileStore.delete.rejects(new Error('such error'));
            mockProxyConnectionProfileStore.delete.rejects(new Error('such error'));
            return connectionProfileStore.delete('web-default')
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserConnectionProfileStore.delete);
                    sinon.assert.notCalled(mockProxyConnectionProfileStore.delete);
                });
        });

        it('should delete web profiles from the browser connection profile store', () => {
            sinon.stub(connectionProfileStore, 'load').withArgs('web-default').resolves({type: 'web'});
            mockBrowserConnectionProfileStore.delete.withArgs('web-default').resolves();
            mockProxyConnectionProfileStore.delete.rejects(new Error('such error'));
            return connectionProfileStore.delete('web-default')
                .then((result) => {
                    sinon.assert.calledOnce(mockBrowserConnectionProfileStore.delete);
                    sinon.assert.calledWith(mockBrowserConnectionProfileStore.delete, 'web-default');
                    sinon.assert.notCalled(mockProxyConnectionProfileStore.delete);
                });
        });

        it('should delete other profiles from the proxy connection profile store', () => {
            sinon.stub(connectionProfileStore, 'load').withArgs('hlfv1-default').resolves({type: 'hlfv1'});
            mockBrowserConnectionProfileStore.delete.rejects(new Error('such error'));
            mockProxyConnectionProfileStore.delete.withArgs('hlfv1-default').resolves();
            return connectionProfileStore.delete('hlfv1-default')
                .then((result) => {
                    sinon.assert.notCalled(mockBrowserConnectionProfileStore.delete);
                    sinon.assert.calledOnce(mockProxyConnectionProfileStore.delete);
                    sinon.assert.calledWith(mockProxyConnectionProfileStore.delete, 'hlfv1-default');
                });
        });
    });
});
