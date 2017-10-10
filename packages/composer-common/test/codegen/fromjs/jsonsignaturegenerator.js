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

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#generate', function() {
        it('Good path', function() {
            let apigen = new JSONGenerator();

            let writeFileSync = sandbox.stub(fs, 'writeFileSync');
            writeFileSync.returns;

            let pathResolve = sandbox.stub(path,'resolve');
            pathResolve.returns();

            let pathParse = sandbox.stub(path,'parse');
            pathParse.returns({name:'filename'});


            let program = {outdir:'outdir'};
            let file = 'not used';
            let includes = [];
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
            sinon.assert.callCount(writeFileSync,1);


        });

        it('nothing to do', function() {
            let apigen = new JSONGenerator();

            let writeFileSync = sandbox.stub(fs, 'writeFileSync');
            writeFileSync.returns;

            let program = {outdir:'outdir'};
            let file = 'not used';
            let includes = [];
            let classes = [];
            let functions = [];
            apigen.generate(program,file,includes,classes,functions);
            sinon.assert.notCalled.appendFileSync;
            sinon.assert.notCalled.writeLine;
        });
    });

});