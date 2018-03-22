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

const cmd = require('../../lib/cmds/network.js');
const startCommand = require('../../lib/cmds/network/startCommand.js');
const yargs = require('yargs');
require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer network cmd launcher unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'conflicts').returns(yargs);
        sandbox.stub(yargs, 'options').returns(yargs);
        sandbox.stub(yargs, 'requiresArg').returns(yargs);
        sandbox.stub(yargs, 'demandCommand').returns(yargs);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('cmd method tests', () => {

        it('should have the correct command and description', function () {
            cmd.command.should.include('network');
            cmd.desc.should.include('network');
        });
        it('should call yargs correctly', () => {
            sandbox.stub(yargs, 'commandDir');
            cmd.builder(yargs);
            sinon.assert.calledOnce(yargs.commandDir);
            sinon.assert.calledWith(yargs.commandDir, 'network');
            cmd.handler();
        });

    });
    describe('yargs builder function', () => {

        it('startCommand',()=>{
            startCommand.builder(yargs);
            sinon.assert.calledOnce(yargs.options);
            sinon.assert.calledOnce(yargs.requiresArg);
            sinon.assert.calledOnce(yargs.conflicts);
        });
    });
});
