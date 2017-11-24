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
 * Exception throws when a Composer file is syntactically invalid
 * @extends BaseFileException
 * @see See {@link BaseFileException}
 * @class
 * @memberof module:composer-common
 * @private
 */
class ParseException extends BaseFileException {

    /**
     * Create an ParseException
     * @param {string} message - the message for the exception
     * @param {string} fileLocation - the optional file location associated with the exception
     * @param {string} fileName - the optional file name associated with the exception
     */
    constructor(message, fileLocation, fileName) {
        let fullMessage = message;
        let suffix = '';

        // Add the file name onto the message if it has been set.
        if (fileName) {
            suffix += ' File ' + fileName;
        }

        // The parser does not give us back the end location of an invalid token.
        // Making the end column equal to the end column makes use of
        // vscodes default behaviour of selecting an entire word
        if (fileLocation) {
            if (fileLocation.end && fileLocation.start) {
                if (fileLocation.end.offset && fileLocation.start.offset) {
                    if (fileLocation.end.offset - fileLocation.start.offset === 1) {
                        fileLocation.end.column = fileLocation.start.column;
                        fileLocation.end.offset = fileLocation.start.offset;
                    }
                }
            }
            if (suffix) {
                suffix+= ' line ' + fileLocation.start.line + ' column ' + fileLocation.start.column;
            } else {
                suffix+= ' Line ' + fileLocation.start.line + ' column ' + fileLocation.start.column;
            }
        }

        fullMessage += suffix;
        super(message, fileLocation, fullMessage);
    }

}

module.exports = ParseException;
