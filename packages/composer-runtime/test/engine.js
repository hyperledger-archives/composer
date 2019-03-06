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
const Factory = require('composer-common').Factory;
const Logger = require('composer-common').Logger;
const LoggingService = require('../lib/loggingservice');
const ModelManager = require('composer-common').ModelManager;
const RegistryManager = require('../lib/registrymanager');
const Resource = require('composer-common').Resource;
const Serializer = require('composer-common').Serializer;
const version = require('../package.json').version;

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('Engine', () => {
    const sandbox = sinon.sandbox.create();

    let modelManager;
    let factory;
    let serializer;
    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockRegistryManager;
    let engine;
    let testNetworkDefinition;

    beforeEach(() => {
        modelManager = new ModelManager();
        factory = new Factory(modelManager);
        serializer = new Serializer(factory, modelManager);
        mockContainer = sinon.createStubInstance(Container);
        mockLoggingService = sinon.createStubInstance(LoggingService);
        mockContainer.getLoggingService.returns(mockLoggingService);
        mockLoggingService.getLoggerCfg.resolves( {
            'logger':'config'
        });
        mockLoggingService.setLoggerCfg.resolves();
        mockLoggingService.mapCfg.returns('composer[debug]:theworld');
        mockContainer.getVersion.returns(version);
        mockContext = sinon.createStubInstance(Context);
        mockDataService = sinon.createStubInstance(DataService);
        mockRegistryManager = sinon.createStubInstance(RegistryManager);

        mockContext.initialize.resolves();
        mockContext.transactionStart.resolves();
        mockContext.transactionPrepare.resolves();
        mockContext.transactionCommit.resolves();
        mockContext.transactionRollback.resolves();
        mockContext.transactionEnd.resolves();
        mockContext.getDataService.returns(mockDataService);
        mockContext.getRegistryManager.returns(mockRegistryManager);
        mockContext.getLoggingService.returns(mockLoggingService);


        sandbox.stub(Logger,'setLoggerCfg');

        engine = new Engine(mockContainer);
        testNetworkDefinition = new BusinessNetworkDefinition('test-network@1.0.0');
        mockContext.getBusinessNetworkDefinition.returns(testNetworkDefinition);
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
            engine.installLogger();
        });


    });

    describe('#init', () => {

        beforeEach(() => {
            engine.start = sinon.stub();
            engine.upgrade = sinon.stub();
        });

        it('should call start if $sysdata collection doesn\'t exist by rejection', async () => {
            mockDataService.getCollection.withArgs('$sysdata').rejects(new Error('no collection'));

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.start);
            sinon.assert.calledWith(engine.start, mockContext, 'some args');
            sinon.assert.notCalled(mockContext.getSerializer);
        });

        it('should call start if $sysdata collection doesn\'t exist with null', async () => {
            mockDataService.getCollection.withArgs('$sysdata').resolves(null);

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.start);
            sinon.assert.calledWith(engine.start, mockContext, 'some args');
            sinon.assert.notCalled(mockContext.getSerializer);
        });


        it('should call start if $sysdata collection exists, but metanetwork doesn\'t by rejection', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            sysdata.get.withArgs('metanetwork').rejects('no meta');

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.start);
            sinon.assert.calledWith(engine.start, mockContext, 'some args');
            sinon.assert.notCalled(mockContext.getSerializer);
        });

        it('should call start if $sysdata collection exists, but metanetwork doesn\'t with null', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockSerializer = sinon.createStubInstance(Serializer);
            mockSerializer.fromJSON.throws(new Error('an error'));
            mockContext.getSerializer.returns(mockSerializer);
            sysdata.get.withArgs('metanetwork').resolves(null);

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.start);
            sinon.assert.calledWith(engine.start, mockContext, 'some args');
            sinon.assert.calledOnce(mockContext.getSerializer);
        });

        it('should call start if $sysdata collection exists, but metanetwork doesn\'t with null, and serializer returns null', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockSerializer = sinon.createStubInstance(Serializer);
            mockSerializer.fromJSON.returns(null);
            mockContext.getSerializer.returns(mockSerializer);
            sysdata.get.withArgs('metanetwork').resolves(null);

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.start);
            sinon.assert.calledWith(engine.start, mockContext, 'some args');
            sinon.assert.calledOnce(mockContext.getSerializer);
        });

        it('should call upgrade if $sysdata collection exists, metanetwork exists and version exists', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockSerializer = sinon.createStubInstance(Serializer);
            mockSerializer.fromJSON.returns({runtimeVersion: '0.20.0'});
            mockContext.getSerializer.returns(mockSerializer);
            sysdata.get.withArgs('metanetwork').resolves('some json');

            await engine.init(mockContext, '', 'some args');

            sinon.assert.calledOnce(engine.upgrade);
            sinon.assert.calledWith(engine.upgrade, mockContext, 'some args', sysdata, {runtimeVersion: '0.20.0'});
            sinon.assert.calledOnce(mockContext.getSerializer);
        });

        it('should throw if start throws an error', () => {
            mockDataService.getCollection.withArgs('$sysdata').rejects(new Error('no collection'));
            engine.start = sinon.stub();
            engine.start.rejects(new Error('start error'));

            return engine.init(mockContext, '', 'some args')
                .should.be.rejectedWith(/start error/);
        });

        it('should throw if upgrade throws an error', () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.getCollection.withArgs('$sysdata').resolves(sysdata);
            let mockSerializer = sinon.createStubInstance(Serializer);
            mockSerializer.fromJSON.returns({runtimeVersion: '0.20.0'});
            mockContext.getSerializer.returns(mockSerializer);
            sysdata.get.withArgs('metanetwork').resolves('some json');
            engine.upgrade = sinon.stub();
            engine.upgrade.rejects(new Error('upgrade error'));

            return engine.init(mockContext, '', 'some args')
                .should.be.rejectedWith(/upgrade error/);
        });

    });

    describe('#upgrade', () => {
        it('should update the metanetwork with a new version', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockContainer.getVersion.returns('0.20.1');

            await engine.upgrade(mockContext, '', sysdata, {runtimeVersion:'0.20.0'});
            sinon.assert.calledOnce(sysdata.update);
            sinon.assert.calledWith(sysdata.update, 'metanetwork', {
                '$class': 'org.hyperledger.composer.system.Network',
                'networkId': 'test-network@1.0.0',
                'runtimeVersion': '0.20.1'
            });
            sinon.assert.calledOnce(mockRegistryManager.createDefaults);
            sinon.assert.calledOnce(mockContext.transactionPrepare);
            sinon.assert.calledOnce(mockContext.transactionCommit);
            sinon.assert.calledOnce(mockContext.transactionEnd);
        });

        it('should NOT throw error if upgrading from a much older version', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            mockContainer.getVersion.returns('0.21.0');
            await engine.upgrade(mockContext, '', sysdata, {runtimeVersion:'0.20.0'});
            sinon.assert.calledOnce(sysdata.update);
            sinon.assert.calledWith(sysdata.update, 'metanetwork', {
                '$class': 'org.hyperledger.composer.system.Network',
                'networkId': 'test-network@1.0.0',
                'runtimeVersion': '0.21.0'
            });
            sinon.assert.calledOnce(mockRegistryManager.createDefaults);
            sinon.assert.calledOnce(mockContext.transactionPrepare);
            sinon.assert.calledOnce(mockContext.transactionCommit);
            sinon.assert.calledOnce(mockContext.transactionEnd);

        });

        it('should rollback if sysdata update fails', async () => {
            const sysdata = sinon.createStubInstance(DataCollection);
            sysdata.update.rejects(new Error('update failure'));
            mockContainer.getVersion.returns('0.20.1');

            try {
                await engine.upgrade(mockContext, '', sysdata, {runtimeVersion:'0.20.0'});
                should.fail('Expected error to be thrown');
            } catch(err) {
                err.message.should.match(/update failure/);
                sinon.assert.notCalled(mockRegistryManager.createDefaults);
                sinon.assert.calledOnce(mockContext.transactionRollback);
                sinon.assert.calledOnce(mockContext.transactionEnd);
            }
        });
    });

    describe('#start', () => {

        let tx;
        let json;
        let stubSubmitTransaction;

        beforeEach(() => {
            tx = factory.newTransaction('org.hyperledger.composer.system', 'StartBusinessNetwork');
            json = serializer.toJSON(tx);
            stubSubmitTransaction = sandbox.stub(engine, 'submitTransaction');
            stubSubmitTransaction.resolves();

            const sysdata = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysdata').resolves(sysdata);
            const sysregistries = sinon.createStubInstance(DataCollection);
            mockDataService.ensureCollection.withArgs('$sysregistries').resolves(sysregistries);
        });

        it('should reject for invalid arguments', () => {
            return engine.start(mockContext, ['no', 'args', 'supported'])
                .should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "start", expecting "\[\"serializedResource\"\]"/);
        });

        it('should reject for a missing $class', () => {
            delete json.$class;
            return engine.start(mockContext, [JSON.stringify(json)])
                .should.be.rejectedWith(/The transaction data specified is not valid/);
        });

        it('should reject for an invalid $class', () => {
            json.$class = 'WoopWoop';
            return engine.start(mockContext, [JSON.stringify(json)])
                .should.be.rejectedWith(/The transaction data specified is not valid/);
        });

        it('should enable logging if logging specified on the init', async () => {
            json.logLevel = 'DEBUG';
            await engine.start(mockContext, [JSON.stringify(json)]);
            sinon.assert.calledWith(Logger.setLoggerCfg, { debug: 'composer[debug]:theworld', logger: 'config' });
        });

        it('should create system collections', () => {
            return engine.start(mockContext, [JSON.stringify(json)]).then(() => {
                sinon.assert.calledWith(mockDataService.ensureCollection, '$sysdata');
                sinon.assert.calledWith(mockDataService.ensureCollection, '$sysregistries');
            });
        });

        it('should create default registries', () => {
            return engine.start(mockContext, [JSON.stringify(json)]).then(() => {
                sinon.assert.called(mockRegistryManager.createDefaults);
            });
        });

        it('should rollback if an error occurs', () => {
            stubSubmitTransaction.rejects();
            return engine.start(mockContext, [JSON.stringify(json)])
                .should.be.rejected
                .then(() => {
                    sinon.assert.calledWithExactly(mockContext.transactionStart, false);
                    sinon.assert.notCalled(mockContext.transactionPrepare);
                    sinon.assert.notCalled(mockContext.transactionCommit);
                    sinon.assert.calledOnce(mockContext.transactionRollback);
                    sinon.assert.calledOnce(mockContext.transactionEnd);
                });
        });

        it('should execute any specified bootstrap transactions', () => {
            json.bootstrapTransactions = [
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#doges',
                    resources: [
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        },
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        }
                    ]
                },
                {
                    $class: 'org.hyperledger.composer.system.BindIdentity',
                    participant: 'resource:org.acme.SampleParticipant#PARTICIPANT_1',
                    certificate: '----BEGIN CERTIFICATE\nsuch certificate\n----END CERTIFICATE-----\n'
                }
            ];
            return engine.init(mockContext, 'start', [JSON.stringify(json)]).then(() => {
                const txs = engine.submitTransaction.args.map((arg) => {
                    return JSON.parse(arg[1]);
                });
                txs[0].$class.should.equal(json.bootstrapTransactions[0].$class);
                txs[0].transactionId.should.equal(json.transactionId + '#0');
                txs[1].$class.should.equal(json.bootstrapTransactions[1].$class);
                txs[1].transactionId.should.equal(json.transactionId + '#1');
            });
        });

        it('should execute StartBusinessNetwork after bootstrap transactions', () => {
            json.bootstrapTransactions = [
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#doges',
                    resources: [
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        },
                        {
                            $class: 'org.acme.SampleParticipant',
                            participantId: 'PARTICIPANT_1'
                        }
                    ]
                },
                {
                    $class: 'org.hyperledger.composer.system.BindIdentity',
                    participant: 'resource:org.acme.SampleParticipant#PARTICIPANT_1',
                    certificate: '----BEGIN CERTIFICATE\nsuch certificate\n----END CERTIFICATE-----\n'
                }
            ];
            return engine.init(mockContext, 'start', [JSON.stringify(json)]).then(() => {
                sinon.assert.calledThrice(engine.submitTransaction);
                const txs = engine.submitTransaction.args.map((arg) => {
                    return JSON.parse(arg[1]);
                });
                txs[2].$class.should.equal('org.hyperledger.composer.system.StartBusinessNetwork');
                txs[2].transactionId.should.equal(json.transactionId);
            });
        });

    });

    describe('#invoke', () => {

        it('should throw for an unrecognized function', async () => {
            await engine.invoke(mockContext, 'blahblahblah', [])
                .should.be.rejectedWith(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should throw for a hidden function', async () => {
            engine._test = sinon.stub().resolves();
            await engine.invoke(mockContext, '_test', [])
                .should.be.rejectedWith(/Unsupported function "_test" with arguments "\[\]"/);
        });

        it('should initialize the context and call the function that returns no data', async () => {
            engine.test = sinon.stub().resolves();
            const result = await engine.invoke(mockContext, 'test', []);
            should.equal(result, undefined);
            sinon.assert.calledOnce(mockContext.initialize);
            sinon.assert.calledWith(mockContext.initialize, {
                function: 'test',
                container: {},
                arguments: []
            });
            sinon.assert.calledOnce(engine.test);
            sinon.assert.calledWith(engine.test, mockContext, []);
            sinon.assert.calledOnce(mockContext.transactionStart);
            sinon.assert.calledWith(mockContext.transactionStart, false);
            sinon.assert.calledOnce(mockContext.transactionPrepare);
            sinon.assert.calledOnce(mockContext.transactionCommit);
            sinon.assert.notCalled(mockContext.transactionRollback);
            sinon.assert.calledOnce(mockContext.transactionEnd);
        });

        it('should initialize the context and call the function that returns data', async () => {
            engine.test = sinon.stub().resolves({ hello: 'world' });
            const result = await engine.invoke(mockContext, 'test', []);
            result.should.deep.equal({ hello: 'world' });
            sinon.assert.calledOnce(mockContext.initialize);
            sinon.assert.calledWith(mockContext.initialize, {
                function: 'test',
                container: {},
                arguments: []
            });
            sinon.assert.calledOnce(engine.test);
            sinon.assert.calledWith(engine.test, mockContext, []);
            sinon.assert.calledOnce(mockContext.transactionStart);
            sinon.assert.calledWith(mockContext.transactionStart, false);
            sinon.assert.calledOnce(mockContext.transactionPrepare);
            sinon.assert.calledOnce(mockContext.transactionCommit);
            sinon.assert.notCalled(mockContext.transactionRollback);
            sinon.assert.calledOnce(mockContext.transactionEnd);
        });

        it('should handle an error from calling the function', async () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            await engine.invoke(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/);
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

    describe('#query', () => {

        it('should throw for an unrecognized function', async () => {
            await engine.query(mockContext, 'blahblahblah', [])
                .should.be.rejectedWith(/Unsupported function "blahblahblah" with arguments "\[\]"/);
        });

        it('should throw for a hidden function', async () => {
            engine._test = sinon.stub().resolves();
            await engine.query(mockContext, '_test', [])
                .should.be.rejectedWith(/Unsupported function "_test" with arguments "\[\]"/);
        });

        it('should initialize the context and call the function that returns data', async () => {
            engine.test = sinon.stub().resolves({ hello: 'world' });
            const result = await engine.query(mockContext, 'test', []);
            result.should.deep.equal({ hello: 'world' });
            sinon.assert.calledWith(mockContext.initialize, {
                function: 'test',
                container: {},
                arguments: []
            });
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

        it('should handle an error from calling the function', async () => {
            engine.test = sinon.stub().rejects(new Error('ruhroh'));
            await engine.query(mockContext, 'test', [])
                .should.be.rejectedWith(/ruhroh/);
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

    describe('#ping', () => {

        it('should throw for invalid arguments', async () => {
            await engine.query(mockContext, 'ping', ['no', 'args', 'supported'])
                .should.be.rejectedWith(/Invalid arguments "\["no","args","supported"\]" to function "ping", expecting "\[\]"/);
        });

        it('should return an object containing the version', async () => {
            const result = await engine.query(mockContext, 'ping', []);
            result.should.deep.equal({
                version: version,
                participant: null,
                identity: null
            });
        });

        it('should return an object containing the current participant', async () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockContext.getParticipant.returns(mockParticipant);
            const result = await engine.query(mockContext, 'ping', []);
            result.should.deep.equal({
                version: version,
                participant: 'org.doge.Doge#DOGE_1',
                identity: null
            });
        });

        it('should return an object containing the current identity', async () => {
            let mockIdentity = sinon.createStubInstance(Resource);
            mockIdentity.getFullyQualifiedIdentifier.returns('org.hyperledger.composer.system.Identity#IDENTITY_1');
            mockContext.getIdentity.returns(mockIdentity);
            const result = await engine.query(mockContext, 'ping', []);
            result.should.deep.equal({
                version: version,
                participant: null,
                identity: 'org.hyperledger.composer.system.Identity#IDENTITY_1'
            });
        });

        it('should return an object containing the current participant and identity', async () => {
            let mockParticipant = sinon.createStubInstance(Resource);
            mockParticipant.getFullyQualifiedIdentifier.returns('org.doge.Doge#DOGE_1');
            mockContext.getParticipant.returns(mockParticipant);
            let mockIdentity = sinon.createStubInstance(Resource);
            mockIdentity.getFullyQualifiedIdentifier.returns('org.hyperledger.composer.system.Identity#IDENTITY_1');
            mockContext.getIdentity.returns(mockIdentity);
            const result = await engine.query(mockContext, 'ping', []);
            result.should.deep.equal({
                version: version,
                participant: 'org.doge.Doge#DOGE_1',
                identity: 'org.hyperledger.composer.system.Identity#IDENTITY_1'
            });
        });

    });

});
