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
const EventHub = require('fabric-client/lib/EventHub');

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));




describe('HLFTxEventHandler', () => {

    let sandbox;
    let eventhub1, eventhub2;
    beforeEach(() => {
        eventhub1 = sinon.createStubInstance(EventHub);
        eventhub2 = sinon.createStubInstance(EventHub);
        sandbox = sinon.sandbox.create();
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('#startListening', () => {
        it('Should do nothing if no events hubs', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler(null, null, null);
            evHandler.startListening();
            sinon.assert.notCalled(global.setTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100);
            evHandler.startListening();
            sinon.assert.notCalled(global.setTimeout);

        });

        it('Should set up a timeout and register for a single event hub', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            sinon.assert.calledOnce(global.setTimeout);
            sinon.assert.calledWith(global.setTimeout, sinon.match.func, sinon.match.number);
            sinon.assert.calledWith(global.setTimeout, sinon.match.func, 31);
            sinon.assert.calledOnce(eventhub1.registerTxEvent);
            sinon.assert.calledWith(eventhub1.registerTxEvent, '1234', sinon.match.func);
        });

        it('Should set up timeouts and register for multiple event hub', () => {
            sandbox.stub(global, 'setTimeout');
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

        it('Should handle timeout for an event', () => {
            sandbox.stub(global, 'setTimeout').yields();
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

        it('Should handle a transaction event response', () => {

        });


    });

    describe('#waitForEvents', () => {
        it('Should do nothing if no events hubs', () => {
            let evHandler = new HLFTxEventHandler(null, null, null);
            evHandler.waitForEvents().should.eventually.be.resolved;
            evHandler = new HLFTxEventHandler([], '1234', 100);
            evHandler.waitForEvents().should.eventually.be.resolved;
        });

        it('Should do wait for 1 event', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.resolve();
            evHandler.waitForEvents().should.eventually.be.resolved;

            evHandler = new HLFTxEventHandler([eventhub1], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.reject();
            evHandler.waitForEvents().should.eventually.be.rejected;
        });

        it('Should do wait more than 1 event', () => {
            sandbox.stub(global, 'setTimeout');
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            evHandler.listenerPromises[0].should.be.instanceOf(Promise);
            evHandler.listenerPromises[0] = Promise.resolve();
            evHandler.listenerPromises[1].should.be.instanceOf(Promise);
            evHandler.listenerPromises[1] = Promise.reject();
            evHandler.waitForEvents().should.eventually.be.rejected;
        });

        it('Should handle timeout for an event', () => {
            sandbox.stub(global, 'setTimeout').yields();
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

        it('Should handle a transaction event response', () => {
            let setTimeoutStub = sandbox.stub(global, 'setTimeout');
            setTimeoutStub.onFirstCall().returns('handle1');
            setTimeoutStub.onSecondCall().returns('handle2');
            sandbox.stub(global, 'clearTimeout');
            eventhub1.registerTxEvent.callsArgWith(1, '1234', 'VALID');
            eventhub2.registerTxEvent.callsArgWith(1, '1234', 'VALID');
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            evHandler.waitForEvents()
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
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 31);
            evHandler.startListening();
            evHandler.waitForEvents().should.eventually.be.rejectedWith(/rejected transaction/)
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
            let evHandler = new HLFTxEventHandler(null, null, null);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
            evHandler = new HLFTxEventHandler([], '1234', 100);
            evHandler.startListening();
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
        });

        it('Should cancel the timer and registration for a single event hub', () => {
            let setTimeoutStub = sandbox.stub(global, 'setTimeout');
            setTimeoutStub.onFirstCall().returns('handle1');
            setTimeoutStub.onSecondCall().returns('handle2');
            sandbox.stub(global, 'clearTimeout');
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


        it('Should cancel timers and registrations multipl event hub', () => {
            sandbox.stub(global, 'setTimeout').returns('handle1');
            sandbox.stub(global, 'clearTimeout');
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
            let evHandler = new HLFTxEventHandler([eventhub1, eventhub2], '1234', 100);
            evHandler.cancelListening();
            sinon.assert.notCalled(global.clearTimeout);
        });


    });


});
