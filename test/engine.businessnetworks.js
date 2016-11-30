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

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Container = require('../lib/container');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const RegistryManager = require('../lib/registrymanager');
const version = require('../package.json').version;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('EngineBusinessNetworks', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let sandbox;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockDataService = sinon.createStubInstance(DataService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'getBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "getBusinessNetwork", expecting "\[\]"/);
        });

        it('should return the business network archive', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            sysdata.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            return engine.query(mockContext, 'getBusinessNetwork', [])
                .then((result) => {
                    result.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                });
        });

    });

    describe('#updateBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'updateBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "updateBusinessNetwork", expecting "\[\"businessNetworkArchive\"\]"/);
        });

        it('should update the business network archive and create default registries', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            sysdata.update.withArgs('businessnetwork', { data: 'aGVsbG8gd29ybGQ=' }).resolves();
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            sandbox.stub(Context, 'cacheBusinessNetwork');
            mockRegistryManager.createDefaults.resolves();
            return engine.invoke(mockContext, 'updateBusinessNetwork', ['aGVsbG8gd29ybGQ='])
                .then((result) => {
                    sinon.assert.calledOnce(sysdata.update);
                    sinon.assert.calledWith(sysdata.update, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledOnce(Context.cacheBusinessNetwork);
                    sinon.assert.calledWith(Context.cacheBusinessNetwork, 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c', mockBusinessNetwork);
                    sinon.assert.calledTwice(mockContext.initialize);
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                });
        });

    });

    describe('#resetBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'resetBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "resetBusinessNetwork", expecting "\[\]"/);
        });

        it('should delete all registries and resources', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataCollection.getAll.resolves([{
                type: 'Asset',
                id: 'sheeps'
            }, {
                type: 'Participants',
                id: 'farmers'
            }]);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(mockDataCollection);
            mockDataService.deleteCollection.resolves();
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').resolves();
            mockRegistryManager.createDefaults.resolves();
            return engine.invoke(mockContext, 'resetBusinessNetwork', [])
                .then(() => {
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Participants:farmers');
                    sinon.assert.calledWith(mockDataCollection.remove, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataCollection.remove, 'Participants:farmers');
                    sinon.assert.calledOnce(mockRegistryManager.add);
                    sinon.assert.calledWith(mockRegistryManager.add, 'Transaction', 'default');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                });
        });

    });

});
