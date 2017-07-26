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



const ls = require('../../lib/shellcmds/shelljs/ls.js');
const pwd = require('../../lib/shellcmds/shelljs/pwd.js');
const shell = require('shelljs');
// const path = require('path');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer shell shell-only cmds unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        sandbox.stub(shell,'exec').returns(0);
        sandbox.stub(shell,'rm').returns({code:0});
        sandbox.stub(shell,'pwd').returns('/pwd');
        sandbox.stub(shell,'ls').returns(['file.txt','file.bna']);
        // sandbox.stub(path, 'resolve').returns('fred');
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('ls', function () {
            let argv = {};
            ls.handler(argv);
            sinon.assert.calledOnce(shell.ls);

        });

        it('pwd', function () {
            let argv = {start:true};
            pwd.handler(argv);
            sinon.assert.calledOnce(shell.pwd);
        });

    });

});
