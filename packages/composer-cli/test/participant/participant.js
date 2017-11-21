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

const cmd = require('../../lib/cmds/participant.js');
const addCommand = require('../../lib/cmds/participant/addCommand.js');
const yargs = require('yargs');
require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer participant cmd launcher unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(yargs, 'commandDir').returns(yargs);
        sandbox.stub(yargs, 'help').returns(yargs);
        sandbox.stub(yargs, 'example').returns(yargs);
        sandbox.stub(yargs, 'demandCommand').returns(yargs);
        sandbox.stub(yargs, 'wrap').returns(yargs);
        sandbox.stub(yargs, 'strict').returns(yargs);
        sandbox.stub(yargs, 'epilogue').returns(yargs);
        sandbox.stub(yargs, 'alias').returns(yargs);
        sandbox.stub(yargs, 'version').returns(yargs);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should drive the yargs builder fn correctly',()=>{
        addCommand.builder(yargs);
    });

    it('should drive the yargs builder check fn correctly',()=>{
        addCommand._checkFn({data:'notarray',d:'notarray'}).should.equal(true);
        (()=>{addCommand._checkFn({card:['array'],c:['array']});}).should.throw(/Please specify --card or -c only once/);

        addCommand._checkFn({data:'notarray',d:'notarray'}).should.equal(true);
        (()=>{addCommand._checkFn({data:['array'],d:['array']});}).should.throw(/Please specify --data or -d only once/);
    });

    it('should have the correct command and description', function () {
        cmd.command.should.include('participant');
        cmd.desc.should.include('participant');
    });
    it('should call yargs correctly', () => {
        cmd.builder(yargs);
        sinon.assert.calledOnce(yargs.commandDir);
        sinon.assert.calledWith(yargs.commandDir, 'participant');
        cmd.handler();
    });



});
