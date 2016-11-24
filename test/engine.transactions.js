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
const Factory = require('@ibm/ibm-concerto-common').Factory;
const ModelManager = require('@ibm/ibm-concerto-common').ModelManager;
const Resolver = require('../lib/resolver');
const ScriptManager = require('@ibm/ibm-concerto-common').ScriptManager;
const Serializer = require('@ibm/ibm-concerto-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineTransactions', () => {

    const mozartModel = fs.readFileSync(path.resolve(__dirname, 'data', 'mozart.cto'), 'utf8');
    const mozartScript = fs.readFileSync(path.resolve(__dirname, 'data', 'mozart.cto.js'), 'utf8');

    let mockContainer;
    let mockContext;
    let engine;
    let modelManager;
    let scriptManager;
    let factory;
    let serializer;
    let mockResolver;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        engine = new Engine(mockContainer);
        modelManager = new ModelManager();
        modelManager.addModelFile(mozartModel);
        scriptManager = new ScriptManager(modelManager);
        scriptManager.addScript(scriptManager.createScript('mozart.cto.js', 'JS', mozartScript));
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        mockResolver = sinon.createStubInstance(Resolver);
        mockContext.getModelManager.returns(modelManager);
        mockContext.getScriptManager.returns(scriptManager);
        mockContext.getFactory.returns(factory);
        mockContext.getSerializer.returns(serializer);
        mockContext.getResolver.returns(mockResolver);
    });

    describe('#submitTransaction', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'submitTransaction', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "submitTransaction", expecting "\["registryId","resourceId","resourceData"\]"/);
        });

    });

});
