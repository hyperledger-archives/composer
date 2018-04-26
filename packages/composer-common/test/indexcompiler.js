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

const ModelManager = require('../lib/modelmanager');
const QueryManager = require('../lib/querymanager');
const IndexCompiler = require('../lib/indexcompiler');
const QueryFile = require('../lib/query/queryfile');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('IndexCompiler', () => {

    let indexCompiler;
    let modelManager;
    let queryFile1;
    let queries;
    let queryManager;

    beforeEach(() => {
        indexCompiler = new IndexCompiler();
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace org.acme.sample

        concept SampleConcept {
            o String value
        }

        concept Meow {
            o String woof
            o String tweet
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
                    ORDER BY [foo ASC, bar ASC]
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
        query Q20 {
            description: "Simple Historian Query"
            statement:
                SELECT org.acme.sample.SampleAsset
                    WHERE (meows CONTAINS ((woof == "foo") OR (tweet == "bar")))
        }
        `);
        queryFile1.validate();
        queries = {};
        queryFile1.getQueries().forEach((query) => {
            const name = query.getName();
            queries[name] = query;
        });
        queryManager = new QueryManager(modelManager);
        queryManager.setQueryFile(queryFile1);
    });

    describe('#compile', () => {

        it('should index all of the queries in the specified query manager', () => {
            const indexes = indexCompiler.compile(queryManager);
            indexes.should.be.an('array');
            indexes.should.have.lengthOf(20);
            indexes.should.all.have.property('name');
            indexes.should.all.have.property('ddoc');
            indexes.should.all.have.property('index');
        });

    });

    describe('#visitQueryManager', () => {

        it('should index all queries in the query manager', () => {
            const indexes = indexCompiler.visitQueryManager(queryManager);
            indexes.should.be.an('array');
            indexes.should.have.lengthOf(20);
            indexes.should.all.have.property('name');
            indexes.should.all.have.property('ddoc');
            indexes.should.all.have.property('index');
        });

        it('should handle no queries in the query manager', () => {
            queryManager.queryFile = null;
            const indexes = indexCompiler.visitQueryManager(queryManager);
            indexes.should.be.an('array');
            indexes.should.have.lengthOf(0);
        });

    });

    describe('generate query indexes', () => {
        it('should generate index for Q1', () => {
            const index = indexCompiler.visitQuery(queries.Q1);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','value']},'name':'Q1','ddoc':'Q1Doc','type':'json'});
        });

        it('should generate index for Q2', () => {
            const index = indexCompiler.visitQuery(queries.Q2);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q2','ddoc':'Q2Doc','type':'json'});
        });

        it('should generate index for Q3', () => {
            const index = indexCompiler.visitQuery(queries.Q3);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q3','ddoc':'Q3Doc','type':'json'});
        });

        it('should generate index for Q4', () => {
            const index = indexCompiler.visitQuery(queries.Q4);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q4','ddoc':'Q4Doc','type':'json'});
        });

        it('should generate index for Q5', () => {
            const index = indexCompiler.visitQuery(queries.Q5);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q5','ddoc':'Q5Doc','type':'json'});
        });

        it('should generate index for Q6', () => {
            const index = indexCompiler.visitQuery(queries.Q6);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q6','ddoc':'Q6Doc','type':'json'});
        });

        it('should generate index for Q7', () => {
            const index = indexCompiler.visitQuery(queries.Q7);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q7','ddoc':'Q7Doc','type':'json'});
        });

        it('should generate index for Q8', () => {
            const index = indexCompiler.visitQuery(queries.Q8);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','value']},'name':'Q8','ddoc':'Q8Doc','type':'json'});
        });

        it('should generate index for Q9', () => {
            const index = indexCompiler.visitQuery(queries.Q9);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q9','ddoc':'Q9Doc','type':'json'});
        });

        it('should generate index for Q10', () => {
            const index = indexCompiler.visitQuery(queries.Q10);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q10','ddoc':'Q10Doc','type':'json'});
        });

        it('should generate index for Q11', () => {
            const index = indexCompiler.visitQuery(queries.Q11);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q11','ddoc':'Q11Doc','type':'json'});
        });

        it('should generate index for Q12', () => {
            const index = indexCompiler.visitQuery(queries.Q12);
            index.should.deep.equal({'index':{'fields':[{'\\$class':'desc'},{'\\$registryType':'desc'},{'\\$registryId':'desc'},{'foo':'desc'}]},'name':'Q12','ddoc':'Q12Doc','type':'json'});
        });

        it('should generate index for Q13', () => {
            const index = indexCompiler.visitQuery(queries.Q13);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId',{'foo':'asc'},{'bar':'asc'}]},'name':'Q13','ddoc':'Q13Doc','type':'json'});
        });

        it('should generate index for Q14', () => {
            const index = indexCompiler.visitQuery(queries.Q14);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','baa.moo.neigh.meow.woof']},'name':'Q14','ddoc':'Q14Doc','type':'json'});
        });

        it('should generate index for Q15', () => {
            const index = indexCompiler.visitQuery(queries.Q15);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId']},'name':'Q15','ddoc':'Q15Doc','type':'json'});
        });

        it('should generate index for Q16', () => {
            const index = indexCompiler.visitQuery(queries.Q16);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','noises']},'name':'Q16','ddoc':'Q16Doc','type':'json'});
        });

        it('should generate index for Q17', () => {
            const index = indexCompiler.visitQuery(queries.Q17);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','noises']},'name':'Q17','ddoc':'Q17Doc','type':'json'});
        });

        it('should generate index for Q18', () => {
            const index = indexCompiler.visitQuery(queries.Q18);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','meows','woof']},'name':'Q18','ddoc':'Q18Doc','type':'json'});
        });

        it('should generate index for Q19', () => {
            const index = indexCompiler.visitQuery(queries.Q19);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','meows','woof']},'name':'Q19','ddoc':'Q19Doc','type':'json'});
        });

        it('should generate index for Q20', () => {
            const index = indexCompiler.visitQuery(queries.Q20);
            index.should.deep.equal({'index':{'fields':['\\$class','\\$registryType','\\$registryId','meows','woof','tweet']},'name':'Q20','ddoc':'Q20Doc','type':'json'});
        });

    });

    describe('error handlers', () => {
        it('should throw error for unrecognised AST node', () => {
            (() => {
                indexCompiler.visit({'type': 'unknown'});
            }).should.throw('Unrecognised type: object, value: {"type":"unknown"}');
        });

        it('should throw error for unsupported binary operator', () => {
            (() => {
                indexCompiler.visitBinaryExpression({'operator': 'unsupported'});
            }).should.throw('The query compiler does not support this binary expression');
        });

    });
});
