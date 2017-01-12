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

const Logger = require('@ibm/concerto-common').Logger;

const LOG = Logger.getLog('HFCWalletProxy');

/**
 * A class that implements a proxy between the Hyperledger Fabric,
 * key/value store, using the hfc module, and the Concerto wallet.
 */
class HFCWalletProxy {

    /**
     * Constructor.
     * @param {Wallet} wallet The wallet to use.
     */
    constructor(wallet) {
        const method = 'constructor';
        LOG.entry(method, wallet);
        this.wallet = wallet;
        LOG.exit(method);
    }

    /**
     * Get the value associated with name.
     * @param {string} name The name.
     * @param {function} cb The callback.
     * @return {Promise} A promise that is
     * resolved when complete.
     */
    getValue(name, cb) {
        const method = 'getValue';
        LOG.entry(method, name, cb);
        return this.wallet.contains(name)
            .then((result) => {
                if (result) {
                    return this.wallet.get(name);
                } else {
                    return null;
                }
            })
            .then((value) => {
                LOG.exit(method, value);
                return cb(null, value);
            })
            .catch((error) => {
                LOG.debug(method, error);
                return cb(error);
            });
    }

    /**
     * Set the value associated with name.
     * @param {string} name The name.
     * @param {string} value The value.
     * @param {function} cb The callback.
     * @return {Promise} A promise that is
     * resolved when complete.
     */
    setValue(name, value, cb) {
        const method = 'setValue';
        LOG.entry(method, name, value, cb);
        return this.wallet.contains(name)
            .then((contains) => {
                if (contains) {
                    return this.wallet.update(name, value);
                } else {
                    return this.wallet.add(name, value);
                }
            })
            .then(() => {
                LOG.exit(method);
                return cb(null);
            })
            .catch((error) => {
                LOG.error(method, error);
                return cb(error);
            });
    }

}

module.exports = HFCWalletProxy;
