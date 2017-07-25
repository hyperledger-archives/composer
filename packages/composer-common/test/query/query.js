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
const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const AssetDeclaration = require('../../lib/introspect/assetdeclaration');
const ParticipantDeclaration = require('../../lib/introspect/participantdeclaration');
const Property = require('../../lib/introspect/property');
const parser = require('../../lib/query/parser');
require('chai').should();
const sinon = require('sinon');

describe('Query', () => {

    let query;
    let queryFile;
    let mockModelManager;
    let mockModelFile;
    let mockAssetDeclaration;
    let mockParticipantDeclaration;
    let mockProperty;
    let sandbox;

    const ast = {
        type: 'Query',
        identifier: {
            type: 'Identifier',
            name: 'Q4'
        },
        description: 'Select all Drivers called Dan',
        select: {
            type: 'SELECT',
            resource: 'org.acme.Driver',
            where: {
                type: 'BinaryExpression',
                operator: '==',
                left: {
                    type: 'Identifier',
                    name: 'firstName'
                },
                right: {
                    type: 'Literal',
                    value: 'Dan'
                }
            },
            limit: null,
            skip: null,
            orderBy: null,
            text: 'SELECT org.acme.Driver WHERE (firstName=="Dan")'
        },
    };

    const invalidAst = {
        type: 'Query',
        identifier: {
            type: 'Identifier',
            name: 'Q1'
        },
        description: 'Select all drivers',
        select: {}
    };

    beforeEach(() => {
        queryFile = sinon.createStubInstance(QueryFile);
        mockModelManager = sinon.createStubInstance(ModelManager);
        queryFile.getModelManager.returns(mockModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
        mockAssetDeclaration.ast = {location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }};
        mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
        mockParticipantDeclaration.ast = {location: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 22, line: 1, column: 23 } }};
        mockModelManager.getModelFile.withArgs('org.acme').returns(mockModelFile);
        mockModelManager.getType.withArgs('org.acme.Driver').returns(mockParticipantDeclaration);
        mockModelFile.getLocalType.withArgs('Car').returns(mockAssetDeclaration);
        mockModelFile.getLocalType.withArgs('Driver').returns(mockParticipantDeclaration);
        mockProperty = sinon.createStubInstance(Property);
        mockProperty.getType.returns('String');
        mockProperty.isPrimitive.returns(true);
        mockParticipantDeclaration.getNestedProperty.withArgs('firstName').returns(mockProperty);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw when null QueryFile provided', () => {
            (() => {
                new Query(null, {} );
            }).should.throw(/Invalid QueryFile or AST/);
        });

        it('should throw when invalid definitions provided', () => {
            (() => {
                new Query(queryFile,  null);
            }).should.throw(/Invalid QueryFile or AST/);
        });
    });

    describe('#validate', () => {

        it('it should validate correct contents', () => {
            query = new Query( queryFile, ast );
            query.validate();
        });

        it('should throw for invalid ast contents', () => {
            let q = new Query( queryFile, invalidAst );
            (() => {
                q.validate();
            }).should.throw(/Type does not exist undefined/);
        });
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            query = new Query( queryFile, ast);
            let visitor = {
                visit: sinon.stub()
            };
            query.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, query, ['some', 'args']);
        });
    });

    describe('#buildQuery', () => {

        it('should programatically add a query to the query file', () => {
            const queryFile = new QueryFile('generated.qry', mockModelManager, '');
            const query = Query.buildQuery(queryFile, 'GEN1', 'Generated query 1', 'SELECT org.acme.Car');
            query.should.be.an.instanceOf(Query);
            query.getName().should.equal('GEN1');
            query.getDescription().should.equal('Generated query 1');
            query.getSelect().getText().should.equal('SELECT org.acme.Car');

        });

        it('should throw a ParseException on invalid input', () => {
            (() => {
                const queryFile = new QueryFile('generated.qry', mockModelManager, '');
                Query.buildQuery(queryFile, 'GEN1', 'Generated query 1', 'SELECT');
            }).should.throw(/Line 1/);
        });

        it('should throw an error if it does not have a location', () => {
            (() => {
                const queryFile = new QueryFile('generated.qry', mockModelManager, '');
                sandbox.stub(parser, 'parse').throws(new Error('such error'));
                Query.buildQuery(queryFile, 'GEN1', 'Generated query 1', '');
            }).should.throw(/such error/);
        });

    });
});