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
const BusinessNetworkCardStore = require('composer-common').BusinessNetworkCardStore;
const childProcess = require('child_process');
const fs = require('fs');
const IdCard = require('composer-common').IdCard;
const matchPattern = require('lodash-match-pattern');
const net = require('net');
const path = require('path');
const request = require('request-promise-any');
const sleep = require('sleep-promise');
const stripAnsi = require('strip-ansi');

let generated = false;

/**
 * Trick browserify by making the ID parameter to require dynamic.
 * @param {string} id The module ID.
 * @return {*} The module.
 */
function dynamicRequire(id) {
    return require(id);
}

let jar = request.jar();

/**
 * A class that handles all of the interactions with a business network for
 * a currently executing Cucumber scenario and steps.
 */
class Composer {

    /**
     * Clear the cookie jar.
     */
    static clearCookieJar() {
        jar = request.jar();
    }

    /**
     * Constructor.
     * @param {string} uri The URI of the currently executing Cucumber scenario.
     * @param {boolean} errorExpected Is an error expected in this Cucumber scenario?
     * @param {Object} tasks - current background tasks accessible to all scenarios
     * @param {Object} busnets - current busnets deployed
     * @param {Object} aliasMap - current map of alias names to functional items
     */
    constructor(uri, errorExpected, tasks, busnets, aliasMap) {
        this.uri = uri;
        this.errorExpected = errorExpected;
        this.error = null;
        this.lastResp = null;
        this.tasks = tasks;
        this.busnets = busnets;
        this.aliasMap = aliasMap;
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
                                    // eslint-disable-next-line no-console
                                    console.log('skipping card import of existing card: ', cardName);
                                    return Promise.resolve();
                                } else {
                                    // eslint-disable-next-line no-console
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
     * @param {Boolean} pass - Boolean pass/fail case expected
     * @param {DataTable} table -  Information listing the CLI command and parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    runCLI(pass, table) {
        if (typeof table === 'string') {
            return this._runCLI(pass, table);
        } else {
            return this._runCLI(pass, this.convertTableToCommand(table));
        }
    }

    /**
     * Run a CLI Command with a substituted alias
     * @param {*} alias -  The alias to substitue in the command
     * @param {Boolean} pass - Boolean pass/fail case expected
     * @param {*} table -  Information listing the CLI command and parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    runCLIWithAlias(alias, pass, table) {
        if (typeof table !== 'string') {
            return Promise.reject('Command passed to function was not a string');
        } else {
            if (!this.aliasMap.has(alias)) {
                return Promise.reject('Unable to use passed Alias: ' + alias + ' does not exist');
            } else {
                let command = table.replace(alias, this.aliasMap.get(alias));
                return this._runCLI(pass, command);
            }
        }
    }

    /**
     * Prepare CLI Command to run
     * @param {String} label - name associated with task
     * @param {DataTable} table -  Information listing the CLI command and parameters to be run
     * @param {RegExp} regex - await the content of stdout before resolving promise
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    runBackground(label, table, regex) {
        if (typeof table === 'string') {
            return this._runBackground(label, table, regex);
        } else {
            return this._runBackground(label, this.convertTableToCommand(table), regex);
        }
    }

    /**
     * Prepare CLI Command to run
     * @param {String} label - name associated with task
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    killBackground(label) {
        return new Promise( (resolve, reject) => {
            if (this.tasks[label]) {
                this.tasks[label].kill();
                delete this.tasks[label];
                // delay, ensure child process is really gone!
                setTimeout(() => {
                    resolve();
                }, 3000);
            } else {
                reject('No such task: ' + label);
            }
        });
    }

    /**
     * Do an HTTP request to REST server
     * @param {String} method - HTTP method
     * @param {String} path - path
     * @param {*} data - request body
     * @param {Object} [inputOptions] - options for request
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    async request(method, path, data, inputOptions = {}) {
        const options = Object.assign({}, {
            method,
            uri: `http://localhost:3000${path}`,
            resolveWithFullResponse: true,
            simple: false,
            followAllRedirects: true,
            jar
        });
        if (data) {
            options.body = data;
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            };
        }
        const finalOptions = Object.assign({}, options, inputOptions);
        const response = await request(finalOptions);
        this.lastResp = { code: response.statusCode, response: response.body || response.error };
        return this.lastResp;
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
     * @param {Boolean} pass - Boolean pass/fail case expected, undefined if unchecked case
     * @param {DataTable} cmd -  CLI command with parameters to be run
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    _runCLI(pass, cmd) {
        if (typeof cmd !== 'string') {
            return Promise.reject('Command passed to function was not a string');
        } else {
            let command = cmd;
            let stdout = '';
            let stderr = '';

            return new Promise( (resolve, reject) => {

                let childCliProcess = childProcess.exec(command);

                childCliProcess.stdout.setEncoding('utf8');
                childCliProcess.stderr.setEncoding('utf8');

                childCliProcess.stdout.on('data', (data) => {
                    data = stripAnsi(data);
                    stdout += data;
                });

                childCliProcess.stderr.on('data', (data) => {
                    data = stripAnsi(data);
                    stderr += data;
                });

                childCliProcess.on('error', (error) => {
                    this.lastResp = { error: error, stdout: stdout, stderr: stderr };
                    if (pass){
                        reject(this.lastResp);
                    }
                });

                childCliProcess.on('close', (code) => {
                    if (pass === undefined) {
                        // don't care case
                        this.lastResp = { code: code, stdout: stdout, stderr: stderr };
                        resolve(this.lastResp);
                    } else if (code && code !== 0 && pass) {
                        // non zero return code, should pass
                        this.lastResp = { code: code, stdout: stdout, stderr: stderr };
                        reject(this.lastResp);
                    } else if (code && code === 0 && !pass) {
                        // zero return code, should fail
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
     * Run a composer CLI command
     * @param {String} label - name associated with task
     * @param {DataTable} table -  DataTable listing the CLI command and parameters to be run
     * @param {RegExp} regex - await the content of stdout before resolving promise
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    _runBackground(label, table, regex) {
        if (typeof table !== 'string') {
            return Promise.reject('Command passed to function was not a string');
        } else {
            let command = table;
            let stdout = '';
            let stderr = '';
            let self = this;

            return new Promise( (resolve, reject) => {

                let args = command.split(' ');
                let file = args.shift();

                let childCliProcess = childProcess.spawn(file, args);

                self.tasks[label] = childCliProcess;

                childCliProcess.stdout.setEncoding('utf8');
                childCliProcess.stderr.setEncoding('utf8');

                let success = false;

                setTimeout(() => {
                    if(!success) {
                        reject({stdout: stdout, stderr: stderr});
                    }
                }, 60000);

                childCliProcess.stdout.on('data', (data) => {
                    data = stripAnsi(data);
                    stdout += data;
                    if(stdout.match(regex)) {
                        success = true;
                        resolve({stdout: stdout, stderr: stderr});
                    }
                });

                childCliProcess.stderr.on('data', (data) => {
                    data = stripAnsi(data);
                    stderr += data;
                });

                childCliProcess.on('error', (error) => {
                    reject({error: error, stdout: stdout, stderr: stderr});
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
                reject('a ' + type + ' response was expected, but no response messages have been generated');
            } else if (regex) {
                if(this.lastResp[type].match(regex)) {
                    resolve();
                } else {
                    reject(`Regex match on ${type} failed.\nExpected: ${regex}\nActual: ${this.lastResp[type]}`);
                }
            }
        });
    }

    /**
     * Check that a file with a name matching the regex has been created.
     * @param {RegExp} [regex] regular expression.
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkFileWasCreated(regex) {
        return new Promise( (resolve, reject) => {
            let fileExists = false;
            fs.readdirSync('.').forEach((file) => {
                if(file.match(regex)) {
                    fileExists = true;
                }
            });
            if(fileExists) {
                resolve();
            } else {
                reject('could not find file with name matching ', regex);
            }
        });
    }

    /**
     * Check the HTTP response status
     * @param {Number} code expected HTTP response code.
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkResponseCode(code) {
        return new Promise( (resolve, reject) => {
            if (!this.lastResp) {
                reject('a response was expected, but no response messages have been generated');
            } else if (this.lastResp.code.toString() === code.toString()) {
                resolve();
            } else {
                reject('received HTTP status: ' + this.lastResp.code + ', ' + this.lastResp.error);
            }
        });
    }

    /**
     * Check the last message with regex
     * @param {RegExp} [regex] Optional regular expression.
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkResponseBody(regex) {
        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp.response) {
                reject('a response was expected, but no response messages have been generated');
            } else {
                if(this.lastResp.response.match(regex)) {
                    resolve();
                } else {
                    reject('regex match failed');
                }
            }
        });
    }

    /**
     * Check the last message matches JSON
     * @param {*} pattern Expected json
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkResponseJSON(pattern) {
        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp.response) {
                reject('a response was expected, but no response messages have been generated');
            } else {
                const result = matchPattern(JSON.parse(this.lastResp.response), pattern);
                if(result === null) {
                    resolve();
                } else {
                    reject('JSON match failed: ' + result);
                }
            }
        });
    }

    /**
     * Save a matched pattern from the current console stdout as an alias in an internal map
     * @param {*} regex The regex to match on
     * @param {*} group The matched regex group to save
     * @param {*} alias The alias to save the matched regex under
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    saveMatchingGroupAsAlias(regex, group, alias) {
        let type = 'stdout';
        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp[type]) {
                reject('a response is required, but no response messages have been generated');
            } else {
                // match and save as alias, if no match then reject
                let match = regex.exec(this.lastResp[type]);
                if (match && match.length===2) {
                    this.aliasMap.set(alias, match[group]);
                    resolve();
                } else {
                    reject('regex match failed: unable to add alias to map');
                }
            }
        })
        .catch((err) => {
            return Promise.reject(err);
        });
    }

    /**
     * Convert a card with a secret to use HSM to manage it's private keys
     * @param {string} cardFile the card
     */
    async convertToHSM(cardFile) {

        try {
            const adminConnection = new AdminConnection();
            let cardBuffer = fs.readFileSync(cardFile);
            let curCard = await IdCard.fromArchive(cardBuffer);
            let cardName = BusinessNetworkCardStore.getDefaultCardName(curCard);
            let ccp = curCard.getConnectionProfile();
            ccp.client['x-hsm'] = {
                'library': '/usr/local/lib/softhsm/libsofthsm2.so',
                'slot': 0,
                'pin': 98765432
            };

            let metadata = {
                businessNetwork: curCard.getBusinessNetworkName(),
                userName: curCard.getUserName(),
                enrollmentSecret: curCard.getEnrollmentCredentials().secret
            };
            let newCard = new IdCard(metadata, ccp);

            cardBuffer = await newCard.toArchive({ type: 'nodebuffer' });

            let dir = path.dirname(cardFile);
            let fn = path.basename(cardFile);
            let nameEnd = fn.indexOf('@');
            let newCardFile = path.join(dir, fn.substring(0, nameEnd) + '_hsm' + fn.substring(nameEnd, fn.length));

            fs.writeFileSync(newCardFile, cardBuffer);

            // ensure it doesn't exist.
            const exists = await adminConnection.hasCard(cardName);
            if (exists) {
                await adminConnection.deleteCard(cardName);
            }
        } catch(err) {
            throw new Error(`failed to convert to HSM and Import. Error was ${err}`);
        }
    }

    /**
     * extract a secret from a card and store it in the alias
     * @param {*} alias the alias name
     * @param {*} cardFile the card file
     */
    async extractSecret(alias, cardFile) {
        let cardBuffer = fs.readFileSync(cardFile);
        let curCard = await IdCard.fromArchive(cardBuffer);

        this.aliasMap.set(alias, curCard.getEnrollmentCredentials().secret);
    }

    /**
     * deploy the specified business network from a directory
     * @param {*} name the name of the business network
     */
    async deployBusinessNetworkFromDirectory(name) {
        // These steps assume that the arg «name» is the business network path,
        // and is located in ./resource/sample-networks

        if(this.busnets[name]) {
            // Already deployed
            return;
        } else {
            this.busnets[name] = name;
        }

        const bnaFile = `./tmp/${name}.bna`;
        const adminId = `admin@${name}`;
        const success = /Command succeeded/;
        const checkOutput = (response) => {
            if(!response.stdout.match(success)) {
                throw new Error(response);
            }
        };

        let response = await this.runCLI(true, `composer runtime install --card TestPeerAdmin@org1 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer runtime install --card TestPeerAdmin@org2 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer archive create -t dir -a ./tmp/${name}.bna -n ./resources/sample-networks/${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file networkadmin.card`);
        checkOutput(response);
        response = await this.runCLI(undefined, `composer card delete -n ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
    }

    /**
     * deploy the specified business network archive
     * @param {*} name the name of the business network
     */
    async deployBusinessNetworkArchive(name) {

        if(this.busnets[name]) {
            // Already deployed
            return;
        } else {
            this.busnets[name] = name;
        }

        const bnaFile = `./tmp/${name}.bna`;
        const adminId = `admin@${name}`;
        const success = /Command succeeded/;
        const checkOutput = (response) => {
            if(!response.stdout.match(success)) {
                throw new Error(response);
            }
        };

        let response = await this.runCLI(true, `composer runtime install --card TestPeerAdmin@org1 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer runtime install --card TestPeerAdmin@org2 --businessNetworkName ${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file networkadmin.card`);
        checkOutput(response);
        response = await this.runCLI(undefined, `composer card delete -n ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
    }

}

module.exports = Composer;
