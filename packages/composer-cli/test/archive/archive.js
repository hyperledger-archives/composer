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

const cmd = require('../../lib/cmds/archive.js');
const listCommand = require('../../lib/cmds/archive/listCommand.js');
const createCommand = require('../../lib/cmds/archive/createCommand.js');

const yargs = require('yargs');
require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer archive cmd launcher unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(yargs, 'check').returns(yargs);
        sandbox.stub(yargs, 'conflicts').returns(yargs);
        sandbox.stub(yargs, 'options').returns(yargs);
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'requiresArg').returns(yargs);
        sandbox.stub(yargs, 'demandCommand').returns(yargs);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('cmd method tests', () => {

        it('should have the correct command and description', function () {
            cmd.command.should.include('archive');
            cmd.desc.should.include('archive');
        });
        it('should call yargs correctly', () => {
            sandbox.stub(yargs, 'commandDir');
            cmd.builder(yargs);
            sinon.assert.calledOnce(yargs.commandDir);
            sinon.assert.calledWith(yargs.commandDir, 'archive');
            cmd.handler();
        });

    });

    describe('cmd builder fn',()=>{
        it('listCommand builder function',()=>{
            listCommand.builder(yargs);
            sinon.assert.calledOnce(yargs.options);
        });

        it('createCommand builder function',()=>{
            createCommand.builder(yargs);
            sinon.assert.calledOnce(yargs.usage);
            sinon.assert.calledOnce(yargs.options);
            sinon.assert.calledOnce(yargs.requiresArg);
            sinon.assert.calledOnce(yargs.check);
        });


    });

    describe('createCommand Check Function', ()=>{
        it('check that singleton archiveFile, sourceType and sourceName are ok',
        ()=>{
            createCommand._checkFn({archiveFile:'',sourceType:'',sourceName:''}).should.equal(true);
        });
        it('check that more than one archiveFile fails',()=>{
            (()=>{
                createCommand._checkFn({sourceType:'',archiveFile:['a','b'],sourceName:''});
            }).should.throws(/only be specified once/);
        });
        it('check that more than one sourceType fails',()=>{
            (()=>{
                createCommand._checkFn({sourceType:['a','b'],archiveFile:'',sourceName:''});
            }).should.throws(/only be specified once/);
        });
        it('check that more than one archiveFile fails',()=>{
            (()=>{
                createCommand._checkFn({sourceType:'',archiveFile:'',sourceName:['a','b']});
            }).should.throws(/only be specified once/);
        });
    });
});
