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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

const fs = require('fs');
const JSONGenerator = require('../../../lib/codegen/fromjs/jsongenerator');
const path = require('path');

describe('JSONGenerator', function () {

    let sandbox;
    let writeFileSync;
    let pathResolve;
    let pathParse;
    let processSpy;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        writeFileSync = sandbox.stub(fs, 'writeFileSync');
        writeFileSync.returns;

        pathResolve = sandbox.stub(path, 'resolve');
        pathResolve.returns();

        pathParse = sandbox.stub(path, 'parse');
        pathParse.returns({ name: 'filename' });

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#generate', function () {
        it('should handle fully populated class', function () {
            let apigen = new JSONGenerator();



            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];
            let classes = [
                {
                    methods: [
                        {
                            name: 'methodname1', visibility: '+', methodArgs: ['string', 'int'], throws: 'error',
                            summary: 'and a summary',
                            commentData: {
                                description: 'a description',

                                tags: [

                                ]
                            }
                        },
                        {
                            name: 'methodname2',
                            visibility: '+',
                            methodArgs: ['string', 'int'],
                            commentData:
                            {
                                description: 'A description.',
                                tags: [
                                    {
                                        title: 'param',
                                        description: 'superClass',
                                        type:
                                        {
                                            name: 'name',
                                            type: 'OptionalType',
                                            expression: { name: 'expressionnanme' }
                                        }
                                    },
                                    {
                                        title: 'param',
                                        description: 'multiple type parameter',
                                        type:
                                        {
                                            name: 'multitype',
                                            type: 'UnionType',
                                            elements:[ { name: 'String' },{ name: 'Buffer' }]
                                        }
                                    },
                                    {
                                        title: 'param',
                                        description: 'multiple type parameter',
                                        type:
                                        {
                                            name: 'multitype',
                                            type: 'UnionType',
                                            elements:[
                                                {
                                                    expression: { name: 'Array' },
                                                    applications: [ {name:'String'}]
                                                },
                                                { name: 'Buffer' }]
                                        }
                                    },
                                    {
                                        title: 'param',
                                        description: 'This is a very. Very Long Description for a.',
                                        type:
                                        {
                                            name: 'name',
                                            expression: { name: 'expressionnanme' }
                                        }
                                    },

                                    {
                                        title: 'whatever'
                                    },
                                    {
                                        title: 'see'
                                    },
                                    {
                                        title: 'summary'
                                    }]
                            }
                        }],
                    name: 'aclass',
                    commentData: {
                        description: 'a class description', tags: [
                            { title: 'extends', name: 'superClass' },
                            { title: 'see', description: '[Registry]{@link module:composer-client.Registry}' },
                            { title: 'memberof', description: 'module' },
                            { title: 'private' },
                            { title: 'protected' },
                            { title: 'whatever' },
                            { title: 'summary', description: 'Summary description. But this is not.'}
                        ]
                    }
                }
            ];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);
            sinon.assert.callCount(writeFileSync, 1);
        });

        it('should handle methods with expanded option fields', function () {
            let apigen = new JSONGenerator();



            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];
            let classes = [
                {
                    methods: [
                        {
                            name: 'methodname2',
                            visibility: '+',
                            methodArgs: ['string', 'int'],
                            commentData:
                            {
                                description: 'a description',
                                tags: [
                                    {
                                        title: 'param',
                                        description : 'desc',
                                        name: 'options',
                                        type:
                                        {
                                            name: 'opts',
                                            type: 'object'
                                        }
                                    },
                                    {
                                        title: 'param',
                                        name: 'options.subopt',
                                        description : 'desc',
                                        type:
                                        {
                                            name: 'Id',
                                            type: 'String'
                                        }
                                    }
                                ]
                            }
                        }],
                    name: 'aclass',
                    commentData: {
                        description: 'a class description', tags: [
                            { title: 'extends', name: 'superClass' },
                            { title: 'see', description: '[Registry]{@link module:composer-client.Registry}' },
                            { title: 'memberof', description: 'module' },
                            { title: 'private' },
                            { title: 'protected' },
                            { title: 'whatever' },
                            { title: 'summary', description: 'Summary description. But this is not.'}
                        ]
                    }
                }
            ];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);
            sinon.assert.callCount(writeFileSync, 1);
        });

        it('should handle methods with return values', function () {
            let apigen = new JSONGenerator();

            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];
            let classes = [
                {
                    methods: [
                        {
                            name: 'methodname2',
                            visibility: '+',
                            methodArgs: ['string', 'int'],
                            commentData:
                            {
                                description: 'a description',
                                tags: [
                                    {
                                        title: 'return',
                                        description : 'desc',
                                        name: 'options',
                                        type:
                                        {
                                            name: 'return type'
                                        }
                                    },
                                    {
                                        title: 'returns',
                                        description : 'desc',
                                        type:
                                        {
                                            name: 'Id',
                                            type: 'String'
                                        }
                                    } ,
                                    {

                                        title: 'return',
                                        description: 'returns',
                                        type:
                                        {
                                            expression: { name: 'Array' },
                                            applications: [ {name:'String'}]
                                        }
                                    },
                                    {

                                        title: 'return',
                                        description: 'returns',
                                        type:
                                        {
                                            expression: { name: 'Wibbly' },
                                            applications: [ {name:'String'}]
                                        }
                                    }
                                ]
                            }
                        }],
                    name: 'aclass',
                    commentData: {
                        description: 'a class description', tags: [
                            { title: 'extends', name: 'superClass' },
                            { title: 'see', description: '[Registry]{@link module:composer-client.Registry}' },
                            { title: 'memberof', description: 'module' },
                            { title: 'private' },
                            { title: 'protected' },
                            { title: 'whatever' },
                            { title: 'summary', description: 'Summary description. But this is not.'}
                        ]
                    }
                }
            ];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);
            sinon.assert.callCount(writeFileSync, 1);
        });

        it('should handle a class that is missing data',function (){
            let apigen = new JSONGenerator();

            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];


            let classes = [ {
                methods: [],
                name: 'a very empty class',
                commentData: {
                    description: 'a class description', tags: [
                    ]
                }
            }];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);

        });

        it('should handle a class that very long description',function (){
            let apigen = new JSONGenerator();
            processSpy = sandbox.spy(apigen,'_process');
            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];


            let classes = [ {
                methods: [],
                name: 'a very empty class',
                commentData: {
                    description: 'First sentance should be the summary. This is not', tags: [
                    ]
                }
            }];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);
            let rc = processSpy.returnValues[0];
            rc.summary.should.equal('First sentance should be the summary');

        });

        it('should handle nothing to do', function () {
            let apigen = new JSONGenerator();


            let program = { outdir: 'outdir' };
            let file = 'not used';
            let includes = [];
            let classes = [{}];
            let functions = [];
            apigen.generate(program, file, includes, classes, functions);
            sinon.assert.notCalled.appendFileSync;
            sinon.assert.notCalled.writeLine;
        });

        it('should handle even less to do', function () {
            let apigen = new JSONGenerator();


            let program = { outdir: 'outdir' };
            let file = 'not used';


            apigen.generate(program, file);
            sinon.assert.notCalled.appendFileSync;
            sinon.assert.notCalled.writeLine;
        });
    });

});