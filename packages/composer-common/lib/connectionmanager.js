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

const ConnectionProfileManager = require('./connectionprofilemanager');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks. The ConnectionManager loads
 * connection profiles using the ConnectionProfileManager.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class ConnectionManager {

  /**
   * Create the ConnectionManager
   * @param {ConnectionProfileManager} connectionProfileManager - the ConnectionProfileManager
   * that controls this instance.
   */
    constructor(connectionProfileManager) {
        if(!(connectionProfileManager instanceof ConnectionProfileManager)) {
            throw new Error('Must create ConnectionManager with a ConnectionProfileManager implementation.');
        }

        this.connectionProfileManager = connectionProfileManager;
    }

    /**
     * Returns the ConnectionProfileManager associated with this ConnectionManager
     * @return {ConnectionProfileManager} the connection profile manager for this
     * connection manager.
     */
    getConnectionProfileManager() {
        return this.connectionProfileManager;
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        return new Promise((resolve, reject) => {
            this._connect(connectionProfile, businessNetworkIdentifier, connectionOptions, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback connectCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {Connection} connection The connection.
     */

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {connectCallback} callback The callback function to call when complete.
     */
    _connect(connectionProfile, businessNetworkIdentifier, connectionOptions, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Import an identity into a profile wallet or keystore
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} publicKey the public key
     * @param {string} privateKey the private key
     * @returns {Promise} a promise which resolves when the identity is imported
     */
    importIdentity(connectionProfile, connectionOptions, id, publicKey, privateKey) {
        return new Promise((resolve, reject) => {
            this._importIdentity(connectionProfile, connectionOptions, id, publicKey, privateKey, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    /**
     * @callback importIdentityCallback
     * @protected
     * @param {Error} error The error if any.
     */

    /**
     * Import an identity into a profile wallet or keystore
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} publicKey the public key
     * @param {string} privateKey the private key
     * @param {importIdentityCallback} callback The callback function to call when complete.
     */
    _importIdentity(connectionProfile, connectionOptions, id, publicKey, privateKey, callback) {
        throw new Error('abstract function called');
    }

    /**
     * Request an identity's certificates.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {any} enrollmentID The enrollment id
     * @param {any} enrollmentSecret  The enrollment secret
     * @returns {promise} resolves with the identity certificates, rejected if a problem occurs
     */
    requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret) {
        return new Promise((resolve, reject) => {
            this._requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        });
    }

    /**
     * @callback requestIdentityCallback
     * @protected
     * @param {Error} error The error if any.
     * @param {Object} identity The identity.
     */

    /**
     * Request an identity's certificates.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {any} enrollmentID The enrollment id
     * @param {any} enrollmentSecret  The enrollment secret
     * @param {requestIdentityCallback} callback The callback function to call when complete.
     */
    _requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret, callback) {
        throw new Error('abstract function called');
    }

}

module.exports = ConnectionManager;
