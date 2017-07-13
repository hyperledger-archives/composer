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

const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const IdentityManager = require('../lib/identitymanager');
const LoggingService = require('../lib/loggingservice');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineIdentities', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockIdentityManager;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
        mockIdentityManager = sinon.createStubInstance(IdentityManager);
        mockContext.getIdentityManager.returns(mockIdentityManager);
        engine = new Engine(mockContainer);
    });

    describe('#setLogLevel', () => {

        it('should throw for wrong number of arguments', () => {
            let result = engine.invoke(mockContext, 'setLogLevel', ['wrong', 'args', 'count', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments/);
        });
        it('should throw for no arguments', () => {
            let result = engine.invoke(mockContext, 'setLogLevel', []);
            return result.should.be.rejectedWith(/Invalid arguments/);
        });
        it('should throw for no arguments array', () => {
            let result = engine.invoke(mockContext, 'setLogLevel');
            return result.should.be.rejectedWith(/Invalid arguments/);
        });

        it('should throw if not authorized', () => {
            mockContext.getParticipant.returns('User');
            let result = engine.invoke(mockContext, 'setLogLevel', ['WARNING']);
            return result.should.be.rejectedWith(/Authorization failure/);
        });

        it('should set the log level if user authorised', () => {
            mockContext.getParticipant.returns(null);
            return engine.invoke(mockContext, 'setLogLevel', ['WARNING'])
                .then(() => {
                    sinon.assert.calledOnce(mockLoggingService.setLogLevel);
                    sinon.assert.calledWith(mockLoggingService.setLogLevel, 'WARNING');
                });
        });

    });

    describe('#getLogLevel', () => {

        it('should throw for wrong number of arguments', () => {
            let result = engine.invoke(mockContext, 'getLogLevel', ['wrong', 'args', 'count', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments/);
        });

        it('should throw if not authorized', () => {
            mockContext.getParticipant.returns('User');
            let result = engine.invoke(mockContext, 'getLogLevel', []);
            return result.should.be.rejectedWith(/Authorization failure/);
        });

        it('should set the log level if user authorised and empty args array', () => {
            mockContext.getParticipant.returns(null);
            mockLoggingService.getLogLevel.returns('ERROR');
            return engine.invoke(mockContext, 'getLogLevel', [])
                .then((response) => {
                    sinon.assert.calledOnce(mockLoggingService.getLogLevel);
                    response.should.equal('ERROR');
                });
        });

        it('should set the log level if user authorised and no args', () => {
            mockContext.getParticipant.returns(null);
            mockLoggingService.getLogLevel.returns('ERROR');
            return engine.invoke(mockContext, 'getLogLevel')
                .then((response) => {
                    sinon.assert.calledOnce(mockLoggingService.getLogLevel);
                    response.should.equal('ERROR');
                });
        });


    });


});
