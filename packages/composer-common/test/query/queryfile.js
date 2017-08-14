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

const Query = require('../../lib/query/query');
const QueryFile = require('../../lib/query/queryfile');
const parser = require('../../lib/query/parser');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('QueryFile', () => {

    const testQuery = fs.readFileSync(path.resolve(__dirname, '../data/query/test.qry'), 'utf8');
    const invalidQuery = fs.readFileSync(path.resolve(__dirname, '../data/query/invalid.qry'), 'utf8');
    const testModel = fs.readFileSync(path.resolve(__dirname, '../data/query/model.cto'), 'utf8');

    let modelManager;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(testModel);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null definitions provided', () => {
            (() => {
                new QueryFile(modelManager, null);
            }).should.throw(/as a string as input/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                new QueryFile( 'test', modelManager, [{}]);
            }).should.throw(/as a string as input/);
        });

        it('should handle an empty definitions string', () => {
            const queryFile = new QueryFile('test', modelManager, '');
            queryFile.getQueries().should.deep.equal([]);
        });

        it('should call the parser with the definitions and save the abstract syntax tree', () => {
            const ast = {
                queries: [ {identifier: {name: 'fake'}, description: 'foo', select: {resource: 'org.acme.Driver', where: {} } } ]
            };
            sandbox.stub(parser, 'parse').returns(ast);
            let mf = new QueryFile( 'test', modelManager, 'fake definitions');
            mf.ast.should.equal(ast);
        });

        it('should throw a ParseException on invalid input', () => {
            (() => {
                new QueryFile('test.qry', modelManager, invalidQuery);
            }).should.throw(/Line 3/);
        });

        it('should throw an error if it does not have a location', () => {
            (() => {
                sandbox.stub(parser, 'parse').throws(new Error('such error'));
                new QueryFile('test.acl', modelManager, invalidQuery);
            }).should.throw(/such error/);
        });

        it('should parse a query correctly', () => {
            const queryContents = `query Q1 {
                description: "Select all cars"
                statement: SELECT org.acme.Car
            }
            query Q2 {
                description: "Select all regulators"
                statement: SELECT org.acme.Regulator FROM mycustomer.Registry
            }`;
            const queryFile = new QueryFile('test.qry', modelManager, queryContents);
            queryFile.getIdentifier().should.equal('test.qry');
            queryFile.getQueries().length.should.equal(2);
            queryFile.getDefinitions().should.equal(queryContents);
            for(let n=0; n < queryFile.getQueries().length; n++ ) {
                let q = queryFile.getQueries()[n];
                if( n === 0 ){
                    q.getName().should.equal('Q1');
                    q.getDescription().should.equal('Select all cars');
                } else if( n === 1){
                    q.getName().should.equal('Q2');
                    q.getDescription().should.equal('Select all regulators');
                }
            }
        });
    });

    describe('#validate', () => {

        it('should validate correct contents', () => {
            const queryFile = new QueryFile( 'test.qry', modelManager, testQuery);
            queryFile.validate();
        });

        it('should throw for duplicate query names', () => {
            const queryContents = `query Q1 {
                description: "some rule"
                statement: SELECT org.acme.Car
            }

            query Q1 {
                description: "some rule"
                statement: SELECT org.acme.Car
            }`;

            const queryFile = new QueryFile('test.qry', modelManager, queryContents);
            (() => {
                queryFile.validate();
            }).should.throw(/Found two or more queries with the name/);
        });

    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let queryFile = new QueryFile('test.qry', modelManager, testQuery);
            let visitor = {
                visit: sinon.stub()
            };
            queryFile.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, queryFile, ['some', 'args']);
        });
    });

    describe('#buildQuery', () => {

        it('should programatically add a query to the query file', () => {

            const queryFile = new QueryFile('generated.qry', modelManager, '');
            const query = queryFile.buildQuery('GEN1', 'Generated query 1', 'SELECT org.acme.Car');
            query.should.be.an.instanceOf(Query);
            query.getName().should.equal('GEN1');
            query.getDescription().should.equal('Generated query 1');
            query.getSelect().getText().should.equal('SELECT org.acme.Car');
            queryFile.getQueries().find((query) => {
                return query.getName() === 'GEN1';
            }).should.equal(query);
        });

    });

});
