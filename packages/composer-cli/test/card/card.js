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
        cardCommand._checkFn({s:'secret',somethingelse:'PeerAdmin'},{}).should.equal(true);
        cardCommand._checkFn({s:'secret',roles:'PeerAdmin'},{}).should.equal(true);
        cardCommand._checkFn({s:'secret',roles:'PeerAdmin,ChannelAdmin'},{}).should.equal(true);
        cardCommand._checkFn({s:'secret',roles:'Issuer,PeerAdmin,ChannelAdmin'},{}).should.equal(true);
    });

    it('should enforce that both key and cert should be given together',()=>{
        (()=>{
            cardCommand._checkFn({k:'key'});
        }).should.throw(/privateKey and certificate should both be specified/);
        (()=>{
            cardCommand._checkFn({c:'cert'});
        }).should.throw(/privateKey and certificate should both be specified/);

        cardCommand._checkFn({k:'key',c:'cert'}).should.equal(true);

    });

    it('should allow a secret to be specified but with a certificate or private key file', ()=>{
        (()=>{
            cardCommand._checkFn({s:'secret',k:'key'});
        }).should.throw(/Either the enrollSecret or the privateKey and certificate combination should be specified/);
        (()=>{
            cardCommand._checkFn({s:'secret',c:'cert'});
        }).should.throw(/Either the enrollSecret or the privateKey and certificate combination should be specified/);
        (()=>{
            cardCommand._checkFn({s:'secret',k:'key',c:'cert'});
        }).should.throw(/Either the enrollSecret or the privateKey and certificate combination should be specified/);

    });







});
