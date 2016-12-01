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

const fs = require('fs-extra');
const Writer = require('./writer');

/**
 * FileWriter creates text files under a directory tree. It can be used
 * by code generators to create source files for example.
 * Basic usage is: openFile(fileName), writeLine(...), closeFile().
 *
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class FileWriter extends Writer {

    /**
     * Create a FileWriter.
     *
     * @param {string} outputDirectory - the path to an output directory
     * that will be used to store generated files.
     */
    constructor(outputDirectory) {
        super();
        this.outputDirectory = outputDirectory;
        this.relativeDir = null;
        this.fileName = null;
        fs.ensureDirSync(outputDirectory);
    }

    /**
     * Opens a file for writing. The file will be created in the
     * root directory of this FileWriter.
     *
     * @param {string} fileName - the name of the file to open
     */
    openFile(fileName) {
        this.fileName = fileName;
        this.relativeDir = null;
    }

    /**
     * Opens a file for writing, with a location relative to the
     * root directory of this FileWriter.
     *
     * @param {string} relativeDir - the relative directory to use
     * @param {string} fileName - the name of the file to open
     */
    openRelativeFile(relativeDir, fileName) {
        this.relativeDir = relativeDir;
        this.fileName = fileName;
    }

    /**
     * Writes text to the current open file
     * @param {int} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeLine(tabs,text) {
        if (this.fileName) {
            super.writeLine(tabs,text);
        } else {
            throw Error('File has not been opened!');
        }
    }

    /**
     * Writes text to the start of the current open file
     * @param {int} tabs - the number of tabs to use
     * @param {string} text - the text to write
     */
    writeBeforeLine(tabs,text) {
        if (this.fileName) {
            super.writeBeforeLine(tabs,text);
        } else {
            throw Error('File has not been opened!');
        }
    }

    /**
     * Closes the current open file
     */
    closeFile() {
        if (!this.fileName) {
            throw new Error('No file open');
        }

        let path = this.outputDirectory;

        if(!path.endsWith('/')) {
            path += '/';
        }

        if (this.relativeDir) {
            path += this.relativeDir;
        }

        if(!path.endsWith('/')) {
            path += '/';
        }

        path += this.fileName;

        //console.log('Writing to ' + path );
        fs.outputFileSync(path, this.getBuffer());

        this.fileName = null;
        this.relativeDir = null;
        this.clearBuffer();
    }
}

module.exports = FileWriter;
