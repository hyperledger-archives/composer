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
 * Exception throws when a Composer file is syntactically invalid
 * @extends BaseModelException
 * @see See [BaseModelException]{@link module:composer-common.BaseModelException}
 * @class
 * @memberof module:composer-common
 */
class ParseException extends BaseModelException {

    /**
     * Create an ParseException
     * @param {string} message - the message for the exception
     * @param {string} fileLocation - the optional file location associated with the exception
     */
    constructor(message, fileLocation) {

        let fullMessage = message +  ' Line ' + fileLocation.start.line + ' column ' + fileLocation.start.column;

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
        }
        super(message, fileLocation, fullMessage);
    }

}

module.exports = ParseException;
