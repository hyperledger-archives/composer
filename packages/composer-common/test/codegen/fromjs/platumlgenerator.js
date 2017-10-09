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
const PlantUMLGenerator = require('../../../lib/codegen/fromjs/plantumlgenerator');
const path = require('path');
const FileWriter = require('../../../lib/codegen/filewriter');
const mkdirp = require('mkdirp');

describe('PlantUMLGenerator', function () {

    let sandbox;



    describe('#toUMLFilename', function() {
        it('good path',function() {
            let apigen = new PlantUMLGenerator();
            let filename = apigen.toUMLFilename('inputDir','outputDir','inputDir/filename.js');
            filename.should.equal('filename.uml');
        });

        it('missing extension',function() {
            let apigen = new PlantUMLGenerator();
            let filename = apigen.toUMLFilename('inputDir','outputDir','inputDir/filename');
            filename.should.equal('');
        });
    });

    describe('#generate', function() {
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
        });

        afterEach(() => {
            sandbox.restore();
        });
        it('Good path', function() {
            sandbox.stub(mkdirp,'sync').returns;

            let fwOpenStub = sandbox.stub(FileWriter.prototype,'openFile');
            fwOpenStub.returns;

            let fwWriteLine = sandbox.stub(FileWriter.prototype,'writeLine');
            fwWriteLine.returns;

            let fwCloseFile = sandbox.stub(FileWriter.prototype,'closeFile');
            fwCloseFile.returns;

            let fwWriteBeforeLine = sandbox.stub(FileWriter.prototype,'writeBeforeLine');
            fwWriteBeforeLine.returns;

            let existsSync = sandbox.stub(fs, 'existsSync');
            existsSync.returns(true);

            let pathResolve = sandbox.stub(path,'resolve');
            pathResolve.returns();

            let pathParse = sandbox.stub(path,'parse');
            pathParse.returns({name:'filename'});

            let stub = sandbox.stub(PlantUMLGenerator.prototype,'toUMLFilename');
            stub.returns('nameoffile');

            let apigen = new PlantUMLGenerator();

            let program = {outdir:'outdir',indir:'indir',file:'file'};
            let file = 'not used';
            let includes = ['includeFile'];
            let classes = [
                {
                    superClass : 'ASuperClass',
                    methods:[
                        {name:'methodname1',visibility:'public',methodArgs:['string','int'],throws:'error',
                            commentData: {description:'a description', tags:[

                            ]}
                        },
                        {
                            name:'methodname2',
                            visibility:'public',
                            methodArgs:['string','int'],
                            commentData:
                            {
                                description:'a description',
                                tags:[
                                    {

                                        title:'param',
                                        description:'superClass',
                                        type:
                                        {  name:'name',
                                            type:'OptionalType',
                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'param',
                                        description:'superClass',
                                        type:
                                        {  name:'name',

                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'return',
                                        description:'returns',
                                        type:
                                        {  name:'name',

                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'whatever'
                                    }]
                            }
                        }],
                    name:'aclass',
                    commentData: {description:'a class description', tags:[
                        {title:'extends',name:'superClass'},
                        {title:'see',description:'[Registry]{@link module:composer-client.Registry}'},
                        {title:'memberof',description:'module'},
                        {title:'private'},
                        {title:'protected'},
                        {title:'whatever'}

                    ]}
                }
            ];
            let functions = [];
            apigen.generate(program,file,includes,classes,functions);


        });
        it('Else conditions for the list of functions', function() {
            sandbox.stub(mkdirp,'sync').returns;

            let fwOpenStub = sandbox.stub(FileWriter.prototype,'openFile');
            fwOpenStub.returns;

            let fwWriteLine = sandbox.stub(FileWriter.prototype,'writeLine');
            fwWriteLine.returns;

            let fwCloseFile = sandbox.stub(FileWriter.prototype,'closeFile');
            fwCloseFile.returns;

            let fwWriteBeforeLine = sandbox.stub(FileWriter.prototype,'writeBeforeLine');
            fwWriteBeforeLine.returns;

            let existsSync = sandbox.stub(fs, 'existsSync');
            existsSync.returns(false);

            let pathResolve = sandbox.stub(path,'resolve');
            pathResolve.returns();

            let pathParse = sandbox.stub(path,'parse');
            pathParse.returns({name:'filename'});

            let stub = sandbox.stub(PlantUMLGenerator.prototype,'toUMLFilename');
            stub.returns('nameoffile');

            let apigen = new PlantUMLGenerator();

            let program = {outdir:'outdir',indir:'indir',file:'file'};
            let file = 'not used';
            let includes = ['includeFile'];
            let classes = [
                {
                    methods:[
                        {name:'methodname1',visibility:'public',methodArgs:['string','int'],throws:'error',
                            commentData: {description:'a description', tags:[

                            ]}
                        },
                        {
                            name:'methodname2',
                            visibility:'public',
                            methodArgs:['string','int'],
                            commentData:
                            {
                                description:'a description',
                                tags:[
                                    {

                                        title:'param',
                                        description:'superClass',
                                        type:
                                        {  name:'name',
                                            type:'OptionalType',
                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'param',
                                        description:'superClass',
                                        type:
                                        {  name:'name',

                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'return',
                                        description:'returns',
                                        type:
                                        {  name:'name',

                                            expression: {name:'expressionnanme'}
                                        }
                                    },
                                    {

                                        title:'whatever'
                                    }]
                            }
                        }],
                    name:'aclass',
                    commentData: {description:'a class description', tags:[
                        {title:'extends',name:'superClass'},
                        {title:'see',description:'[Registry]{@link module:composer-client.Registry}'},
                        {title:'memberof',description:'module'},
                        {title:'private'},
                        {title:'protected'},
                        {title:'whatever'}

                    ]}
                }
            ];
            let functions = [];
            apigen.generate(program,file,includes,classes,functions);


        });

        it('No input',function() {
            let apigen = new PlantUMLGenerator();

            let program = {outdir:'outdir',indir:'indir',file:'file'};
            let file = 'not used';
            let includes = ['includeFile'];
            let classes = [];
            let functions= [];
            apigen.generate(program,file,includes,classes,functions);
        });

    });

});