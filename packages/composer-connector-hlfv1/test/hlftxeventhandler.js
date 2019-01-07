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

const HLFTxEventHandler = require('../lib/hlftxeventhandler');
const ChannelEventHub = require('fabric-client/lib/ChannelEventHub');
const Logger = require('composer-common').Logger;
const HLFUtil = require('../lib/hlfutil');

const sinon = require('sinon');
const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));

describe('HLFTxEventHandler', () => {

    let sandbox, logWarnSpy;
    let eventhub1, eventhub2;
    beforeEach(() => {
        eventhub1 = sinon.createStubInstance(ChannelEventHub);
        eventhub1._id = '1';
        eventhub2 = sinon.createStubInstance(ChannelEventHub);
        eventhub2._id = '2';
        sandbox = sinon.sandbox.create();
        const LOG = Logger.getLog('HLFTxEventHandler');
        logWarnSpy = sandbox.spy(LOG, 'warn');
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('#startListening', () => {
        it('Should do nothing if no events hubs and none are required', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler(null, null, null, 0);
            evHandler.startListening();
            sinon.assert.notCalled(global.setTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100, 0);
            evHandler.startListening();
            sinon.assert.notCalled(global.setTimeout);
        });

        it('Should throw an error if no event hubs and an event hub is required', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler(null, null, null);
            (() => {
                evHandler.startListening();
            }).should.throw(/No connected event hubs/);
            sinon.assert.notCalled(global.setTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100);
            (() => {
                evHandler.startListening();
            }).should.throw(/No connected event hubs/);
            sinon.assert.notCalled(global.setTimeout);
        });

        it('Should set up a timeout and register for a single event hub', () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            sinon.assert.calledOnce(global.setTimeout);
            sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
            sinon.assert.calledWith(global.setTimeout, sinon.match.func, 31);
            sinon.assert.calledOnce(eventhub1.registerTxEvent);
            sinon.assert.calledWith(eventhub1.registerTxEvent, '1234', sinon.match.func);
        });

        it('Should set up timeouts and register for multiple event hubs', () => {
            sandbox.stub(global, 'setTimeout');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            sinon.assert.calledTwice(global.setTimeout);
            sinon.assert.alwaysCalledWith(global.setTimeout, sinon.match.func, sinon.match.number);
            sinon.assert.alwaysCalledWith(global.setTimeout, sinon.match.func, 31);
            sinon.assert.calledOnce(eventhub1.registerTxEvent);
            sinon.assert.calledWith(eventhub1.registerTxEvent, '1234', sinon.match.func);
            sinon.assert.calledOnce(eventhub2.registerTxEvent);
            sinon.assert.calledWith(eventhub2.registerTxEvent, '1234', sinon.match.func);
        });

        it('Should ignore non connected event hubs', () => {
            sandbox.stub(global, 'setTimeout');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(false);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            sinon.assert.calledOnce(global.setTimeout);
            sinon.assert.alwaysCalledWith(global.setTimeout, sinon.match.func, sinon.match.number);
            sinon.assert.alwaysCalledWith(global.setTimeout, sinon.match.func, 31);
            sinon.assert.notCalled(eventhub1.registerTxEvent);
            sinon.assert.calledOnce(eventhub2.registerTxEvent);
            sinon.assert.calledWith(eventhub2.registerTxEvent, '1234', sinon.match.func);
        });

        it('Should handle timeout for an event', () => {
            sandbox.stub(global, 'setTimeout').yields();
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            evHandler.waitForEvents().should.eventually.be.rejectedWith(/commit notification/)
                .then(() => {
                    sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
                    sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
                });
        });

        it('Should handle a transaction event response which is valid', async () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(global, 'clearTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            eventhub1.registerTxEvent.yield('1234', 'VALID');
            sinon.assert.calledOnce(global.clearTimeout);
            sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
            sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
            try {
                await evHandler.waitForEvents();
            } catch(err) {
                should.fail(null,null,`${err} unexpected`);
            }
        });

        it('Should handle a transaction event response which is not valid', async () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(global, 'clearTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            eventhub1.registerTxEvent.yield('1234', 'ENDORSEMENT_POLICY_FAILURE');
            sinon.assert.calledOnce(global.clearTimeout);
            sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
            sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
            try {
                await evHandler.waitForEvents();
                should.fail(null,null,'should have been rejected');
            } catch(err) {
                err.message.should.match(/has rejected/);
            }
        });

        it('Should handle a transaction listener error response on the only single event hub', async () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(global, 'clearTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            eventhub1.registerTxEvent.callArgWith(2, new Error('lost connection'));
            sinon.assert.calledOnce(global.clearTimeout);
            sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
            sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
            await evHandler.waitForEvents().should.be.rejectedWith(/No event hubs responded/);
            sinon.assert.calledOnce(logWarnSpy);
        });
    });

    it('Should handle a transaction listener error response from all event hubs and event hubs required', async () => {
        sandbox.stub(global, 'setTimeout');
        sandbox.stub(global, 'clearTimeout');
        const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
        ehc.withArgs(eventhub1).returns(true);
        ehc.withArgs(eventhub2).returns(true);
        let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
        evHandler.startListening();
        eventhub1.registerTxEvent.callArgWith(2, new Error('lost connection'));
        eventhub2.registerTxEvent.callArgWith(2, new Error('lost connection'));
        sinon.assert.calledTwice(global.clearTimeout);
        sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
        sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
        sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
        sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
        await evHandler.waitForEvents().should.be.rejectedWith(/No event hubs responded/);
        sinon.assert.calledTwice(logWarnSpy);
    });

    it('Should handle a transaction listener error response from all event hubs but no event hubs required', async () => {
        sandbox.stub(global, 'setTimeout');
        sandbox.stub(global, 'clearTimeout');
        const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
        ehc.withArgs(eventhub1).returns(true);
        ehc.withArgs(eventhub2).returns(true);
        let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31, 0);
        evHandler.startListening();
        eventhub1.registerTxEvent.callArgWith(2, new Error('lost connection'));
        eventhub2.registerTxEvent.callArgWith(2, new Error('lost connection'));
        sinon.assert.calledTwice(global.clearTimeout);
        sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
        sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
        sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
        sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
        try {
            await evHandler.waitForEvents();
        } catch(err) {
            should.fail(null,null,`${err} unexpected`);
        }
        sinon.assert.calledTwice(logWarnSpy);
    });

    it('Should handle a transaction listener error response on one but not all of the event hubs', async () => {
        sandbox.stub(global, 'setTimeout');
        sandbox.stub(global, 'clearTimeout');
        const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
        ehc.withArgs(eventhub1).returns(true);
        ehc.withArgs(eventhub2).returns(true);
        let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
        evHandler.startListening();
        eventhub1.registerTxEvent.callArgWith(2, new Error('lost connection'));
        eventhub2.registerTxEvent.yield('1234', 'VALID');
        sinon.assert.calledTwice(global.clearTimeout);
        sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
        sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
        sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
        sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
        sinon.assert.calledOnce(logWarnSpy);
        try {
            await evHandler.waitForEvents();
        } catch(err) {
            should.fail(null, null, `${err} unexpected`);
        }
    });

    describe('#waitForEvents', () => {
        it('Should do nothing if no events hubs', async () => {
            let evHandler = new HLFTxEventHandler(null, null, null);
            await evHandler.waitForEvents().should.be.resolved;
            sinon.assert.calledOnce(logWarnSpy);
            evHandler = new HLFTxEventHandler([], '1234', 100);
            await evHandler.waitForEvents().should.be.resolved;
            sinon.assert.calledTwice(logWarnSpy);
        });

        it('Should do wait for 1 event', async () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.resolve();
            evHandler.responseCount++;
            await evHandler.waitForEvents().should.be.resolved;

            evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.reject(new Error('some error'));
            await evHandler.waitForEvents().should.be.rejectedWith(/some error/);
        });

        it('Should do wait more than 1 event', async () => {
            sandbox.stub(global, 'setTimeout');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.resolve();
            evHandler.responseCount++;
            evHandler.listenerPromises[1].should.be.instanceOf(Promise);
            evHandler.listenerPromises[1] = Promise.reject(new Error('some error'));
            await evHandler.waitForEvents().should.be.rejectedWith(/some error/);
        });

        it('Should handle timeout for an event', () => {
            sandbox.stub(global, 'setTimeout').yields();
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            return evHandler.waitForEvents().should.eventually.be.rejectedWith(/commit notification/)
                .then(() => {
                    sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
                    sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
                });
        });

        it('Should handle a transaction event response', () => {
            let setTimeoutStub = sandbox.stub(global, 'setTimeout');
            setTimeoutStub.onFirstCall().returns('handle1');
            setTimeoutStub.onSecondCall().returns('handle2');
            sandbox.stub(global, 'clearTimeout');
            eventhub1.registerTxEvent.callsArgWith(1, '1234', 'VALID');
            eventhub2.registerTxEvent.callsArgWith(1, '1234', 'VALID');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            return evHandler.waitForEvents()
                .then(() => {
                    sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
                    sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
                    sinon.assert.calledTwice(global.clearTimeout);
                    sinon.assert.calledWith(global.clearTimeout.firstCall, 'handle1');
                    sinon.assert.calledWith(global.clearTimeout.secondCall, 'handle2');
                });
        });

        it('Should handle a transaction event response which isn\'t valid', () => {
            let setTimeoutStub = sandbox.stub(global, 'setTimeout');
            setTimeoutStub.onFirstCall().returns('handle1');
            setTimeoutStub.onSecondCall().returns('handle2');
            sandbox.stub(global, 'clearTimeout');
            eventhub1.registerTxEvent.callsArgWith(1, '1234', 'VALID');
            eventhub2.registerTxEvent.callsArgWith(1, '1234', 'INVALID');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            return evHandler.waitForEvents().should.eventually.be.rejectedWith(/rejected transaction/)
                .then(() => {
                    sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
                    sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
                    sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
                    sinon.assert.calledTwice(global.clearTimeout);
                    sinon.assert.calledWith(global.clearTimeout.firstCall, 'handle1');
                    sinon.assert.calledWith(global.clearTimeout.secondCall, 'handle2');
                });
        });

    });

    describe('#cancelListening', () => {
        it('Should do nothing if no event hubs and no startListening called', () => {
            sandbox.stub(global, 'clearTimeout');
            let evHandler = new HLFTxEventHandler(null, null, null);
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100);
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
        });

        it('Should do nothing if no events hubs', () => {
            sandbox.stub(global, 'setTimeout');
            sandbox.stub(global, 'clearTimeout');
            let evHandler = new HLFTxEventHandler(null, null, null, 0);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100, 0);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
        });

        it('Should cancel the timer and registration for multiple event hubs', () => {
            let setTimeoutStub = sandbox.stub(global, 'setTimeout');
            setTimeoutStub.onFirstCall().returns('handle1');
            setTimeoutStub.onSecondCall().returns('handle2');
            sandbox.stub(global, 'clearTimeout');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 100);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.calledTwice(global.clearTimeout);
            sinon.assert.calledWith(global.clearTimeout.firstCall, 'handle1');
            sinon.assert.calledWith(global.clearTimeout.secondCall, 'handle2');
            sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
            sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');
            sinon.assert.calledOnce(eventhub2.unregisterTxEvent);
            sinon.assert.calledWith(eventhub2.unregisterTxEvent, '1234');
        });


        it('Should cancel timer and registration for a single event hub', () => {
            sandbox.stub(global, 'setTimeout').returns('handle1');
            sandbox.stub(global, 'clearTimeout');
            sandbox.stub(HLFUtil, 'eventHubConnected').withArgs(eventhub1).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 100);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.calledOnce(global.clearTimeout);
            sinon.assert.calledWith(global.clearTimeout, 'handle1');
            sinon.assert.calledOnce(eventhub1.unregisterTxEvent);
            sinon.assert.calledWith(eventhub1.unregisterTxEvent, '1234');

        });

        it('Should do nothing if created with event hubs but start listening not called', () => {
            sandbox.stub(global, 'clearTimeout');
            const ehc = sandbox.stub(HLFUtil, 'eventHubConnected');
            ehc.withArgs(eventhub1).returns(true);
            ehc.withArgs(eventhub2).returns(true);
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 100);
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
        });
    });


});
