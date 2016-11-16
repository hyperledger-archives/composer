/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Util = require('../util');

/**
 * Tracks a stack of typed instances. The type information is used to detect
 * overflow / underflow bugs by the caller. It also performs basic sanity
 * checking on push/pop to make detecting bugs easier.
 * @private
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
            throw new Error('Did not find expected type ' + expectedType.constructor.name + ' as argument to push. Found: ' + JSON.stringify(obj));
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
            throw new Error('Did not find expected type ' + expectedType + ' on head of stack. Found: ' + JSON.stringify(result));
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
