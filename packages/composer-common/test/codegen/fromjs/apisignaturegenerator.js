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
const APISignatureGenerator = require('../../../lib/codegen/fromjs/apisignaturegenerator');
const Writer = require('../../../lib/codegen/writer');

describe('APISignatureGenerator', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#generate', function() {
        it('Good path', function() {
            let apigen = new APISignatureGenerator();

            let appendFileSync = sandbox.stub(fs, 'appendFileSync');
            appendFileSync.returns;

            let writeLine = sandbox.stub(Writer.prototype,'writeLine');
            writeLine.returns;

            let program = {outdir:'outdir'};
            let file = 'not used';
            let includes = [];
            let classes = [
                {
                    methods:[
                            {name:'methodname1',visibility:'public',methodArgs:['string','int'],throws:'error'},
                            {name:'methodname2',visibility:'public',methodArgs:['string','int']}
                    ],
                    name:'aclass'
                },
                {
                    methods:[
                            {name:'methodname1',visibility:'public',methodArgs:['string','int'],throws:'error'},
                            {name:'methodname2',visibility:'public',methodArgs:['string','int']}
                    ],
                    name:'asubclass',
                    superClass :'aclass'
                }
            ];
            let functions = [
                {
                    throws:'error',
                    visibility:'private',
                    methodArgs:['string','int'],
                    name:'func1',
                    returnType:'int'
                },
                {
                    visibility:'private',
                    methodArgs:['string','int'],
                    name:'func2',
                    returnType:'int'
                }];
            apigen.generate(program,file,includes,classes,functions);
            sinon.assert.callCount(writeLine,10);


        });

        it('nothing to do', function() {
            let apigen = new APISignatureGenerator();

            let appendFileSync = sandbox.stub(fs, 'appendFileSync');
            appendFileSync.returns;

            let writeLine = sandbox.stub(Writer,'writeLine');
            writeLine.returns;

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