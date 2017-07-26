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

const assert = require('assert');
const TypedStack = require('../../lib/serializer/typedstack');

require('chai').should();

describe('TypedStack', function () {

    describe('#push', function() {
        it('check push with wrong type', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.push(1, String);}, /.+Did not find expected type Function as argument to push. Found: 1/, 'did not throw with expected message');
        });

        it('check push with null', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.push(null);}, /.+Pushing null data!/, 'did not throw with expected message');
        });
    });

    describe('#pop', function() {
        it('check pop with empty stack', function() {
            const ts = new TypedStack('ROOT');
            ts.pop();
            assert.throws( function() {ts.pop();}, /.+Stack is empty!/, 'did not throw with expected message');
        });

        it('check pop with wrong type', function() {
            const ts = new TypedStack('ROOT');
            assert.throws( function() {ts.pop(Number);}, /.+Found: ROOT/, 'did not throw with expected message');
        });
    });

    describe('#peek', () => {
        it('should throw an error if value given is null', () => {
            const ts = new TypedStack('ROOT');
            (() => {
                // Set the top of the stack to null
                ts.stack = [null];
                ts.peek(null);
            }).should.throw(/Pop returned invalid data/);
        });
    });
});
