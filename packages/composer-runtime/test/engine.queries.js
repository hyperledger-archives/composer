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

const AccessController = require('../lib/accesscontroller');
const CompiledQueryBundle = require('../lib/compiledquerybundle');
const Container = require('../lib/container');
const Context = require('../lib/context');
const DataService = require('../lib/dataservice');
const Engine = require('../lib/engine');
const LoggingService = require('../lib/loggingservice');
const Resource = require('composer-common').Resource;
const Serializer = require('composer-common').Serializer;

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');


describe('EngineQueries', () => {

    let mockContainer;
    let mockLoggingService;
    let mockContext;
    let mockDataService;
    let mockCompiledQueryBundle;
    let mockAccessController;
    let mockSerializer;
    let mockResource1, mockResource2;
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
        mockDataService = sinon.createStubInstance(DataService);
        mockContext.getDataService.returns(mockDataService);
        mockCompiledQueryBundle = sinon.createStubInstance(CompiledQueryBundle);
        mockContext.getCompiledQueryBundle.returns(mockCompiledQueryBundle);
        mockAccessController = sinon.createStubInstance(AccessController);
        mockAccessController.check.resolves();
        mockContext.getAccessController.returns(mockAccessController);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockContext.getSerializer.returns(mockSerializer);
        mockResource1 = sinon.createStubInstance(Resource);
        mockResource1.$identifier = 'ASSET_1';
        mockResource2 = sinon.createStubInstance(Resource);
        mockResource2.$identifier = 'ASSET_2';
        engine = new Engine(mockContainer);
        mockCompiledQueryBundle.buildQuery.returns('5769993d7c0a008e0cb45e30a36e3f2797c47c065be7f214c5dcee90419d326f');
        mockCompiledQueryBundle.execute.resolves([
            { $identifier: 'ASSET_1', $registryId: 'registry1' },
            { $identifier: 'ASSET_2', $registryId: 'registry2' }
        ]);
        mockSerializer.fromJSON.withArgs({ $identifier: 'ASSET_1' }).returns(mockResource1);
        mockSerializer.fromJSON.withArgs({ $identifier: 'ASSET_2' }).returns(mockResource2);
        mockSerializer.toJSON.withArgs(mockResource1).returns({ $identifier: 'ASSET_1' });
        mockSerializer.toJSON.withArgs(mockResource2).returns({ $identifier: 'ASSET_2' });
    });

    describe('#executeQuery', () => {

        it('should throw for invalid arguments', () => {
            let result = engine.query(mockContext, 'executeQuery', ['not', 'enough', 'args', 'provided']);
            return result.should.be.rejectedWith(/Invalid arguments "\["not","enough","args","provided"\]" to function "executeQuery", expecting "\["queryType","query","parameters"\]"/);
        });

        it('should throw for an invalid query type', () => {
            return engine.query(mockContext, 'executeQuery', ['ooga', 'booga', 'doge'])
                .should.be.rejectedWith(/Invalid argument "queryType"/);
        });

        it('should return the results of a built query', () => {
            return engine.query(mockContext, 'executeQuery', ['build', 'SELECT doge', '{"param1":true}'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, '5769993d7c0a008e0cb45e30a36e3f2797c47c065be7f214c5dcee90419d326f', { param1: true });
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.deep.equal([
                        { $identifier: 'ASSET_1' },
                        { $identifier: 'ASSET_2' }
                    ]);
                });
        });

        it('should return the results of a built query with an ACL limiting the results', () => {
            mockAccessController.check.withArgs(mockResource2, 'READ').rejects(new Error('no access'));
            return engine.query(mockContext, 'executeQuery', ['build', 'SELECT doge', '{"param1":true}'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, '5769993d7c0a008e0cb45e30a36e3f2797c47c065be7f214c5dcee90419d326f', { param1: true });
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.deep.equal([
                        { $identifier: 'ASSET_1' }
                    ]);
                });
        });

        it('should return the results of a named query', () => {
            return engine.query(mockContext, 'executeQuery', ['named', 'Q1', '{"param1":true}'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, 'Q1', { param1: true });
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.deep.equal([
                        { $identifier: 'ASSET_1' },
                        { $identifier: 'ASSET_2' }
                    ]);
                });
        });

        it('should return the results of a named query with an ACL limiting the results', () => {
            mockAccessController.check.withArgs(mockResource2, 'READ').rejects(new Error('no access'));
            return engine.query(mockContext, 'executeQuery', ['named', 'Q1', '{"param1":true}'])
                .then((resources) => {
                    sinon.assert.calledOnce(mockCompiledQueryBundle.execute);
                    sinon.assert.calledWith(mockCompiledQueryBundle.execute, mockDataService, 'Q1', { param1: true });
                    sinon.assert.calledTwice(mockAccessController.check);
                    sinon.assert.calledWith(mockAccessController.check, mockResource1, 'READ');
                    sinon.assert.calledWith(mockAccessController.check, mockResource2, 'READ');
                    resources.should.deep.equal([
                        { $identifier: 'ASSET_1' }
                    ]);
                });
        });

    });

});
