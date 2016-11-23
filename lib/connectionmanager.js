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
const homedir = require('homedir');

const PROFILE_ROOT = homedir() + '/concerto-connection-profiles/';
const CONNECTION_FILE = 'connection.json';
const ENCODING = 'utf8';

const mkdirp = require('mkdirp');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks. The ConnectionManager loads
 * connection profiles from an attached fs filesystem.
 * The connection profiles are loaded from the ''<HOME_DIR>/concerto-connection-profiles/'
 * directory.
 *
 * @protected
 * @abstract
 */
class ConnectionManager {

  /**
   * Create the ConnectionManager and attach a file system
   * @param {fs} fs - Node.js FS implementation, for example BrowserFS
   */
    constructor(fs) {
        if(!fs) {
            throw new Error('Must create ConnectionManager with an fs implementation.');
        }

        this.fileSystem = fs;
    }

    /**
     * Establish a connection to the business network, using the provided
     * connectionOptions.
     *
     * @param {string} connectionProfile The name of the connection profile
     * @param {Object} connectOptions Implementation specific connection options.
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     * @abstract
     */
    connect(connectionProfile, connectOptions) {
        return Promise.reject(new Error('abstract function called'));
    }

    /**
     * Loads connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the profile to connect to
     * @return {Promise} A promise that is resolved with a JS Object for the
     * data in the connection profile.
     */
    loadConnectionProfile(connectionProfile) {
        const self = this;
        const result = new Promise(
          function(resolve,reject) {
              self.fileSystem.readFile(PROFILE_ROOT + connectionProfile + '/' + CONNECTION_FILE, ENCODING,
              (err, contents) => {
                  if(!err) {
                      resolve(JSON.parse(contents));
                  }
                  else {
                      reject(err);
                  }
              });
          });

        return result;
    }

    /**
     * Save connectOptions for a given connection profile.
     *
     * @param {string} connectionProfile The name of the profile to save to
     * @param {Object} connectOptions The connection options object
     * @return {Promise} A promise that once the data is written
     */
    saveConnectionProfile(connectionProfile, connectOptions) {

        const DIR = PROFILE_ROOT + connectionProfile + '/';
        const self = this;

        const mkdirResult = new Promise(
          function(resolve,reject) {
              mkdirp(DIR, {fs:self.fileSystem},
              (err, contents) => {
                  if(!err) {
                      resolve();
                  }
                  else {
                      reject(err);
                  }
              });
          });

        mkdirResult.then(
          function(val) {
              const writeFileResult = new Promise(
              function(resolve,reject) {
                  self.fileSystem.writeFile( DIR + CONNECTION_FILE, JSON.stringify(connectOptions), ENCODING,
                  (err, contents) => {
                      if(!err) {
                          resolve();
                      }
                      else {
                          reject(err);
                      }
                  });
              });

              return writeFileResult;
          }
        );

        return mkdirResult;
    }

    /**
     * Updates the runtime identifier for a businesss network (chaincode id)
     * within a connection profile.
     *
     * @param {string} connectionProfile The name of the profile to connect to
     * @param {string} businessNetworkId The identifier of the business network
     * @param {string} chaincodeId The chaincodeId for the business network
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    saveBusinessNetworkRuntimeIdentifier(connectionProfile, businessNetworkId, chaincodeId) {
        const self = this;

        return this.loadConnectionProfile(connectionProfile)
        .then(function (profile) {
            if(!profile.networks) {
                profile.networks = {};
            }
            profile.networks[businessNetworkId] = chaincodeId;
            return self.saveConnectionProfile(connectionProfile, profile);
        });
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }
}

module.exports = ConnectionManager;
