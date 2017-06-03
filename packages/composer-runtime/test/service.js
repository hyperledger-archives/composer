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

const Service = require('../lib/service');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('Service', () => {

    let service;

    beforeEach(() => {
        service = new Service();
    });

    describe('#transactionStart', () => {

        it('should defer to the callback function', () => {
            const spy = sinon.spy(service, '_transactionStart');
            return service.transactionStart(true)
                .then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, true, sinon.match.func);
                });
        });

        it('should handle errors from the callback function', () => {
            sinon.stub(service, '_transactionStart').yields(new Error('ruhroh'));
            return service.transactionStart(true)
                .should.be.rejectedWith(/ruhroh/);
        });

    });

    describe('#transactionPrepare', () => {

        it('should defer to the callback function', () => {
            const spy = sinon.spy(service, '_transactionPrepare');
            return service.transactionPrepare()
                .then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, sinon.match.func);
                });
        });

        it('should handle errors from the callback function', () => {
            sinon.stub(service, '_transactionPrepare').yields(new Error('ruhroh'));
            return service.transactionPrepare()
                .should.be.rejectedWith(/ruhroh/);
        });

    });

    describe('#transactionRollback', () => {

        it('should defer to the callback function', () => {
            const spy = sinon.spy(service, '_transactionRollback');
            return service.transactionRollback()
                .then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, sinon.match.func);
                });
        });

        it('should handle errors from the callback function', () => {
            sinon.stub(service, '_transactionRollback').yields(new Error('ruhroh'));
            return service.transactionRollback()
                .should.be.rejectedWith(/ruhroh/);
        });

    });

    describe('#transactionCommit', () => {

        it('should defer to the callback function', () => {
            const spy = sinon.spy(service, '_transactionCommit');
            return service.transactionCommit()
                .then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, sinon.match.func);
                });
        });

        it('should handle errors from the callback function', () => {
            sinon.stub(service, '_transactionCommit').yields(new Error('ruhroh'));
            return service.transactionCommit()
                .should.be.rejectedWith(/ruhroh/);
        });

    });

    describe('#transactionEnd', () => {

        it('should defer to the callback function', () => {
            const spy = sinon.spy(service, '_transactionEnd');
            return service.transactionEnd()
                .then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWith(spy, sinon.match.func);
                });
        });

        it('should handle errors from the callback function', () => {
            sinon.stub(service, '_transactionEnd').yields(new Error('ruhroh'));
            return service.transactionEnd()
                .should.be.rejectedWith(/ruhroh/);
        });

    });

});
