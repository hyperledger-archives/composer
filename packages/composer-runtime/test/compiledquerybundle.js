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

const CompiledQueryBundle = require('../lib/compiledquerybundle');
const ModelManager = require('composer-common').ModelManager;
const QueryCompiler = require('../lib/querycompiler');
const QueryManager = require('composer-common').QueryManager;
const QueryService = require('../lib/queryservice');

require('chai').should();
const sinon = require('sinon');
require('sinon-as-promised');

describe('CompiledQueryBundle', () => {

    const fakeQueryString = '{"selector":{"\\\\$class":"org.acme.sample.SampleAsset","value":{"$eq":"Green hat"}}}';
    const fakeQueryResults = [{ such: 'things' }, { much: 'wow '}];

    let queryCompiler;
    let modelManager;
    let queryManager;
    let query1;
    let query2;
    let query3;
    let compiledQueryBundle;
    let mockQueryService;

    beforeEach(() => {
        queryCompiler = new QueryCompiler();
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace org.acme.sample

        concept SampleConcept {
            o String value
        }

        asset SampleAsset identified by assetId {
            o String assetId
            --> SampleParticipant owner
            o String value
        }

        participant SampleParticipant identified by participantId {
            o String participantId
            o String firstName
            o String lastName
        }

        transaction SampleTransaction identified by transactionId {
            o String transactionId
            o String newValue
        }`);
        queryManager = new QueryManager(modelManager);
        query1 = {
            name: 'Q1',
            hash: '32d833f348ce377c8cc3291cc520213770d5d519d7970540c1c36c4261c140cc',
            generator: sinon.stub().returns(fakeQueryString)
        };
        query2 = {
            name: 'Q2',
            hash: '8845886be6cbcf285d18a66a83d622fdcf265ba4451ea2b2f4189ebf04eba915',
            generator: sinon.stub().returns(fakeQueryString)
        };
        query3 = {
            name: 'Q3',
            hash: '9fc58f1abf0d4f134609c7572d4475fd5b6469591323164a998d435099198294',
            generator: sinon.stub().returns(fakeQueryString)
        };
        compiledQueryBundle = new CompiledQueryBundle(queryCompiler, queryManager, [query1, query2, query3]);
        mockQueryService = sinon.createStubInstance(QueryService);
        mockQueryService.queryNative.resolves(fakeQueryResults);
    });

    describe('#buildQuery', () => {

        it('should build a new query and return an identifier', () => {
            const identifier = compiledQueryBundle.buildQuery('SELECT org.acme.sample.SampleAsset');
            identifier.should.equal('47c3ada49abf4704f9a0cdbabfdde9fa6fdb83872755b481a9cca607e8fce09d');
        });

        it('should keep returning the same identifier', () => {
            let identifier = compiledQueryBundle.buildQuery('SELECT org.acme.sample.SampleAsset');
            identifier.should.equal('47c3ada49abf4704f9a0cdbabfdde9fa6fdb83872755b481a9cca607e8fce09d');
            identifier = compiledQueryBundle.buildQuery('SELECT org.acme.sample.SampleAsset');
            identifier.should.equal('47c3ada49abf4704f9a0cdbabfdde9fa6fdb83872755b481a9cca607e8fce09d');
        });

        it('should return the identifier of a predefined query', () => {
            const identifier = compiledQueryBundle.buildQuery('Q3');
            identifier.should.equal('9fc58f1abf0d4f134609c7572d4475fd5b6469591323164a998d435099198294');
        });

    });

    describe('#execute', () => {

        it('should throw for an unrecognized query', () => {
            (() => {
                compiledQueryBundle.execute(mockQueryService, 'QA');
            }).should.throw(/The specified query does not exist/);
        });

        it('should execute a named query using the query service', () => {
            return compiledQueryBundle.execute(mockQueryService, 'Q1')
                .then((result) => {
                    sinon.assert.calledOnce(query1.generator);
                    sinon.assert.calledWith(query1.generator);
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, fakeQueryString);
                    result.should.deep.equal(fakeQueryResults);
                });
        });

        it('should execute a named query with parameters using the query service', () => {
            return compiledQueryBundle.execute(mockQueryService, 'Q2', { foo: 'bar' })
                .then((result) => {
                    sinon.assert.calledOnce(query2.generator);
                    sinon.assert.calledWith(query2.generator, { foo: 'bar' });
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, fakeQueryString);
                    result.should.deep.equal(fakeQueryResults);
                });
        });

        it('should execute a built query using the query service', () => {
            let identifier = compiledQueryBundle.buildQuery('SELECT org.acme.sample.SampleAsset');
            return compiledQueryBundle.execute(mockQueryService, identifier)
                .then((result) => {
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, '{"selector":{"\\\\$class":"org.acme.sample.SampleAsset","\\\\$registryType":"Asset","\\\\$registryID":"org.acme.sample.SampleAsset"}}');
                    result.should.deep.equal(fakeQueryResults);
                });
        });

        it('should execute a built query with parameters using the query service', () => {
            let identifier = compiledQueryBundle.buildQuery('SELECT org.acme.sample.SampleAsset WHERE (value == _$foo)');
            return compiledQueryBundle.execute(mockQueryService, identifier, { foo: 'bar' })
                .then((result) => {
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, '{"selector":{"\\\\$class":"org.acme.sample.SampleAsset","\\\\$registryType":"Asset","\\\\$registryID":"org.acme.sample.SampleAsset","value":{"$eq":"bar"}}}');
                    result.should.deep.equal(fakeQueryResults);
                });
        });

    });

    describe('#executeInternal', () => {

        it('should execute the query using the query service', () => {
            return compiledQueryBundle.executeInternal(mockQueryService, query1)
                .then((result) => {
                    sinon.assert.calledOnce(query1.generator);
                    sinon.assert.calledWith(query1.generator);
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, fakeQueryString);
                    result.should.deep.equal(fakeQueryResults);
                });
        });

        it('should execute the query with parameters using the query service', () => {
            return compiledQueryBundle.executeInternal(mockQueryService, query2, { foo: 'bar' })
                .then((result) => {
                    sinon.assert.calledOnce(query2.generator);
                    sinon.assert.calledWith(query2.generator, { foo: 'bar' });
                    sinon.assert.calledOnce(mockQueryService.queryNative);
                    sinon.assert.calledWith(mockQueryService.queryNative, fakeQueryString);
                    result.should.deep.equal(fakeQueryResults);
                });
        });

    });

});
