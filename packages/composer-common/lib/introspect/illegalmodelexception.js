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

const BaseModelException = require('./basemodelexception');

/**
 * Exception throws when a composer file is semantically invalid
 * @extends BaseModelException
 * @see See [BaseModelException]{@link module:composer-common.BaseModelException}
 * @class
 * @memberof module:composer-common
 */
class IllegalModelException extends BaseModelException {

    /**
     * Create an IllegalModelException
     * @param {string} message - the message for the exception
     * @param {string} modelFile - the optional modelfile associated with the exception
     * @param {string} fileLocation - the optional file location associated with the exception
     */
    constructor(message, modelFile, fileLocation) {

        let messageSuffix = '';
        if(modelFile && modelFile.getFileName()) {
            messageSuffix = 'File \'' + modelFile.getFileName() + '\': ' ;
        }

        if(fileLocation) {
            messageSuffix = messageSuffix + 'line ' + fileLocation.start.line + ' column ' +
                fileLocation.start.column + ', to line ' + fileLocation.end.line + ' column ' +
                fileLocation.end.column + '. ';
        }

        // First character to be uppercase
        messageSuffix = messageSuffix.charAt(0).toUpperCase() + messageSuffix.slice(1);

        super(message + ' ' + messageSuffix);
        this.modelFile = modelFile;
        this.fileLocation = fileLocation;
        this.shortMessage = message;
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
