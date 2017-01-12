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
 * Currently we have a wallet singleton, but this is temporary until
 * we decide how wallets fit into the administrative and client APIs.
 */
let theWallet = null;

/**
 * Base class representing a wallet (a container of credentials).
 * @protected
 * @abstract
 */
class Wallet {

    /**
     * Get the wallet singleton.
     * @return {Wallet} The wallet singleton, or null if one
     * has not been specified.
     */
    static getWallet() {
        return theWallet;
    }

    /**
     * Set the wallet singleton.
     * @param {Wallet} wallet The new wallet singleton.
     */
    static setWallet(wallet) {
        theWallet = wallet;
    }

    /**
     * List all of the credentials in the wallet.
     * @abstract
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    list() {
        throw new Error('abstract function called');
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    contains(name) {
        throw new Error('abstract function called');
    }

    /**
     * Get the named credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        throw new Error('abstract function called');
    }

    /**
     * Add a new credential to the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    add(name, value) {
        throw new Error('abstract function called');
    }

    /**
     * Update existing credentials in the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    update(name, value) {
        throw new Error('abstract function called');
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    remove(name) {
        throw new Error('abstract function called');
    }

}

module.exports = Wallet;
