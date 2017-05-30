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

/**
 * Writer buffers text to be written in memory. It handles simple
 * indentation and tracks the number of lines written.
 * @private
 * @class
 * @memberof module:composer-common
 */
class Writer {

    /**
     * Create a Writer.
     *
     */
    constructor() {
        this.beforeBuffer = '';
        this.buffer = '';
        this.linesWritten = 0;
    }

    /**
     * Writes text to the start of the buffer
     * @param {int} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeBeforeLine(tabs,text) {
        for(let n=0; n < tabs; n++) {
            this.beforeBuffer += '   ';
        }
        this.beforeBuffer += text;
        this.beforeBuffer += '\n';
        this.linesWritten++;
    }

    /**
     * Append text to the buffer
     * @param {int} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeLine(tabs,text) {
        for(let n=0; n < tabs; n++) {
            this.write('   ');
        }
        this.write(text);
        this.write('\n');
        this.linesWritten++;
    }

    /**
     * Returns the number of lines that have been written to the buffer.
     * @return {int} the number of lines written to the buffer.
     */
    getLineCount() {
        return this.linesWritten;
    }


    /**
     * Append text to the buffer, prepending tabs
     * @param {int} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeIndented(tabs,text) {
        for(let n=0; n < tabs; n++) {
            this.write('   ');
        }
        this.write(text);
    }

    /**
     * Append text to the buffer (no automatic newline). The
     * text may contain newline, and these will increment the linesWritten
     * counter.
     * @param {string} msg - the text to write
     */
    write(msg) {
        if(typeof msg !== 'string' ) {
            throw new Error('Can only append strings. Argument ' + msg + ' has type ' + typeof msg);
        }

        this.buffer += msg;
        this.linesWritten += msg.split(/\r\n|\r|\n/).length;
    }

    /**
     * Returns the text that has been buffered in this Writer.
     * @return {string} the buffered text.
     */
    getBuffer() {
        return this.beforeBuffer + this.buffer;
    }

    /**
     * Empties the underyling buffer and resets the line count.
     */
    clearBuffer() {
        this.beforeBuffer = '';
        this.buffer = '';
        this.linesWritten = 0;
    }
}

module.exports = Writer;
