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


const Hlf = require('../../lib/cmds/dev/lib/hlfv1.js');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
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
    let r;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        sandbox.stub(shell,'exec').returns({code:0});
        sandbox.stub(shell,'ls').returns(['one','two']);
        sandbox.stub(shell,'rm').returns({code:0});
        // sandbox.stub(path, 'resolve').returns('fred');
        sandbox.stub(fs,'readFileSync' );
        sandbox.stub(process, 'exit');
        r=sandbox.stub(path,'resolve').returns('unittest');
        sandbox.stub(Hlf,'getLocn').returns('nothing');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('no option specified', function () {
            let argv = {};
            return Hlf.handler(argv)
            .then ((result) => {

                sinon.assert.calledOnce(shell.ls);
                sinon.assert.calledOnce(fs.readFileSync);
            });
        });

        it('no option specified', function () {
            let argv = {dir:'hlfv'};
            return Hlf.handler(argv)
            .then ((result) => {

                sinon.assert.calledOnce(shell.ls);
                sinon.assert.calledOnce(fs.readFileSync);
            });
        });

        it('--list option specified', function () {
            let argv = {list:true};
            return Hlf.handler(argv)
            .then ((result) => {

                sinon.assert.calledOnce(shell.ls);
                sinon.assert.calledOnce(fs.readFileSync);
            });
        });

        it('--createProfile option specified', function () {
            let argv = {createProfile:true};
            r.returns('createProfile.sh');
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'createProfile.sh');
            });
        });


        it('--start option specified', function () {
            let argv = {start:true};
            r.returns('start-hyperledger.sh');
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'start-hyperledger.sh');
            });
        });

        it('--stop option specified', function () {
            let argv = {stop:true};
            r.returns('stop-hyperledger.sh');
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'stop-hyperledger.sh');
            });
        });

        it('--teardown option specified', function () {
            let argv = {teardown:true};
            r.returns('teardown.sh');
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'teardown.sh');
            });
        });

        it('--download option specified', function () {
            let argv = {download:true};
            r.returns('download-hyperledger.sh');
            return Hlf.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(shell.exec);
                sinon.assert.calledWithMatch(shell.exec,'download-hyperledger.sh');
            });
        });




    });

});
