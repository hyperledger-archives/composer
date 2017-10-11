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
const Serializer = require('composer-common').Serializer;
const AccessController = require('../lib/accesscontroller');
const Container = require('../lib/container');
const Context = require('../lib/context');
const Engine = require('../lib/engine');
const IdentityManager = require('../lib/identitymanager');
const LoggingService = require('../lib/loggingservice');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');


describe('EngineLogging', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockIdentityManager;
    let engine;
    let mockDataService;
    let mockDataCollection;
    let mockSerializer;
    let mockAccessController;

    beforeEach(() => {
        mockSerializer = sinon.createStubInstance(Serializer);
        mockAccessController = sinon.createStubInstance(AccessController);
        mockDataService = sinon.createStubInstance(DataService);
        mockDataCollection = sinon.createStubInstance(DataCollection);
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
        mockContext.getDataService.returns(mockDataService);
        mockContext.getSerializer.returns(mockSerializer);
        mockContext.getAccessController.returns(mockAccessController);
        mockContext.getLoggingService.returns(mockLoggingService);
        mockDataService.getCollection.resolves(mockDataCollection);
        mockIdentityManager = sinon.createStubInstance(IdentityManager);
        mockContext.getIdentityManager.returns(mockIdentityManager);
        engine = new Engine(mockContainer);
        mockSerializer.fromJSON.returns();
    });



    describe('#getLogLevel', () => {

        it('should work for the good path', () => {
            mockAccessController.check.resolves();
            mockLoggingService.getLogLevel.returns('LEVEL');
            return engine.invoke(mockContext, 'getLogLevel', ['wrong', 'args', 'count', 'here'])
            .should.eventually.be.deep.equal('LEVEL');
        });

        it('should throw if not authorized', () => {
            mockAccessController.check.throws(new Error('Authorization Failure'));
            let result = engine.invoke(mockContext, 'getLogLevel', []);
            return result.should.be.rejectedWith(/Authorization Failure/);
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
