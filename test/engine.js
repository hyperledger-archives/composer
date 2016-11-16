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
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

describe('Engine', () => {

    let mockContainer;
    let mockContext;
    let mockDataService;
    let engine;

    beforeEach(() => {
        mockContainer = sinon.createStubInstance(Container);
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockContext.initialize.resolves();
        mockDataService = sinon.createStubInstance(DataService);
        mockContext.getDataService.returns(mockDataService);
        engine = new Engine(mockContainer);
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
            }).should.throw(/Invalid arguments "\["no","args","supported"\]" to function "init", expecting "\[\]"/);
        });

        it('should create system collections and default registries', () => {
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockDataService.getCollection.withArgs('$sysmodels').rejects();
            mockDataService.createCollection.withArgs('$sysmodels').resolves(sysregistries);
            sinon.stub(engine, 'getRegistry');
            engine.getRegistry.withArgs(sinon.match.any, ['Model', 'default']).rejects();
            sinon.stub(engine, 'addRegistry');
            engine.addRegistry.withArgs(sinon.match.any, ['Model', 'default', 'Default Model Registry']).resolves();
            engine.getRegistry.withArgs(sinon.match.any, ['Transaction', 'default']).rejects();
            engine.addRegistry.withArgs(sinon.match.any, ['Transaction', 'default', 'Default Transaction Registry']).resolves();
            return engine.init(mockContext, 'init', [])
                .then(() => {
                    sinon.assert.calledTwice(mockDataService.createCollection);
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysregistries');
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysmodels');
                    sinon.assert.calledTwice(engine.addRegistry);
                    sinon.assert.calledWith(engine.addRegistry, sinon.match.any, ['Model', 'default', 'Default Model Registry']);
                    sinon.assert.calledWith(engine.addRegistry, sinon.match.any, ['Transaction', 'default', 'Default Transaction Registry']);
                });
        });

        it('should ignore existing system registries collection', () => {
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockDataService.getCollection.withArgs('$sysmodels').rejects();
            mockDataService.createCollection.withArgs('$sysmodels').resolves();
            sinon.stub(engine, 'getRegistry').rejects();
            sinon.stub(engine, 'addRegistry').resolves();
            return engine.init(mockContext, 'init', [])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysregistries');
                });
        });

        it('should ignore existing system models collection', () => {
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves();
            let sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysmodels').resolves(sysregistries);
            sinon.stub(engine, 'getRegistry').rejects();
            sinon.stub(engine, 'addRegistry').resolves();
            return engine.init(mockContext, 'init', [])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysmodels');
                });
        });

        it('should ignore existing default model registry', () => {
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves();
            sinon.stub(engine, 'getRegistry');
            engine.getRegistry.withArgs(sinon.match.any, ['Model', 'default']).resolves();
            engine.getRegistry.rejects();
            sinon.stub(engine, 'addRegistry').resolves();
            return engine.init(mockContext, 'init', [])
                .then(() => {
                    sinon.assert.neverCalledWith(engine.addRegistry, sinon.match.any, ['Model', 'default', 'Default Model Registry']);
                });
        });

        it('should ignore existing default transaction registry', () => {
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves();
            sinon.stub(engine, 'getRegistry');
            engine.getRegistry.withArgs(sinon.match.any, ['Transaction', 'default']).resolves();
            engine.getRegistry.rejects();
            sinon.stub(engine, 'addRegistry').resolves();
            return engine.init(mockContext, 'init', [])
                .then(() => {
                    sinon.assert.neverCalledWith(engine.addRegistry, sinon.match.any, ['Transaction', 'default', 'Default Transaction Registry']);
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

    describe('#clearWorldState', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.invoke(mockContext, 'clearWorldState', ['no', 'args', 'supported']);
            return result.should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "clearWorldState", expecting "\[\]"/);
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
            return engine.invoke(mockContext, 'clearWorldState', [])
                .then(() => {
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Asset:sheeps');
                    sinon.assert.calledWith(mockDataService.deleteCollection, 'Participants:farmers');
                    sinon.assert.calledWith(mockDataService.deleteCollection, '$sysregistries');
                    sinon.assert.calledWith(mockDataService.deleteCollection, '$sysmodels');
                    sinon.assert.calledOnce(engine.init);
                    sinon.assert.calledWith(engine.init, sinon.match.any, 'init', []);
                });
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            engine.toJSON().should.deep.equal({});
        });

    });

});
