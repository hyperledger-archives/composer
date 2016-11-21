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
 * Manages a set of deployed business networks
 * </p>
 */
class BusinessNetworkRegistry {

    /**
     * Create an instance of the BusinessNetworkRegistry class.
     * @param {ManagementConnection} managementConnection - the management connection for this instance
     */
    constructor(managementConnection) {
        this.managementConnection = managementConnection;
    }

    /**
     * Adds a BusinessNetwork to the registry
     *
     * @param {BusinessNetwork} businessNetwork - The BusinessNetwork
     * @throws {Error} throws an error if the network already exists
     */
    addBusinessNetwork(businessNetwork) {}

    /**
     * Updates the definition of a BusinessNetwork in the registry
     *
     * @param {BusinessNetwork} businessNetwork - The BusinessNetwork
     * @throws {Error} throws an error if the network does not exists
     */
    updateBusinessNetwork(businessNetwork) {}

    /**
     * Remove a BusinessNetwork from the registry
     *
     * @param {string} id - The BusinessNetwork identifier
     * @throws {Error} throws an error if the network does not exist
     */
    removeBusinessNetwork(id) {}

    /**
     * Resets the data for a BusinessNetwork. All data for the network
     * will be deleted.
     *
     * @param {string} id - The BusinessNetwork identifier
     * @throws {Error} throws an error if the network does not exists
     */
    resetBusinessNetwork(id) {}

    /**
     * Retrieves a BusinessNetwork from the registry
     *
     * @param {string} id - The BusinessNetwork identifier
     * @return {Promise} a promise to the BusinessNetwork
     * @throws {Error} throws an error if the network does not exists
     */
    getBusinessNetwork(id) {
        return null;
    }


    /**
     * Retrieves a BusinessNetwork from the registry
     *
     * @param {string} id - The BusinessNetwork identifier
     * @return {boolean} true if the business network exists in the registry
     */
    exists(id) {
        return false;
    }

}

module.exports = BusinessNetworkRegistry;
