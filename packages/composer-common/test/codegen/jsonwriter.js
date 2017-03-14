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

const JSONWriter = require('../../lib/codegen/jsonwriter');

require('chai').should();

describe('JSONWriter', () => {

    let writer;

    beforeEach(() => {
        writer = new JSONWriter();
    });

    describe('#writeKey', () => {

        it('should write a key', () => {
            writer.writeKey('hello world');
            writer.getBuffer().should.equal('"hello world":');
            writer.clearBuffer();
            writer.writeKey('hello"world');
            writer.getBuffer().should.equal('"hello\\"world":');
        });

    });

    describe('#writeStringValue', () => {

        it('should write a key', () => {
            writer.writeStringValue('hello world');
            writer.getBuffer().should.equal('"hello world"');
            writer.clearBuffer();
            writer.writeStringValue('hello"world');
            writer.getBuffer().should.equal('"hello\\"world"');
        });

    });

    describe('#writeKeyStringValue', () => {

        it('should write a key', () => {
            writer.writeKeyStringValue('hello world', 'hello world');
            writer.getBuffer().should.equal('"hello world":"hello world"');
            writer.clearBuffer();
            writer.writeKeyStringValue('hello"world', 'hello"world');
            writer.getBuffer().should.equal('"hello\\"world":"hello\\"world"');
        });

    });

    describe('#writeKeyValue', () => {

        it('should write a key', () => {
            writer.writeKeyValue('hello world', '"hello world"');
            writer.getBuffer().should.equal('"hello world":"hello world"');
            writer.clearBuffer();
            writer.writeKeyValue('hello"world', '"hello\\"world"');
            writer.getBuffer().should.equal('"hello\\"world":"hello\\"world"');
        });

    });

    describe('#writeArrayStringValue', () => {

        it('should write a key', () => {
            writer.writeArrayStringValue('hello world');
            writer.getBuffer().should.equal('"hello world"');
            writer.clearBuffer();
            writer.writeArrayStringValue('hello"world');
            writer.getBuffer().should.equal('"hello\\"world"');
        });

    });

});
