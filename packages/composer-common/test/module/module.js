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

const LoadModule = require('../../lib/module/loadModule');
const util = require('util');
// const Chalk = require('chalk');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
chai.use(require('chai-things'));
const expect = chai.expect;

const sinon = require('sinon');

describe('LoadModule', function() {


    let sandbox;
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('loadModule', function() {
        it('should correctly module using just npmpaths', () => {
            let m =  LoadModule.loadModule('chalk');
            util.inspect(m).should.match(/Chalk/);
        });
        it('should correctly module in the additional paths', () => {
            let m =  LoadModule.loadModule('testmodule.js',{paths:['.',__dirname]});
            m.sayHello().should.equal('hello');
        });
        it('should correctly return null if  not found', () => {
            let m = LoadModule.loadModule('wibble.js',{paths:['.',__dirname]});
            expect(m).to.be.null;
        });
        it('should correctly return error if  not found', () => {
            (()=>{
                LoadModule.loadModule('wibble.js',{errorNotFound:true});
            }).should.throw(/Unable to load/);

        });
    });



});
