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

const cmd = require('../../lib/cmds/card.js');
const cardCommand = require('../../lib/cmds/card/createCommand.js');
const deleteCommand = require('../../lib/cmds/card/deleteCommand.js');
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

        sandbox.stub(yargs, 'check').returns(yargs);
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
            cmd.command.should.include('card');
            cmd.desc.should.include('card');
        });

        it('should call yargs correctly', () => {
            sandbox.stub(yargs, 'commandDir');
            cmd.builder(yargs);
            sinon.assert.calledOnce(yargs.commandDir);
            sinon.assert.calledWith(yargs.commandDir, 'card');
            cmd.handler();
        });

        it('should drive the yargs builder fn correctly',()=>{
            cardCommand.builder(yargs);
            sinon.assert.calledOnce(yargs.options);
            sinon.assert.calledOnce(yargs.check);
        });

        it('should drive the yargs builder fn correctly',()=>{
            deleteCommand.builder(yargs);
            sinon.assert.calledOnce(yargs.options);
            sinon.assert.calledOnce(yargs.requiresArg);
        });
    });



    describe('createCommand Check Function', ()=>{
        it('check that singleton archiveFile, sourceType and sourceName are ok',
        ()=>{
            let obj = {'file':'','businessNetworkName':'','connectionProfileFile':'','user':'','certificate':'cert','privateKey':'kety'};
            cardCommand._checkFn(obj).should.equal(true);
        });

        ['file','businessNetworkName','connectionProfileFile','user'].forEach((e)=>{
            let obj = {'file':'','businessNetworkName':'','connectionProfileFile':'','user':'','certificate':'cert','privateKey':'kety'};
            it('check that an array of an element fails',()=>{
                (()=>{
                    obj[e]=['a','b'];
                    cardCommand._checkFn(obj);
                }).should.throws(/only be specified once/);
            });


        });

    });

});
