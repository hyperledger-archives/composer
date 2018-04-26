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
 * Exception throws when a composer acl file is semantically invalid
 * @extends BaseFileException
 * @see See  {@link BaseFileException}
 * @class
 * @memberof module:composer-common
 * @private
 */
class IllegalAclException extends BaseFileException {

    /**
     * Create an IllegalAclException.
     * @param {String} message - the message for the exception
     * @param {AclFile} [aclFile] - the optional aclFile associated with the exception
     * @param {Object} [fileLocation] - location details of the error within the model file.
     * @param {String} fileLocation.start.line - start line of the error location.
     * @param {String} fileLocation.start.column - start column of the error location.
     * @param {String} fileLocation.end.line - end line of the error location.
     * @param {String} fileLocation.end.column - end column of the error location.
     */
    constructor(message, aclFile, fileLocation) {

        let messageSuffix = '';
        if(aclFile && aclFile.getIdentifier()) {
            messageSuffix = 'File \'' + aclFile.getIdentifier() + '\': ' ;
        }

        if(fileLocation) {
            messageSuffix = messageSuffix + 'line ' + fileLocation.start.line + ' column ' +
                fileLocation.start.column + ', to line ' + fileLocation.end.line + ' column ' +
                fileLocation.end.column + '. ';
        }

        // First character to be uppercase, and prepended with a space
        if (messageSuffix) {
            messageSuffix = ' ' + messageSuffix.charAt(0).toUpperCase() + messageSuffix.slice(1);
        }

        super(message, fileLocation, message + messageSuffix);
        this.aclFile = aclFile;
    }

    /**
     * Returns the aclFile associated with the exception or null
     * @return {AclFile} the optional acl file associated with the exception
     */
    getAclFile() {
        return this.aclFile;
    }
}

module.exports = IllegalAclException;
