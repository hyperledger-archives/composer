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

const BusinessNetwork = require('@ibm/ibm-concerto-common').BusinessNetwork;
const Container = require('../lib/container');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const RegistryManager = require('../lib/registrymanager');
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Engine', () => {

    let mockContainer;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let sandbox;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockDataService = sinon.createStubInstance(DataService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);
        mockContext.initialize.resolves();
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        engine = new Engine(mockContainer);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#init', () => {

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.init(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should throw for invalid arguments', () => {
            (() => {
                engine.init(mockContext, 'init', ['no', 'args', 'supported']);
            }).should.throw(/Invalid arguments "\["no","args","supported"\]" to function "init", expecting "\[\"businessNetworkArchive\"\]"/);
        });

        it('should create system collections and default registries', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').rejects();
            mockDataService.createCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
            sandbox.stub(BusinessNetwork, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.calledTwice(mockDataService.createCollection);
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysdata');
                    sinon.assert.calledOnce(BusinessNetwork.fromArchive);
                    sinon.assert.calledWith(BusinessNetwork.fromArchive, sinon.match((archive) => {
                        return archive.compare(Buffer.from('hello world')) === 0;
                    }));
                    sinon.assert.calledOnce(sysdata.add);
                    sinon.assert.calledWith(sysdata.add, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=' });
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysregistries');
                    sinon.assert.calledOnce(mockRegistryManager.add);
                    sinon.assert.calledWith(mockRegistryManager.add, 'Transaction', 'default', 'Default Transaction Registry');
                });
        });

        it('should ignore existing system data collection', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
            sandbox.stub(BusinessNetwork, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves();
            mockRegistryManager.get.rejects();
            mockRegistryManager.add.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysdata');
                });
        });

        it('should ignore existing system registries collection', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').rejects();
            mockDataService.createCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
            sandbox.stub(BusinessNetwork, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockRegistryManager.get.rejects();
            mockRegistryManager.add.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysregistries');
                });
        });

        it('should ignore existing default transaction registry', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves(mockDataCollection);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetwork);
            sandbox.stub(BusinessNetwork, 'fromArchive').resolves(mockBusinessNetwork);
            mockRegistryManager.get.withArgs('Transaction', 'default').resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockRegistryManager.add, 'Transaction', 'default', 'Default Transaction Registry');
                });
        });

    });

    describe('#_init', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'init').resolves();
            engine._init(mockContext, 'init', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'init').rejects(new Error('error'));
            engine._init(mockContext, 'init', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#invoke', () => {

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.invoke(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should initialize the context', () => {
            engine.test = sinon.stub().resolves();
            return engine.invoke(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                });
        });

    });

    describe('#_invoke', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'invoke').resolves();
            engine._invoke(mockContext, 'test', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'invoke').rejects(new Error('error'));
            engine._invoke(mockContext, 'test', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#query', () => {

        it('should throw for an unrecognized function', () => {
            (() => {
                engine.query(mockContext, 'blahblahblah', []);
            }).should.throw(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should initialize the context', () => {
            engine.test = sinon.stub().resolves({});
            return engine.query(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                });
        });

    });

    describe('#_query', () => {

        it('should call init and handle a resolved promise', (done) => {
            sinon.stub(engine, 'query').resolves();
            engine._query(mockContext, 'test', [], (error, result) => {
                try {
                    should.not.exist(error);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('should call init and handle a rejected promise', (done) => {
            sinon.stub(engine, 'query').rejects(new Error('error'));
            engine._query(mockContext, 'test', [], (error, result) => {
                try {
                    error.should.match(/error/);
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

    });

    describe('#ping', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'ping', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "ping", expecting "\[\]"/);
        });

        it('should return an object containing the version', () => {
            return engine.query(mockContext, 'ping', [])
                .then((result) => {
                    result.should.deep.equal({
                        version: version
                    });
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            engine.toJSON().should.deep.equal({});
        });

    });

});
