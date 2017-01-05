/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
