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


const cardCommand = require('../../lib/cmds/card/createCommand.js');
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
        sandbox.stub(yargs, 'group').returns(yargs);
        sandbox.stub(yargs, 'options').returns(yargs);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should drive the yargs builder fn correctly',()=>{
        cardCommand.builder(yargs);
        sinon.assert.calledOnce(yargs.options);
        sinon.assert.calledOnce(yargs.group);
        sinon.assert.calledOnce(yargs.check);

    });

    it('should drive the yargs builder check fn correctly',()=>{
        cardCommand._checkFn({somethingelse:'PeerAdmin'},{}).should.equal(true);
        cardCommand._checkFn({roles:'PeerAdmin'},{}).should.equal(true);
        cardCommand._checkFn({roles:'PeerAdmin,ChannelAdmin'},{}).should.equal(true);
        cardCommand._checkFn({roles:'Issuer,PeerAdmin,ChannelAdmin'},{}).should.equal(true);

        (()=>{
            cardCommand._checkFn({roles:'Fred'},{});
        }).should.throw(/Invalid role given/);

        (()=>{
            cardCommand._checkFn({roles:'ChannelAdmin,Fred'},{});
        }).should.throw(/Invalid role given/);
    });





});
