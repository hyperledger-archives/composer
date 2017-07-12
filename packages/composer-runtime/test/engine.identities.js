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

    describe('#issueIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'issueIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "issueIdentity", expecting "\["participantFQI","identityName"]"/);
        });

        it('should issue the identity', () => {
            mockIdentityManager.issueIdentity.withArgs('org.doge.Doge#DOGE_1', 'dogeid1').resolves();
            return engine.invoke(mockContext, 'issueIdentity', ['org.doge.Doge#DOGE_1', 'dogeid1'])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.issueIdentity);
                    sinon.assert.calledWith(mockIdentityManager.issueIdentity, 'org.doge.Doge#DOGE_1', 'dogeid1');
                });
        });

    });

    describe('#bindIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'bindIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "bindIdentity", expecting "\["participantFQI","certificate"]"/);
        });

        it('should bind the identity', () => {
            mockIdentityManager.bindIdentity.withArgs('org.doge.Doge#DOGE_1', '===== BEGIN CERTIFICATE =====').resolves();
            return engine.invoke(mockContext, 'bindIdentity', ['org.doge.Doge#DOGE_1', '===== BEGIN CERTIFICATE ====='])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.bindIdentity);
                    sinon.assert.calledWith(mockIdentityManager.bindIdentity);
                });
        });

    });

    describe('#activateIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'activateIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "activateIdentity", expecting "\[]"/);
        });

        it('should activate the identity', () => {
            mockIdentityManager.activateIdentity.resolves();
            return engine.invoke(mockContext, 'activateIdentity', [])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.activateIdentity);
                    sinon.assert.calledWith(mockIdentityManager.activateIdentity);
                });
        });

    });

    describe('#revokeIdentity', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'revokeIdentity', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "revokeIdentity", expecting "\["identityId"]"/);
        });

        it('should revoke the identity', () => {
            mockIdentityManager.revokeIdentity.withArgs('dogeid1').resolves();
            return engine.invoke(mockContext, 'revokeIdentity', ['dogeid1'])
                .then(() => {
                    sinon.assert.calledOnce(mockIdentityManager.revokeIdentity);
                    sinon.assert.calledWith(mockIdentityManager.revokeIdentity, 'dogeid1');
                });
        });

    });

});
