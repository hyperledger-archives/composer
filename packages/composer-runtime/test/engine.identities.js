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

    describe('#addParticipantIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addParticipantIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addParticipantIdentity", expecting "\["participantId","userId"]"/);
        });

        it('should add the identity mapping', () => {
            mockIdentityManager.addIdentityMapping.withArgs('org.doge.Doge#DOGE_1', 'dogeid1').resolves();
            return engine.invoke(mockContext, 'addParticipantIdentity', ['org.doge.Doge#DOGE_1', 'dogeid1'])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.addIdentityMapping);
                    sinon.assert.calledWith(mockIdentityManager.addIdentityMapping, 'org.doge.Doge#DOGE_1', 'dogeid1');
                });
        });

    });

    describe('#removeIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'removeIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "removeIdentity", expecting "\["userId"]"/);
        });

        it('should remove the identity mapping', () => {
            mockIdentityManager.removeIdentityMapping.withArgs('dogeid1').resolves();
            return engine.invoke(mockContext, 'removeIdentity', ['dogeid1'])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.removeIdentityMapping);
                    sinon.assert.calledWith(mockIdentityManager.removeIdentityMapping, 'dogeid1');
                });
        });

    });

});
