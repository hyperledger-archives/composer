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

const QueryFile = require('../lib/query/queryfile');
const QueryManager = require('../lib/querymanager');
const fs = require('fs');
const ModelManager = require('../lib/modelmanager');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('QueryManager', () => {

    const testQuery = fs.readFileSync(path.resolve(__dirname, 'data/query', 'test.qry'), 'utf8');
    const testModel = fs.readFileSync(path.resolve(__dirname, 'data/query', 'model.cto'), 'utf8');

    let modelManager;
    let queryFile;
    let sandbox;
    let dummyQueries = ['test'];

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        queryFile = sinon.createStubInstance(QueryFile);
        queryFile.getQueries.returns(dummyQueries);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let qm = new QueryManager(modelManager);
            let visitor = {
                visit: sinon.stub()
            };
            qm.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, qm, ['some', 'args']);
        });

    });

    describe('#createQueryFile', () => {

        it('should create a new Query file', () => {
            let qm = new QueryManager(modelManager);
            let query = qm.createQueryFile('queries.qrl', testQuery);
            query.should.be.an.instanceOf(QueryFile);
        });

    });

    describe('#queryFile', () => {

        it('should set & get the query file', () => {
            let qm = new QueryManager(modelManager);
            qm.getQueries().length.should.equal(0);
            qm.setQueryFile(queryFile);
            qm.getQueryFile().should.equal(queryFile);
            qm.getQueries().should.equal(dummyQueries);
        });
    });

    describe('#deleteQueryFile', () => {

        it('should delete the query file', () => {
            let qm = new QueryManager(modelManager);
            qm.setQueryFile(queryFile);
            qm.getQueryFile().should.equal(queryFile);
            qm.deleteQueryFile();
            should.not.exist(qm.getQueryFile());
        });

    });

    describe('#getQuery', () => {

        it('should return a named query', () => {
            let qm = new QueryManager(modelManager);
            let queryFile = qm.createQueryFile('test.qrl', testQuery);
            qm.setQueryFile(queryFile);
            qm.getQuery('Q23').getName().should.equal('Q23');
        });

        it('should return null for unknown query', () => {
            let qm = new QueryManager(modelManager);
            let queryFile = qm.createQueryFile('test.qrl', testQuery);
            qm.setQueryFile(queryFile);
            (qm.getQuery('xxxx') === null).should.be.true;
        });
    });

});
