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

const ModelManager = require('composer-common').ModelManager;
const QueryCompiler = require('../lib/querycompiler');
const QueryFile = require('composer-common').QueryFile;
const QueryManager = require('composer-common').QueryManager;

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('QueryCompiler', () => {

    let queryCompiler;
    let modelManager;
    let queryFile1;
    let queries;
    let selectsFromQueries;
    let wheresFromQueries;
    let orderBysFromQueries;
    let limitsFromQueries;
    let skipsFromQueries;
    let queryManager;

    beforeEach(() => {
        queryCompiler = new QueryCompiler();
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace org.acme.sample

        concept SampleConcept {
            o String value
        }

        concept Meow {
            o String woof
        }

        concept Neigh {
            o Meow meow
        }

        concept Moo {
            o Neigh neigh
        }

        concept Baa {
            o Moo moo
        }

        asset SampleAsset identified by assetId {
            o String assetId
            --> SampleParticipant owner
            o String value
            o String foo
            o String bar
            o Baa baa
            o String[] noises
            o Meow[] meows
        }

        participant SampleParticipant identified by participantId {
            o String participantId
            o String firstName
            o String lastName
        }

        transaction SampleTransaction {
            o String newValue
        }`);
        queryFile1 = new QueryFile('test.qry', modelManager, `
        query Q1 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (value == "Green hat")
        }
        query Q2 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
        }
        query Q3 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    LIMIT 5
        }
        query Q4 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    SKIP 10
        }
        query Q5 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    LIMIT 5
                    SKIP 10
        }
        query Q6 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    LIMIT _$mylimit
        }
        query Q7 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    SKIP _$myskip
        }
        query Q8 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (value == _$foo)
        }
        query Q9 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    FROM DogesSampleAssets
        }
        query Q10 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleParticipant
        }
        query Q11 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleTransaction
        }
        query Q12 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    ORDER BY foo DESC
        }
        query Q13 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    ORDER BY [foo ASC, bar DESC]
        }
        query Q14 {
            description: "Select all drivers aged older than PARAM"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (baa.moo.neigh.meow.woof == _$animalNoise)
        }
        query Q15 {
            description: "Simple Historian Query"
            statement:
                SELECT org.hyperledger.composer.system.HistorianRecord
                    FROM HistorianRegistry
        }
        query Q16 {
            description: "Simple Historian Query"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (noises CONTAINS "baa")
        }
        query Q17 {
            description: "Simple Historian Query"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (noises CONTAINS ["baa","moo"])
        }
        query Q18 {
            description: "Simple Historian Query"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (meows CONTAINS (woof == "foo"))
        }
        query Q19 {
            description: "Simple Historian Query"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (meows CONTAINS ((woof == "foo") OR (woof == "noo")))
        }
        `);
        queryFile1.validate();
        queries = {};
        selectsFromQueries = {};
        wheresFromQueries = {};
        orderBysFromQueries = {};
        limitsFromQueries = {};
        skipsFromQueries = {};
        queryFile1.getQueries().forEach((query) => {
            const name = query.getName();
            queries[name] = query;
            selectsFromQueries[name] = query.getSelect();
            wheresFromQueries[name] = query.getSelect().getWhere();
            orderBysFromQueries[name] = query.getSelect().getOrderBy();
            limitsFromQueries[name] = query.getSelect().getLimit();
            skipsFromQueries[name] = query.getSelect().getSkip();
        });
        queryManager = new QueryManager(modelManager);
        queryManager.setQueryFile(queryFile1);
    });

    describe('#compile', () => {

        it('should compile all of the scripts in the specified script manager into a bundle', () => {
            const compiledQueryBundle = queryCompiler.compile(queryManager);
            compiledQueryBundle.queryCompiler.should.equal(queryCompiler);
            compiledQueryBundle.compiledQueries.should.be.an('array');
            compiledQueryBundle.compiledQueries.should.have.lengthOf(19);
            compiledQueryBundle.compiledQueries.should.all.have.property('name');
            compiledQueryBundle.compiledQueries.should.all.have.property('hash');
            compiledQueryBundle.compiledQueries.should.all.have.property('generator');
        });

    });

    describe('#visit', () => {

        it('should visit all of the things', () => {
            const compiled = queryCompiler.visit(queryManager, {});
            compiled.should.be.an('array');
            compiled.should.have.lengthOf(19);
            compiled.should.all.have.property('name');
            compiled.should.all.have.property('hash');
            compiled.should.all.have.property('generator');
        });

        it('should throw if something invalid is visited', () => {
            (() => {
                queryCompiler.visit(3.142, {});
            }).should.throw(/Unrecognised type/);
        });

    });

    describe('#visitQueryManager', () => {

        it('should compile all queries in the query manager', () => {
            const compiled = queryCompiler.visitQueryManager(queryManager, {});
            compiled.should.be.an('array');
            compiled.should.have.lengthOf(19);
            compiled.should.all.have.property('name');
            compiled.should.all.have.property('hash');
            compiled.should.all.have.property('generator');
        });

        it('should handle no queries in the query manager', () => {
            queryManager.queryFile = null;
            const compiled = queryCompiler.visitQueryManager(queryManager, {});
            compiled.should.be.an('array');
            compiled.should.have.lengthOf(0);
        });

    });

    describe('#visitQueryFile', () => {

        it('should compile all queries in the query file', () => {
            const compiled = queryCompiler.visitQueryFile(queryFile1, {});
            compiled.should.be.an('array');
            compiled.should.have.lengthOf(19);
            compiled.should.all.have.property('name');
            compiled.should.all.have.property('hash');
            compiled.should.all.have.property('generator');
        });

    });

    describe('#visitQuery', () => {

        it('should compile a query with no parameters', () => {
            const compiled = queryCompiler.visitQuery(queries.Q1, {});
            compiled.name.should.equal('Q1');
            compiled.hash.should.equal('d35890cac366631b31745dc6376e5d8414ef441ff66c606505f6bed898d9700c');
            compiled.generator.should.be.a('function');
            compiled.generator({}).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","value":{"$eq":"Green hat"}}}');
        });

        it('should compile a query with parameters', () => {
            const compiled = queryCompiler.visitQuery(queries.Q8, {});
            compiled.name.should.equal('Q8');
            compiled.hash.should.equal('c4a085154080078b7a2a1f572f92a28bc679b1e40526343aed4460fc62757a9b');
            compiled.generator.should.be.a('function');
            compiled.generator({ foo: 'Green hat' }).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","value":{"$eq":"Green hat"}}}');
        });

        it('should compile a query with parameters that be can changed for each execution', () => {
            const compiled = queryCompiler.visitQuery(queries.Q8, {});
            compiled.name.should.equal('Q8');
            compiled.hash.should.equal('c4a085154080078b7a2a1f572f92a28bc679b1e40526343aed4460fc62757a9b');
            compiled.generator.should.be.a('function');
            compiled.generator({ foo: 'Green hat' }).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","value":{"$eq":"Green hat"}}}');
            compiled.generator({ foo: 'Black hat' }).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","value":{"$eq":"Black hat"}}}');
            compiled.generator({ foo: 'Red hat' }).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","value":{"$eq":"Red hat"}}}');
        });

        it('should compile a query with nested parameters', () => {
            const compiled = queryCompiler.visitQuery(queries.Q14, {});
            compiled.name.should.equal('Q14');
            compiled.hash.should.equal('951f2465d94148ffbe2e4c081fe6c8f73f95056ccdb8be3dcb8180ba6f3d9098');
            compiled.generator.should.be.a('function');
            compiled.generator({ animalNoise: 'ribbet' }).should.equal('{"selector":{"$class":"org.acme.sample.SampleAsset","$registryType":"Asset","$registryId":"org.acme.sample.SampleAsset","baa.moo.neigh.meow.woof":{"$eq":"ribbet"}}}');
        });

    });

    describe('#buildTrivialCompiledQueryGenerator', () => {

        it('should build a compiled query generator with no parameters', () => {
            const generator = queryCompiler.buildTrivialCompiledQueryGenerator({selector: {}});
            generator.should.be.a('function');
            generator({}).should.equal('{"selector":{}}');
        });

        it('should build a compiled query generator that throws if any parameters are supplied', () => {
            const generator = queryCompiler.buildTrivialCompiledQueryGenerator({selector: {}});
            generator.should.be.a('function');
            (() => {
                generator({ myvar: 1 });
            }).should.throw(/No parameters should be specified for this query/);
        });

    });

    describe('#buildComplexCompiledQueryGenerator', () => {

        it('should build a compiled query generator with parameters', () => {
            const generator = queryCompiler.buildComplexCompiledQueryGenerator({selector:{}}, ['foo'], {});
            generator.should.be.a('function');
            generator({ foo: 'Green hat' }).should.equal('{"selector":{}}');
        });

        it('should build a compiled query generator that throws if any parameters are not supplied', () => {
            const generator = queryCompiler.buildComplexCompiledQueryGenerator({selector:{}}, ['foo'], {});
            generator.should.be.a('function');
            (() => {
                generator({});
            }).should.throw(/Required parameter foo has not been specified/);
        });

        it('should build a compiled query generator that throws if any extraneous parameters are supplied', () => {
            const generator = queryCompiler.buildComplexCompiledQueryGenerator({selector:{}}, ['foo'], {});
            generator.should.be.a('function');
            (() => {
                generator({ foo: 'Green hat', bar: 'such unrequired' });
            }).should.throw(/Invalid or extraneous parameter bar has been specified/);
        });

    });

    describe('#visitSelect', () => {

        it('should compile a select statement without a where statement for an assett', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q2, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                }
            });
        });

        it('should compile a select statement without a where statement for a participant', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q10, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Participant',
                    $registryId: 'org.acme.sample.SampleParticipant',
                    $class: 'org.acme.sample.SampleParticipant'
                }
            });
        });

        it('should compile a select statement without a where statement for a transaction', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q11, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Transaction',
                    $registryId: 'org.acme.sample.SampleTransaction',
                    $class: 'org.acme.sample.SampleTransaction'
                }
            });
        });

        it('should throw for a select statement for a concept', () => {
            selectsFromQueries.Q2.resource = 'org.acme.sample.SampleConcept';
            (() => {
                queryCompiler.visitSelect(selectsFromQueries.Q2, {});
            }).should.throw(/The query compiler does not support resources of this type/);
        });

        it('should compile a select statement with a where statement', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q1, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset',
                    value: {
                        $eq: 'Green hat'
                    }
                }
            });
        });

        it('should compile a select statement with a from statement', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q9, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'DogesSampleAssets',
                    $class: 'org.acme.sample.SampleAsset'
                }
            });
        });

        it('should compile a select statement with an order by statement', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q13, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                },
                sort: [
                    { foo: 'asc' },
                    { bar: 'desc' }
                ]
            });
        });

        it('should compile a select statement with a limit clause', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q3, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                },
                limit: 5
            });
        });

        it('should compile a select statement with a skip clause', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q4, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset',
                },
                skip: 10
            });
        });

        it('should compile a select statement with a limit and a skip clause', () => {
            const result = queryCompiler.visitSelect(selectsFromQueries.Q5, {});
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                },
                limit: 5,
                skip: 10
            });
        });

        it('should compile a select statement with a limit clause with a parameter value', () => {
            const requiredParameters = [];
            const parametersToUse = {};
            const result = queryCompiler.visitSelect(selectsFromQueries.Q6, {
                requiredParameters,
                parametersToUse
            });
            parametersToUse.mylimit = 5;
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                },
                limit: 5
            });
        });

        it('should compile a select statement with a skip clause with a parameter value', () => {
            const requiredParameters = [];
            const parametersToUse = {};
            const result = queryCompiler.visitSelect(selectsFromQueries.Q7, {
                requiredParameters,
                parametersToUse
            });
            parametersToUse.myskip = 5;
            result.should.deep.equal({
                selector: {
                    $registryType: 'Asset',
                    $registryId: 'org.acme.sample.SampleAsset',
                    $class: 'org.acme.sample.SampleAsset'
                },
                skip: 5
            });
        });

    });

    describe('#visitWhere', () => {

        it('should visit a where statement', () => {
            const result = queryCompiler.visitWhere(wheresFromQueries.Q1, {});
            result.should.deep.equal({ selector: { value: { $eq: 'Green hat' } } });
        });

    });

    describe('#visitOrderBy', () => {

        it('should visit a order by statement with a single sort', () => {
            const result = queryCompiler.visitOrderBy(orderBysFromQueries.Q12, {});
            result.should.deep.equal({
                sort: [
                    { foo: 'desc' }
                ]
            });
        });

        it('should visit a order by statement with multiple sorts', () => {
            const result = queryCompiler.visitOrderBy(orderBysFromQueries.Q13, {});
            result.should.deep.equal({
                sort: [
                    { foo: 'asc' },
                    { bar: 'desc' }
                ]
            });
        });

    });

    describe('#visitLimit', () => {

        it('should visit a limit statement with a literal value', () => {
            const result = queryCompiler.visitLimit(limitsFromQueries.Q3, {});
            result.should.deep.equal({ limit: 5 });
        });

        it('should visit a limit statement with a parameter value', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    mylimit: 5
                }
            };
            const result = queryCompiler.visitLimit(limitsFromQueries.Q6, parameters);
            result.should.deep.equal({ limit: 5 });
        });

    });

    describe('#visitSkip', () => {

        it('should visit a skip statement with a literal value', () => {
            const result = queryCompiler.visitSkip(skipsFromQueries.Q4, {});
            result.should.deep.equal({ skip: 10 });
        });

        it('should visit a skip statement with a parameter value', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myskip: 10
                }
            };
            const result = queryCompiler.visitSkip(skipsFromQueries.Q7, parameters);
            result.should.deep.equal({ skip: 10 });
        });

    });

    describe('#visitBinaryExpression', () => {

        it('should throw for an unrecognized operator', () => {
            (() => {
                queryCompiler.visitBinaryExpression({
                    type: 'BinaryExpression',
                    operator: 'ZAP',
                    left: {
                        type: 'Literal',
                        name: true
                    },
                    right: {
                        type: 'Literal',
                        value: false
                    }
                });
            }).should.throw(/The query compiler does not support this binary expression/);
        });

        it('should compile an array combination expression', () => {
            const result = queryCompiler.visitBinaryExpression({
                type: 'BinaryExpression',
                operator: 'AND',
                left: {
                    type: 'Literal',
                    value: true
                },
                right: {
                    type: 'Literal',
                    value: false
                }
            });
            result.should.deep.equal({ $and: [ true, false ] });
        });

        it('should compile a condition expression', () => {
            const result = queryCompiler.visitBinaryExpression({
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $lt: 'bar' } });
        });

    });

    describe('#visitArrayCombinationOperator', () => {

        it('should throw for an unrecognized operator', () => {
            (() => {
                queryCompiler.visitArrayCombinationOperator({
                    type: 'BinaryExpression',
                    operator: 'ZAP',
                    left: {
                        type: 'Literal',
                        name: true
                    },
                    right: {
                        type: 'Literal',
                        value: false
                    }
                });
            }).should.throw(/The query compiler does not support this operator/);
        });

        it('should compile an AND expression', () => {
            const result = queryCompiler.visitArrayCombinationOperator({
                type: 'BinaryExpression',
                operator: 'AND',

                left: {
                    type: 'BinaryExpression',
                    operator: '<',
                    left: {
                        type: 'Identifier',
                        name: 'someProp'
                    },
                    right: {
                        type: 'Literal',
                        value: 'foo'
                    }
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '==',
                    left: {
                        type: 'Identifier',
                        name: 'anotherProp'
                    },
                    right: {
                        type: 'Literal',
                        value: 'bar'
                    }
                }
            });
            result.should.deep.equal({someProp:{$lt: 'foo'}, anotherProp: {$eq: 'bar'}});
        });

        it('should compile an OR expression', () => {
            const result = queryCompiler.visitArrayCombinationOperator({
                type: 'BinaryExpression',
                operator: 'OR',
                left: {
                    type: 'Literal',
                    value: true
                },
                right: {
                    type: 'Literal',
                    value: false
                }
            });
            result.should.deep.equal({ $or: [ true, false ] });
        });

    });

    describe('#visitContainsOperator', () => {

        it('should throw for an expression with two literals', () => {
            (() => {
                queryCompiler.visitContainsOperator({
                    type: 'BinaryExpression',
                    operator: 'CONTAINS',
                    left: {
                        type: 'Literal',
                        value: 'foo'
                    },
                    right: {
                        type: 'Literal',
                        value: 'bar'
                    }
                });
            }).should.throw(/The operator CONTAINS requires a property name/);
        });

        it('should compile an expression with a literal', () => {
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({
                someArray: {
                    $all: [ 'bar' ]
                }
            });
        });

        it('should compile an expression with a reversed literal', () => {
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Literal',
                    value: 'bar'
                },
                right: {
                    type: 'Identifier',
                    name: 'someArray'
                }
            });
            result.should.deep.equal({
                someArray: {
                    $all: [ 'bar' ]
                }
            });
        });

        it('should compile an expression with a parameter', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myvar: 'bar'
                }
            };
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'Identifier',
                    name: '_$myvar'
                }
            }, parameters);
            result.should.deep.equal({
                someArray: {
                    $all: [ 'bar' ]
                }
            });
        });

        it('should compile an expression with a reversed parameter', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myvar: 'bar'
                }
            };
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: '_$myvar'
                },
                right: {
                    type: 'Identifier',
                    name: 'someArray'
                }
            }, parameters);
            result.should.deep.equal({
                someArray: {
                    $all: [ 'bar' ]
                }
            });
        });

        it('should compile an expression with an array literal', () => {
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [
                        {
                            type: 'Literal',
                            value: 'foo'
                        },
                        {
                            type: 'Literal',
                            value: 'bar'
                        }
                    ]
                }
            });
            result.should.deep.equal({
                someArray: {
                    $all: [ 'foo', 'bar' ]
                }
            });
        });

        it('should compile an expression with an array parameter', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myvar: ['foo', 'bar']
                }
            };
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'Identifier',
                    name: '_$myvar'
                }
            }, parameters);
            result.should.deep.equal({
                someArray: {
                    $all: [ 'foo', 'bar' ]
                }
            });
        });

        it('should compile an expression with a nested expression with literals', () => {
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '==',
                    left: {
                        type: 'Identifier',
                        name: 'someProp'
                    },
                    right: {
                        type: 'Literal',
                        value: 'foo'
                    }
                }
            });
            result.should.deep.equal({
                someArray: {
                    $elemMatch: {
                        someProp: {
                            $eq: 'foo'
                        }
                    }
                }
            });
        });

        it('should compile an expression with a nested expression with parameter', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myvar: 'bar'
                }
            };
            const result = queryCompiler.visitContainsOperator({
                type: 'BinaryExpression',
                operator: 'CONTAINS',
                left: {
                    type: 'Identifier',
                    name: 'someArray'
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '==',
                    left: {
                        type: 'Identifier',
                        name: 'someProp'
                    },
                    right: {
                        type: 'Identifier',
                        name: '_$myvar'
                    }
                }
            }, parameters);
            result.should.deep.equal({
                someArray: {
                    $elemMatch: {
                        someProp: {
                            $eq: 'bar'
                        }
                    }
                }
            });
        });

    });

    describe('#visitConditionOperator', () => {

        it('should throw for an unrecognized operator', () => {
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '%^#',
                    left: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    right: {
                        type: 'Literal',
                        value: 'bar'
                    }
                });
            }).should.throw(/The query compiler does not support this operator/);
        });

        it('should throw for a condition with two literals', () => {
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '!=',
                    left: {
                        type: 'Literal',
                        value: 'foo'
                    },
                    right: {
                        type: 'Literal',
                        value: 'bar'
                    }
                });
            }).should.throw(/The query compiler cannot compile condition operators that do not have an identifier and a literal/);
        });

        it('should throw for a condition with two identifiers', () => {
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '!=',
                    left: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'bar'
                    }
                });
            }).should.throw(/The query compiler cannot compile condition operators that do not have an identifier and a literal/);
        });

        it('should throw for a literal on the left that is not a primitive value', () => {
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '>',
                    right: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    left: {
                        type: 'Literal',
                        value: {
                            woop: 'woop'
                        }
                    }
                });
            }).should.throw(/The query compiler cannot compile a condition with a complex value literal/);
        });

        it('should throw for a literal on the right that is not a primitive value', () => {
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '>',
                    left: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    right: {
                        type: 'Literal',
                        value: {
                            woop: 'woop'
                        }
                    }
                });
            }).should.throw(/The query compiler cannot compile a condition with a complex value literal/);
        });

        it('should throw for a condition on the left', () => {
            // ((foo > 'woop') > 'woop')
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '>',
                    left: {
                        type: 'BinaryExpression',
                        operator: '>',
                        left: {
                            type: 'Identifier',
                            name: 'foo'
                        },
                        right: {
                            type: 'Literal',
                            value: 'woop'
                        }
                    },
                    right: {
                        type: 'Literal',
                        value: 'woop'
                    }
                });
            }).should.throw(/The query compiler cannot compile condition operators that do not have an identifier and a literal/);
        });

        it('should throw for a condition on the left', () => {
            // ('woop' > (foo > 'woop'))
            (() => {
                queryCompiler.visitConditionOperator({
                    type: 'BinaryExpression',
                    operator: '>',
                    right: {
                        type: 'BinaryExpression',
                        operator: '>',
                        left: {
                            type: 'Identifier',
                            name: 'foo'
                        },
                        right: {
                            type: 'Literal',
                            value: 'woop'
                        }
                    },
                    left: {
                        type: 'Literal',
                        value: 'woop'
                    }
                });
            }).should.throw(/The query compiler cannot compile condition operators that do not have an identifier and a literal/);
        });

        it('should compile a less than expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $lt: 'bar' } });
        });

        it('should compile a less than or equal expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '<=',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $lte: 'bar' } });
        });

        it('should compile a greater than expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '>',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $gt: 'bar' } });
        });

        it('should compile a greater than or equal expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '>=',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $gte: 'bar' } });
        });

        it('should compile an equals expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '==',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $eq: 'bar' } });
        });

        it('should compile a not equals expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '!=',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $ne: 'bar' } });
        });

        it('should compile and reverse a less than expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '<',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $gt: 'bar' } });
        });

        it('should compile and reverse a less than or equal expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '<=',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $gte: 'bar' } });
        });

        it('should compile and reverse a greater than expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '>',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $lt: 'bar' } });
        });

        it('should compile and reverse a greater than or equal expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '>=',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $lte: 'bar' } });
        });

        it('should compile and reverse an equals expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '==',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $eq: 'bar' } });
        });

        it('should compile and reverse a not equals expression', () => {
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '!=',
                right: {
                    type: 'Identifier',
                    name: 'foo'
                },
                left: {
                    type: 'Literal',
                    value: 'bar'
                }
            });
            result.should.deep.equal({ foo: { $ne: 'bar' } });
        });

        it('should compile an expression with a parameter', () => {
            const parameters = {
                requiredParameters: [],
                parametersToUse: {
                    myvar: 'bar'
                }
            };
            const result = queryCompiler.visitConditionOperator({
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'foo'
                },
                right: {
                    type: 'Identifier',
                    name: '_$myvar'
                }
            }, parameters);
            result.should.deep.equal({ foo: { $lt: 'bar' } });
        });

    });

    describe('#visitIdentifier', () => {

        it('should return the literal value', () => {
            queryCompiler.visitIdentifier({ type: 'Identifier', name: 'foo' }, {}).should.equal('foo');
        });

        it('should return a nested literal value', () => {
            queryCompiler.visitIdentifier({ type: 'Identifier', name: 'foo.bar' }, {}).should.equal('foo.bar');
        });

        it('should return a function for a parameter that returns the parameter value', () => {
            const parameters = {
                parametersToUse: {
                    foo: 'bar'
                },
                requiredParameters: []
            };
            const func = queryCompiler.visitIdentifier({ type: 'Identifier', name: '_$foo' }, parameters);
            parameters.requiredParameters.should.deep.equal(['foo']);
            func.should.be.a('function');
            func().should.equal('bar');
        });

    });

    describe('#visitLiteral', () => {

        it('should return the literal value', () => {
            queryCompiler.visitLiteral({ type: 'Literal', value: 1234 }, {}).should.equal(1234);
        });

    });

    describe('#visitArrayExpression', () => {

        it('should return the array value', () => {
            queryCompiler.visitArrayExpression({
                elements: [
                    { type: 'Literal', value: 1234 },
                    { type: 'Literal', value: 2345 },
                    { type: 'Literal', value: 3456 }
                ],
            }, {}).should.deep.equal([1234, 2345, 3456]);
        });

    });

    describe('#visitMemberExpression', () => {

        it('should return a nested property value', () => {
            const ast = {
                type: 'MemberExpression',
                object: {
                    type: 'Identifier',
                    name: 'baa'
                },
                property: {
                    type: 'Identifier',
                    name: 'moo'
                },
                computed: false
            };
            queryCompiler.visitMemberExpression(ast, {}).should.equal('baa.moo');
        });

        it('should return a deeply nested property value', () => {
            const ast = {
                type: 'MemberExpression',
                object: {
                    type: 'MemberExpression',
                    object: {
                        type: 'MemberExpression',
                        object: {
                            type: 'MemberExpression',
                            object: {
                                type: 'Identifier',
                                name: 'baa'
                            },
                            property: {
                                type: 'Identifier',
                                name: 'moo'
                            },
                            computed: false
                        },
                        property: {
                            type: 'Identifier',
                            name: 'neigh'
                        },
                        computed: false
                    },
                    property: {
                        type: 'Identifier',
                        name: 'meow'
                    },
                    computed: false
                },
                property: {
                    type: 'Identifier',
                    name: 'woof'
                },
                computed: false
            };
            queryCompiler.visitMemberExpression(ast, {}).should.equal('baa.moo.neigh.meow.woof');
        });

    });

});
