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

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
const Writer = require('../../lib/codegen/writer');

describe('Writer', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function() {
        it('main path', function() {
            let writer = new Writer();
            should.exist(writer);
            writer.clearBuffer();

        });
    });

    describe('#writeBeforeLine', function() {
        it('main path', function() {
            let writer = new Writer();
            should.exist(writer);
            writer.writeBeforeLine(1,'Hello World');
            writer.beforeBuffer.should.equal('   Hello World\n');
            writer.linesWritten.should.equal(1);
            writer.getLineCount().should.equal(1);
        });
    });


    describe('#writeLine', function() {
        it('main path', function() {
            let writer = new Writer();
            should.exist(writer);
            writer.writeLine(1,'Hello World');
            writer.buffer.should.equal('   Hello World\n');
            writer.linesWritten.should.equal(5);
            writer.getBuffer().should.equal('   Hello World\n');
        });
    });
    describe('#writeIndented', function() {
        it('main path', function() {
            let writer = new Writer();
            should.exist(writer);
            writer.writeIndented(1,'Hello World');

            writer.linesWritten.should.equal(2);
            writer.getBuffer().should.equal('   Hello World');
        });
    });

    describe('#write', ()=>{
        it('writes a line that is not a string', ()=>{
            (()=>{
                let writer = new Writer();
                should.exist(writer);
                writer.write(false);
            }).should.throws(/Can only append strings/);

        });

    });
});