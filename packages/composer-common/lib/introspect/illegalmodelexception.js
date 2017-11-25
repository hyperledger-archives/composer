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

const BaseFileException = require('../basefileexception');

/**
 * Exception throws when a composer file is semantically invalid
 * @extends BaseFileException
 * @see See  {@link BaseFileException}
 * @class
 * @memberof module:composer-common
 * @private
 */
class IllegalModelException extends BaseFileException {

    /**
     * Create an IllegalModelException.
     * @param {String} message - the message for the exception
     * @param {ModelFile} [modelFile] - the optional modelfile associated with the exception
     * @param {Object} [fileLocation] - location details of the error within the model file.
     * @param {String} fileLocation.start.line - start line of the error location.
     * @param {String} fileLocation.start.column - start column of the error location.
     * @param {String} fileLocation.end.line - end line of the error location.
     * @param {String} fileLocation.end.column - end column of the error location.
     */
    constructor(message, modelFile, fileLocation) {

        let messageSuffix = '';
        if(modelFile && modelFile.getName()) {
            messageSuffix = 'File \'' + modelFile.getName() + '\': ' ;
        }

        if(fileLocation) {
            messageSuffix = messageSuffix + 'line ' + fileLocation.start.line + ' column ' +
                fileLocation.start.column + ', to line ' + fileLocation.end.line + ' column ' +
                fileLocation.end.column + '. ';
        }

        // First character to be uppercase
        messageSuffix = messageSuffix.charAt(0).toUpperCase() + messageSuffix.slice(1);

        super(message, fileLocation, message + ' ' + messageSuffix);
        this.modelFile = modelFile;
    }

    /**
     * Returns the modelfile associated with the exception or null
     * @return {string} the optional filename associated with the model
     */
    getModelFile() {
        return this.modelFile;
    }
}

module.exports = IllegalModelException;
