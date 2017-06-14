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

const BaseException = require('../baseexception');

/**
 * Exception throws when a composer file is semantically invalid
 * @extends BaseException
 * @see See [BaseException]{@link module:composer-common.BaseException}
 * @class
 * @memberof module:composer-common
 */
class IllegalModelException extends BaseException {

    /**
     * Create an IllegalModelException.
     * @param {string} message - the message for the exception
     * @param {ModelFile} [modelFile] - the optional modelfile associated with the exception
     * @param {Object} [fileLocation] - location details of the error within the model file.
     * @param {string} fileLocation.start.line - start line of the error location.
     * @param {string} fileLocation.start.column - start column of the error location.
     * @param {string} fileLocation.end.line - end line of the error location.
     * @param {string} fileLocation.end.column - end column of the error location.
     */
    constructor(message, modelFile, fileLocation) {

        let messagePrefix = '';
        if(modelFile && modelFile.getFileName()) {
            messagePrefix = 'File \'' + modelFile.getFileName() + '\': ' ;
        }

        if(fileLocation) {
            messagePrefix = messagePrefix + 'line ' + fileLocation.start.line + ' column ' +
                fileLocation.start.column + ', to line ' + fileLocation.end.line + ' column ' +
                fileLocation.end.column + '. ';
        }

        super(messagePrefix + message);
        this.modelFile = modelFile;
        this.fileLocation = fileLocation;
    }

    /**
     * Returns the modelfile associated with the exception or null
     * @return {string} the optional filename associated with the model
     */
    getModelFile() {
        return this.modelFile;
    }

    /**
     * Returns the file location associated with the exception or null
     * @return {string} the optional location associated with the exception
     */
    getFileLocation() {
        return this.fileLocation;
    }
}

module.exports = IllegalModelException;
