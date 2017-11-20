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

const AdminConnection = require('composer-admin').AdminConnection;
const IdCard = require('composer-common').IdCard;
const net = require('net');
const path = require('path');
const sleep = require('sleep-promise');
const fs = require('fs');
const childProcess = require('child_process');

let generated = false;

/**
 * Trick browserify by making the ID parameter to require dynamic.
 * @param {string} id The module ID.
 * @return {*} The module.
 */
function dynamicRequire(id) {
    return require(id);
}

/**
 * A class that handles all of the interactions with a business network for
 * a currently executing Cucumber scenario and steps.
 */
class Composer {

    /**
     * Constructor.
     * @param {string} uri The URI of the currently executing Cucumber scenario.
     * @param {boolean} errorExpected Is an error expected in this Cucumber scenario?
     */
    constructor(uri, errorExpected) {
        this.uri = uri;
        this.errorExpected = errorExpected;
        this.error = null;
        this.lastResp = null;
    }

    /**
     * Check to see if running in Hyperledger Fabric V1 mode.
     * @return {boolean} True if running in Hyperledger Fabric mode, false if not.
     */
    static isHyperledgerFabricV1() {
        return process.env.INTEST && process.env.INTEST.match('^hlfv1.*');
    }

    /**
     * Wait for the specified hostname to start listening on the specified port.
     * @param {string} hostname - the hostname.
     * @param {integer} port - the port.
     * @return {Promise} - a promise that will be resolved when the specified
     * hostname to start listening on the specified port.
     */
    static waitForPort(hostname, port) {
        let waitTime = 30;
        if (process.env.COMPOSER_PORT_WAIT_SECS) {
            waitTime = parseInt(process.env.COMPOSER_PORT_WAIT_SECS);
        }
        return new Promise(function (resolve, reject) {
            let testConnect = function (count) {
                let socket = new net.Socket();
                socket.on('error', function (error) {
                    if (count > waitTime) {
                        return reject(error);
                    } else {
                        setTimeout(function () {
                            testConnect(count + 1);
                        }, 1000);
                    }
                });
                socket.on('connect', function () {
                    socket.end();
                    return resolve();
                });
                socket.connect(port, hostname);
            };
            testConnect(0);
        });
    }

    /**
     * Wait for the peer on the specified hostname and port to start listening
     * on the specified port.
     * @return {Promise} - a promise that will be resolved when the peer has
     * started listening on the specified port.
     */
    static waitForPorts() {
        // startsWith not available in browser test environment
        if (process.env.INTEST.match('^hlfv1')) {
            return Promise.resolve();
        }
        return Promise.all([
            Composer.waitForPort('localhost', 7050),
            Composer.waitForPort('localhost', 7051),
            Composer.waitForPort('localhost', 7052),
            Composer.waitForPort('localhost', 7053),
            Composer.waitForPort('localhost', 7054)])
            .then(() => {
                return sleep(5000);
            });
    }

