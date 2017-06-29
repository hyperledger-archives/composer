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

const AclFile = require('./acl/aclfile');

/**
 * <p>
 * Manages a set of ACL rules.
 * </p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class AclManager {

  /**
   * Create the AclManager.
   * <p>
   * <strong>Note: Only to be called by framework code. Applications should
   * retrieve instances from {@link BusinessNetworkDefinition}</strong>
   * </p>
   * @param {ModelManager} modelManager - The ModelManager to use for this AclManager
   * @param {AclFile} aclFile - The AclFile that stores the rules
   */
    constructor(modelManager) {
        this.modelManager = modelManager;
        this.aclFile = null;
    }
    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Create an ACL file using the specified ID and contents.
     * @param {string} identifier The identifier of the ACL file.
     * @param {string} contents The contents of the ACL file.
     * @return {AclFile} The new ACL file.
     */
    createAclFile(identifier, contents) {
        return new AclFile(identifier, this.modelManager, contents);
    }

    /**
     * Set the AclFile for this AclManager
     * @param {AclFile} aclFile  - the AclFile to associate with this AclManager
     * @private
     */
    setAclFile(aclFile) {
        aclFile.validate();
        this.aclFile = aclFile;
    }

    /**
     * Get the AclFile associated with this AclManager
     * @return {AclFile} The AclFile for this AclManager or null if it has not been set
     */
    getAclFile() {
        return this.aclFile;
    }

    /**
     * Get the AclRules associated with this AclManager
     * @return {AclRule[]} The AclRules for the AclManager or an empty array if not set
     */
    getAclRules() {
        if(this.aclFile) {
            return this.aclFile.getAclRules();
        }
        return [];
    }

}

module.exports = AclManager;
