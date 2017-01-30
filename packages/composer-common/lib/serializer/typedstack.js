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

const Util = require('../util');

/**
 * Tracks a stack of typed instances. The type information is used to detect
 * overflow / underflow bugs by the caller. It also performs basic sanity
 * checking on push/pop to make detecting bugs easier.
 * @private
 * @class
 * @memberof module:composer-common
 */
class TypedStack {

  /**
   * Create the Stack with the resource at the head.
   * @param {Object} resource - the resource to be put at the head of the stack
   */
    constructor(resource) {
        this.stack = [];
        this.push(resource);
    }

    /**
     * Push a new object.
     * @param {Object} obj - the object being visited
     * @param {Object} expectedType - the expected type of the object being pushed
     */
    push(obj, expectedType) {
        if(expectedType && !(obj instanceof expectedType)) {
            throw new Error('Did not find expected type ' + expectedType.constructor.name + ' as argument to push. Found: ' + obj.toString());
        }

        if(Util.isNull(obj)) {
            throw new Error('Pushing null data!');
        }

        this.stack.push(obj);
        //console.log('Push depth is: ' + this.stack.length + ', contents: ' + this.stack.toString() );
    }

    /**
     * Push a new object.
     * @param {Object} expectedType - the type that should be the result of pop
     * @return {Object} the result of pop
     */
    pop(expectedType) {
        this.peek(expectedType);
        return this.stack.pop();
    }

    /**
     * Peek the top of the stack
     * @param {Object} expectedType - the type that should be the result of pop
     * @return {Object} the result of peek
     */
    peek(expectedType) {

        //console.log( 'pop ' );

        if(this.stack.length < 1) {
            throw new Error('Stack is empty!');
        }

        const result = this.stack[this.stack.length-1];
        if(expectedType && !(result instanceof expectedType)) {
            throw new Error('Did not find expected type ' + expectedType + ' on head of stack. Found: ' + result);
        }

        if(Util.isNull(result)) {
            throw new Error('Pop returned invalid data');
        }

        return result;
    }

    /**
     * Clears the stack
     */
    clear() {
        this.stack = [];
    }
}

module.exports = TypedStack;
