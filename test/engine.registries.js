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
const Registry = require('../lib/registry');
const RegistryManager = require('../lib/registrymanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineRegistries', () => {

    let mockContainer;
    let mockContext;
    let mockRegistryManager;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
    });

    describe('#getAllRegistries', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getAllRegistries', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getAllRegistries", expecting "\["registryType"\]"/);
        });

        it('should return all of the registries', () => {
            let mockRegistry1 = sinon.createStubInstance(Registry);
            let mockRegistry2 = sinon.createStubInstance(Registry);
            mockRegistryManager.getAll.withArgs('Asset').resolves([mockRegistry1, mockRegistry2]);
            return engine.invoke(mockContext, 'getAllRegistries', ['Asset'])
                .then((registries) => {
                    registries.should.have.lengthOf(2);
                    registries.should.all.be.an.instanceOf(Registry);
                });
        });

    });

    describe('#getRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getRegistry', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getRegistry", expecting "\["registryType","registryId"]"/);
        });

        it('should return all of the registries', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.get.withArgs('Asset', 'doges').resolves(mockRegistry);
            return engine.invoke(mockContext, 'getRegistry', ['Asset', 'doges'])
                .then((registry) => {
                    registry.should.be.an.instanceOf(Registry);
                });
        });

    });

    describe('#addRegistry', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'addRegistry', ['no', 'args', 'supported', 'here']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported","here"\]" to function "addRegistry", expecting "\["registryType","registryId","registryName"]"/);
        });

        it('should add the registry', () => {
            let mockRegistry = sinon.createStubInstance(Registry);
            mockRegistryManager.add.withArgs('Asset', 'doges', 'The doges registry').resolves(mockRegistry);
            return engine.invoke(mockContext, 'addRegistry', ['Asset', 'doges', 'The doges registry'])
                .then(() => {
                    sinon.assert.calledOnce(mockRegistryManager.add);
                });
        });

    });

});
