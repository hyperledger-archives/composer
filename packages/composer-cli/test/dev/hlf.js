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


const Hlf = require('../../lib/cmds/dev/hlf.js');
const shell = require('shelljs');
// const path = require('path');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));


describe('composer dev hlf unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        sandbox.stub(shell,'exec').returns(0);
        sandbox.stub(shell,'rm').returns({code:0});
        // sandbox.stub(path, 'resolve').returns('fred');
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('no option specified', function () {
            let argv = {};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWith(shell.exec,'docker ps');
            });
        });

        it('--start option specified', function () {
            let argv = {start:true};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'up -d --build');
            });
        });

        it('--stop option specified', function () {
            let argv = {stop:true};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'stop');
            });
        });

        it('--delete option specified', function () {
            let argv = {delete:true};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'down');
            });
        });

        it('--download option specified', function () {
            let argv = {download:true};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledTwice(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'docker pull');
                sinon.assert.calledWithMatch(shell.exec,'docker tag');
            });
        });

        it('--purgeProfiles option specified', function () {
            let argv = {purgeProfiles:true};
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledTwice(shell.rm);
            });
        });


    });

});
