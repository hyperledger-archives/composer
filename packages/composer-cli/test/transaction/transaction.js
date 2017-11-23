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

const cmd = require('../../lib/cmds/transaction.js');
const yargs = require('yargs');
require('chai').should();
const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer transaction cmd launcher unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(yargs, 'demandCommand').returns(yargs);

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('cmd method tests', () => {

        it('should have the correct command and description', function () {
            cmd.command.should.include('transaction');
            cmd.desc.should.include('transaction');
        });
        it('should call yargs correctly', () => {
            sandbox.stub(yargs, 'commandDir');
            cmd.builder(yargs);
            sinon.assert.calledOnce(yargs.commandDir);
            sinon.assert.calledWith(yargs.commandDir, 'transaction');
            cmd.handler();
        });

    });

});
