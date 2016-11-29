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

const prompt = require('prompt');
const Admin = require('@ibm/ibm-concerto-admin');

/**
 * Internal Utility Class
 * <p><a href="diagrams/util.svg"><img src="diagrams/util.svg" style="width:100%;"/></a></p>
 * @private
 */
class CmdUtil {

      /**
       * Promise based wrapper for a call to the prompt module.
       * @param {Object} options The options for the prompt module.
       * @return {Promise} A promise that will be resolved with the value returned
       * from the call to the prompt module.
       */
    static prompt(options) {
        return new Promise((resolve, reject) => {
            prompt.get([options], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
      * Creates an admin connection. Included in deploy class to facilitate unit testing
      * @returns {AdminConnection} adminConnection
      */
    static createAdminConnection() {
        let adminConnection = new Admin.AdminConnection();
        return adminConnection;
    }
}

module.exports = CmdUtil;
