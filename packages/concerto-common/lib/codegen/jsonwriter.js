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

const Writer = require('./writer');

/**
 * JSONWriter manages a text buffer for writing JSON data structures.
 * It tracks when a comma is needed to separate items. Commas are inserted
 * automatically based on context.
 * @private
 * @extends Writer
 * @see See [Writer]{@link module:ibm-concerto-common.Writer}
 * @class
 * @memberof module:ibm-concerto-common
 */
class JSONWriter extends Writer {

    /**
     * Create a JSONWriter.
     *
     */
    constructor() {
        super();
        this.indent = 0;
        this.firstItem = true;
    }

    /**
     * Opens an object declaration
     * @param {string} key - the key
     */
    openObject() {
        this.write('{');
        this.indent++;
        this.firstItem = true;
        this.log('{');
    }

    /**
     * Close the current object declaration.
     */
    closeObject() {
        this.write('}');
        this.indent--;
        this.firstItem = false;
        this.log('}');
    }

    /**
     * Writes a key, in the format
     * '"key" : '
     * @param {string} key - the key
     */
    writeKey(key) {
        this.writeComma();
        this.write(`"${key}":`);
        this.log('writeKey', key );
    }

    /**
     * Writes a comma when this.firstItem === false
     */
    writeComma() {
        if(this.firstItem === false) {
            this.write(',');
            this.log(',');
        }
        else {
            this.log(', (suppressed)');
        }
    }

    /**
     * Writes a value, in the format:
     * '"value"'
     * @param {string} value - the value
     */
    writeStringValue(value) {
        this.write(`"${value}"`);
        this.firstItem = false;
        this.log('writeStringValue', value);
    }

    /**
     * Writes a value, in the format:
     * 'value'
     * @param {string} value - the value
     */
    writeValue(value) {
        this.write(`${value}`);
        this.firstItem = false;
        this.log('writeValue', value);
    }

    /**
     * Writes a key/value, in the format:
     * '"key" : "value"'
     * @param {string} key - the key
     * @param {string} value - the value
     */
    writeKeyStringValue(key,value) {
        this.writeComma();
        this.write(`"${key}":"${value}"`);
        this.firstItem = false;
        this.log('writeKeyStringValue', (key + ':' + value));
    }

    /**
     * Writes a key/value, in the format:
     * '"key" : value'
     * @param {string} key - the key
     * @param {string} value - the value
     */
    writeKeyValue(key,value) {
        this.writeComma();
        this.write(`"${key}": ${value}`);
        this.firstItem = false;
        this.log('writeKeyValue', key + '=' + value);
    }

    /**
     * Writes an array value, in the format
     * '"value"'
     * @param {string} value - the value
     */
    writeArrayStringValue(value) {
        this.writeComma();
        this.write(`"${value}"`);
        this.firstItem = false;
        this.log('writeArrayStringValue', value);
    }

    /**
     * Writes an array value, in the format
     * 'value'
     * @param {string} value - the value
     */
    writeArrayValue(value) {
        this.writeComma();
        this.write(`${value}`);
        this.firstItem = false;
        this.log('writeArrayValue', value);
    }

    /**
     * Opens a new array
     */
    openArray() {
        this.write('[');
        this.indent++;
        this.firstItem = true;
        this.log('[');
    }

    /**
     * Closes the current array
     */
    closeArray() {
        this.write(']');
        this.indent--;
        this.firstItem = false;
        this.log(']');
    }

    /**
     * @return {String} a string represention of this class
     */
    toString() {
        return 'indent ' + this.indent + ' firstItem ' + this.firstItem;
    }

    /**
     * @param {String} callSite - the location
     * @param {String} message - the message to log.
     */
    log(callSite, message) {
        const log = false;
        if(log) {
            let spaces = '';
            for(let n=0; n < this.indent; n++) {
                spaces += ' ';
            }

            if(!message) {
                message = '';
            }

            console.log(spaces + ' ' + message + ' ' + callSite );
        }
    }
}

module.exports = JSONWriter;
