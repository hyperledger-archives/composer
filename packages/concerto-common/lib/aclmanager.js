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

/**
 * <p>
 * Manages a set of ACL rules.
 * </p>
 * @private
 * @class
 * @memberof module:concerto-common
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

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }
}

module.exports = AclManager;
