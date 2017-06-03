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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Container = require('../lib/container');
const Context = require('../lib/context');
const DataCollection = require('../lib/datacollection');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const Logger = require('composer-common').Logger;
const LoggingService = require('../lib/loggingservice');
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
require('sinon-as-promised');

const LOG = Logger.getLog('Engine');

describe('Engine', () => {

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
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
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

    describe('#getContainer', () => {

        it('should return the container', () => {
            engine.getContainer().should.equal(mockContainer);
        });

    });

    describe('#installLogger', () => {

        it('should install a logger for debug level logging', () => {
            LOG.debug('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/hello.*world/));
        });

        it('should install a logger for warn level logging', () => {
            LOG.warn('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logWarning, sinon.match(/hello.*world/));
        });

        it('should install a logger for info level logging', () => {
            LOG.info('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logInfo, sinon.match(/hello.*world/));
        });

        it('should install a logger for verbose level logging', () => {
            LOG.verbose('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/hello.*world/));
        });

        it('should install a logger for error level logging', () => {
            LOG.error('installLogger', 'hello', 'world');
            sinon.assert.calledWith(mockLoggingService.logError, sinon.match(/hello.*world/));
        });

        it('should format multiple arguments into a comma separated list', () => {
            LOG.debug('installLogger', 'hello', 'world', 'i', 'am', 'simon');
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/world, i, am, simon/));
        });

        it('should format object arguments into JSON', () => {
            LOG.debug('installLogger', 'hello', { hi: 'there' });
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/{"hi":"there"}/));
        });

        it('should cope with object arguments that cannot be formatted into JSON', () => {
            let object = {
                hi: 'there'
            };
            object.object = object;
            LOG.debug('installLogger', 'hello', object);
            sinon.assert.calledWith(mockLoggingService.logDebug, sinon.match(/\[object Object\]/));
        });

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
            let sysidentities = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').rejects();
            mockDataService.createCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockDataService.getCollection.withArgs('$sysidentities').rejects();
            mockDataService.createCollection.withArgs('$sysidentities').resolves(sysidentities);
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default', 'Default Transaction Registry').resolves();
            mockRegistryManager.createDefaults.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.calledThrice(mockDataService.createCollection);
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysdata');
                    sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                    sinon.assert.calledWith(BusinessNetworkDefinition.fromArchive, sinon.match((archive) => {
                        return archive.compare(Buffer.from('hello world')) === 0;
                    }));
                    sinon.assert.calledOnce(sysdata.add);
                    sinon.assert.calledWith(sysdata.add, 'businessnetwork', { data: 'aGVsbG8gd29ybGQ=', hash: 'dc9c1c09907c36f5379d615ae61c02b46ba254d92edb77cb63bdcc5247ccd01c' });
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysregistries');
                    sinon.assert.calledWith(mockDataService.createCollection, '$sysidentities');
                    sinon.assert.calledOnce(mockRegistryManager.add);
                    sinon.assert.calledWith(mockRegistryManager.add, 'Transaction', 'default', 'Default Transaction Registry');
                    sinon.assert.calledOnce(mockRegistryManager.createDefaults);
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        businessNetworkDefinition: mockBusinessNetwork,
                        sysregistries: sysregistries,
                        sysidentities: sysidentities
                    });
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should ignore existing system data collection', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves();
            mockDataService.getCollection.withArgs('$sysidentities').rejects();
            mockDataService.createCollection.withArgs('$sysidentities').resolves();
            mockRegistryManager.get.rejects();
            mockRegistryManager.add.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysdata');
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should ignore existing system registries collection', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').rejects();
            mockDataService.createCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            let sysregistries = sinon.createStubInstance(DataCollection);
            let sysidentities = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockDataService.getCollection.withArgs('$sysidentities').rejects();
            mockDataService.createCollection.withArgs('$sysidentities').resolves(sysidentities);
            mockRegistryManager.get.rejects();
            mockRegistryManager.add.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysregistries');
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        businessNetworkDefinition: mockBusinessNetwork,
                        sysregistries: sysregistries,
                        sysidentities: sysidentities
                    });
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should ignore existing system identities collection', () => {
            let sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            sysdata.add.withArgs('businessnetwork', sinon.match.any).resolves();
            let sysregistries = sinon.createStubInstance(DataCollection);
            let sysidentities = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysregistries').rejects();
            mockDataService.createCollection.withArgs('$sysregistries').resolves(sysregistries);
            mockDataService.getCollection.withArgs('$sysidentities').resolves(sysidentities);
            mockRegistryManager.get.rejects();
            mockRegistryManager.add.resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockDataService.createCollection, '$sysidentities');
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledWith(mockContext.initialize, {
                        businessNetworkDefinition: mockBusinessNetwork,
                        sysregistries: sysregistries,
                        sysidentities: sysidentities
                    });
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should ignore existing default transaction registry', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves(mockDataCollection);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            mockRegistryManager.get.withArgs('Transaction', 'default').resolves();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .then(() => {
                    sinon.assert.neverCalledWith(mockRegistryManager.add, 'Transaction', 'default', 'Default Transaction Registry');
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should throw if an error occurs', () => {
            let mockDataCollection = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.rejects();
            mockDataService.createCollection.resolves(mockDataCollection);
            let mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
            sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetwork);
            mockRegistryManager.get.withArgs('Transaction', 'default').rejects();
            mockRegistryManager.add.withArgs('Transaction', 'default').rejects();
            return engine.init(mockContext, 'init', ['aGVsbG8gd29ybGQ='])
                .should.be.rejected
                .then(() => {
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
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

        it('should initialize the context and call the function', () => {
            engine.test = sinon.stub().resolves();
            return engine.invoke(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should handle an error from calling the function', () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            return engine.invoke(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/)
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, false);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
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

        it('should initialize the context and call the function', () => {
            engine.test = sinon.stub().resolves({});
            return engine.query(mockContext, 'test', [])
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, true);
                    sinon.assert.calledOnce(mockContext.transactionPrepare);
                    sinon.assert.calledOnce(mockContext.transactionCommit);
                    sinon.assert.notCalled(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should handle an error from calling the function', () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            return engine.query(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/)
                .then(() => {
                    sinon.assert.calledOnce(mockContext.initialize);
                    sinon.assert.calledOnce(engine.test);
                    sinon.assert.calledWith(engine.test, mockContext, []);
                    sinon.assert.calledOnce(mockContext.transactionStart);
                    sinon.assert.calledWith(mockContext.transactionStart, true);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
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
                        version: version,
                        participant: null
                    });
                });
        });

        it('should return an object containing the current participant', () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockContext.getParticipant.returns(mockParticipant);
            return engine.query(mockContext, 'ping', [])
                .then((result) => {
                    result.should.deep.equal({
                        version: version,
                        participant: 'org.doge.Doge#DOGE_1'
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
