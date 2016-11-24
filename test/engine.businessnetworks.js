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
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const version = require('../package.json').version;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Engine', () => {

    let mockContainer;
    let mockContext;
    let mockDataService;
    let engine;
    let sandbox;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockDataService = sinon.createStubInstance(DataService);
        mockContext.getDataService.returns(mockDataService);
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
            sysdata.get.withArgs('businessnetwork').resolves({ data: 'aGVsbG8gd29ybGQ=' });
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            return engine.query(mockContext, 'getBusinessNetwork', [])
                .then((result) => {
                    result.should.deep.equal({ data: 'aGVsbG8gd29ybGQ=' });
                });
        });

    });

    describe('#resetBusinessNetwork', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'resetBusinessNetwork', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "resetBusinessNetwork", expecting "\[\]"/);
        });

        it('should delete all world state', () => {
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
            sinon.stub(engine, 'init').resolves();
            return engine.invoke(mockContext, 'resetBusinessNetwork', [])
                .then(() => {
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Participants:farmers');
                    sinon.assert.calledWith(mockDataService.deleteCollection, '$sysregistries');
                    sinon.assert.calledOnce(engine.init);
                    sinon.assert.calledWith(engine.init, sinon.match.any, 'init', []);
                });
        });

    });

});