    /**
     * Creates crypto material
     * @return {Promise} - a promise that will be resolved when crypto material is created or rejected with failure
     */
    setup() {
        if(generated) {
            return Promise.resolve();
        } else {
            const adminConnection = new AdminConnection();
            return Composer.waitForPorts()
            .then(() => {
                if (Composer.isHyperledgerFabricV1()) {
                    let fs = dynamicRequire('fs');
                    const admins = [
                        { org: 'org1', keyFile: 'key.pem', profile : 'org1-only' },
                        { org: 'org2', keyFile: 'key.pem', profile : 'org2-only' },
                        { org: 'org1', keyFile: 'key.pem', profile : 'org1' },
                        { org: 'org2', keyFile: 'key.pem', profile : 'org2' }
                    ];
                    return admins.reduce((promise, admin) => {
                        const org = admin.org;
                        const prof = admin.profile;
                        const keyFile = admin.keyFile;
                        return promise.then(() => {
                            let keyPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/keystore/${keyFile}`);
                            let certPath = path.join(__dirname, `../hlfv1/crypto-config/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/signcerts/Admin@${org}.example.com-cert.pem`);
                            let cert = fs.readFileSync(certPath).toString();
                            let key = fs.readFileSync(keyPath).toString();

                            // set if the options have been given into the metadata
                            let metadata = {
                                version:1,
                                userName : `TestPeerAdmin@${prof}`,
                                roles : ['PeerAdmin'],
                            };

                            let profile;
                            if(process.env.INTEST.match('tls$')){
                                let profilePath = path.join(__dirname, `../profiles/tls-connection-${prof}.json`);
                                profile = fs.readFileSync(profilePath, 'utf8');
                            } else {
                                let profilePath = path.join(__dirname, `../profiles/basic-connection-${prof}.json`);
                                profile = fs.readFileSync(profilePath, 'utf8');
                            }

                            let idCard = new IdCard(metadata, JSON.parse(profile));

                            // certificates & privateKey
                            const newCredentials = { };
                            newCredentials.certificate = cert;
                            newCredentials.privateKey =  key;

                            idCard.setCredentials(newCredentials);
                            let cardName = `TestPeerAdmin@${prof}`;

                            adminConnection.hasCard(cardName)
                            .then((exists) => {
                                if(exists) {
                                    console.log('skipping card import of existing card: ', cardName);
                                    return Promise.resolve();
                                } else {
                                    console.log('importing card: ', cardName);
                                    return adminConnection.importCard(cardName, idCard);
                                }
                            });
                        });
                    }, Promise.resolve());
                }
            })
            .then(() => {
                generated = true;
                return Promise.resolve();
            })
            .catch((err) => {
                return Promise.reject(err);
            });
        }
    }

    /**
     * Check that the provided list of items (files or folders) exist
     * @param {String} type -  type (folder or file) that is being considered
     * @param {DataTable} table -  DataTable listing the items expeted to exist
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkExists(type, table) {
        const rows = table.raw();
        let missing = rows.filter((row) => {
            let itemPath = path.resolve(__dirname, row[0]);
            return !fs.existsSync(itemPath);
        });

        if ( missing.length === 0 ) {
            return Promise.resolve();
        } else {
            return Promise.reject('The following item(s) do not exist: ' + missing);
        }
    }

    /**
     * Prepare CLI Command to run
     * @param {DataTable} table -  Information listing the CLI command and parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    runCLI(table) {
        if (typeof table === 'string') {
            return this._runCLI(table);
        } else {
            return this._runCLI(this.convertTableToCommand(table));
        }
    }

    /**
     * Convert a prameterised table into a string command to run
     * @param {DataTable} table -  DataTable listing the CLI command and parameters to be run
     * @return {String} - String command based upon the input table
     */
    convertTableToCommand(table) {
        let command = '';
        const data = table.rowsHash();
        Object.keys(data).forEach((key) => {
            if (key === 'command') {
                command += data[key] + ' ';
            } else {
                command += key + ' ' + data[key] + ' ';
            }
        });
        return command;
    }

    /**
     * Run a composer CLI command
     * @param {DataTable} table -  DataTable listing the CLI command and parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    _runCLI(table) {
        if (typeof table !== 'string') {
            return Promise.reject('Command passed to function was not a string');
        } else {
            let command = table;
            let stdout = '';
            let stderr = '';

            //console.log(command);

            return new Promise( (resolve, reject) => {

                let childCliProcess = childProcess.exec(command);

                childCliProcess.stdout.setEncoding('utf8');
                childCliProcess.stderr.setEncoding('utf8');

                childCliProcess.stdout.on('data', (data) => {
                    stdout += data;
                });

                childCliProcess.stderr.on('data', (data) => {
                    stderr += data;
                });

                childCliProcess.on('error', (error) => {
                    this.lastResp = { error: error, stdout: stdout, stderr: stderr };
                    reject(this.lastResp);
                });

                childCliProcess.on('close', (code) => {
                    if (code && code !== 0) {
                        this.lastResp = { code: code, stdout: stdout, stderr: stderr };
                        reject(this.lastResp);
                    } else {
                        this.lastResp = { code: code, stdout: stdout, stderr: stderr };
                        resolve(this.lastResp);
                    }
                });
            });
        }
    }

    /**
     * Check the last message with regex
     * @param {RegExp} [regex] Optional regular expression.
     * @param {boolean} isError boolean to indicate if testing error or not
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkConsoleOutput(regex, isError) {
        let type;

        if(isError){
            type = 'stderr';
        } else {
            type = 'stdout';
        }

        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp[type]) {
                reject('a ' + type + ' response was expected, but no repsonse messages have been generated');
            } else if (regex) {
                if(this.lastResp[type].match(regex)) {
                    resolve();
                } else {
                    reject('regex match on ' + type + ' failed');
                }
            }
        });
    }

}

module.exports = Composer;
