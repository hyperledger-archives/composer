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
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const childProcess = require('child_process');
const fs = require('fs');
const IdCard = require('composer-common').IdCard;
const matchPattern = require('lodash-match-pattern');
const net = require('net');
const path = require('path');
const request = require('request-promise-any');
const sleep = require('sleep-promise');
const stripAnsi = require('strip-ansi');
const axios = require('axios');

const LOG_LEVEL_SILLY = 5;
const LOG_LEVEL_DEBUG = 4;
const LOG_LEVEL_VERBOSE = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_NONE = -1;

// Mapping between strings and log levels.
const _logLevelAsString = {
    silly: LOG_LEVEL_SILLY,
    debug: LOG_LEVEL_DEBUG,
    verbose: LOG_LEVEL_VERBOSE,
    info: LOG_LEVEL_INFO,
    warn: LOG_LEVEL_WARN,
    error: LOG_LEVEL_ERROR,
    none: LOG_LEVEL_NONE
};

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
     * Get all files recursively in a directoy
     * @param {String} dir directory to search
     * @param {String[]} fileList file list to append
     * @returns {String[]} list of files in directory
     */
    getFilesInDirectory(dir, fileList){
        fileList = fileList || [];
        let files = fs.readdirSync(dir);
        files.forEach((file) => {
            let name = dir + '/' + file;
            if (fs.statSync(name).isDirectory()){
                this.getFilesInDirectory(name, fileList);
            } else {
                fileList.push(name);
            }
        });
        return fileList;
    }

    /**
     * Check that the provided list of items (files or folders) exist
     * @param {String} type -  type (folder or file) that is being considered
     * @param {DataTable} table -  DataTable listing the items expeted to exist
     * @return {Promise} - Promise that will be resolved or rejected with an error
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
     * Check that the provided list of items exist in the passed folder
     * @param {String} folder -  folder to be inspected
     * @param {DataTable} table -  DataTable listing the items expected to exist
     * @return {Promise} - Pomise that will be resolved or rejected with an error
     */
    checkExistsStrict(folder, table) {
        const passedFiles = table.raw();

        // Make sure all paths are accounted for
        const expectedFiles = [];
        for (let file of passedFiles) {
            expectedFiles.push(path.resolve(__dirname,folder,file.toString()));
        }

        // get all files
        const allFiles = this.getFilesInDirectory(path.resolve(__dirname,folder));

        // Check for missing items
        let missingFiles =[];
        for (let file of expectedFiles){
            if(allFiles.indexOf(file) === -1){
                missingFiles.push(file);
            }
        }
        if (missingFiles.length !== 0) {
            return Promise.reject('The following item(s) should exist: ' + missingFiles.toString());
        }

        // Check for superfluous items
        let unexpectedFiles =[];
        for (let file of allFiles){
            if(expectedFiles.indexOf(file) === -1){
                unexpectedFiles.push(file);
            }
        }
        if (unexpectedFiles.length !== 0) {
            return Promise.reject('The following item(s) should not exist: ' + unexpectedFiles.toString());
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
            uri: `${path}`,
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
            let env = Object.create( process.env );
            if (this.jsonConfig){
                env.NODE_CONFIG=this.jsonConfig;
            } else {
                delete env.NODE_CONFIG;
            }

            return new Promise( (resolve, reject) => {

                const options = {
                    env: env
                };
                let childCliProcess = childProcess.exec(command, options);

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
                    console.log(label, 'STDOUT', data);
                    stdout += data;
                    if(stdout.match(regex)) {
                        success = true;
                        resolve({stdout: stdout, stderr: stderr});
                    }
                });

                childCliProcess.stderr.on('data', (data) => {
                    data = stripAnsi(data);
                    console.log(label, 'STDERR', data);
                    stderr += data;
                });

                childCliProcess.on('error', (error) => {
                    reject({error: error, stdout: stdout, stderr: stderr});
                });

            });
        }
    }

    /**
     * Check the last message with regex ignoring multiple whitespace
     * @param {RegExp} match Optional rstring match.
     * @param {boolean} isError boolean to indicate if testing error or not
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    checkConsoleOutput(match, isError) {
        let type;

        if(isError){
            type = 'stderr';
        } else {
            type = 'stdout';
        }

        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp[type]) {
                reject('a ' + type + ' response was expected, but no response messages have been generated');
            } else if (match) {
                let modRegEx = match.toString().replace(/ +(?= )/g,'');
                let modResp = this.lastResp[type].replace(/ +(?= )/g,'');
                if(modResp.match(modRegEx)) {
                    resolve();
                } else {
                    reject(`Regex match on ${type} failed with mulitple whitespace characters removed.\nExpected: ${modRegEx}\nActual: ${modResp}`);
                }
            }
        });
    }

    /**
     * Check the last message with regex inclusive of whitespace
     * @param {RegExp} [regex] Optional regular expression.
     * @param {boolean} isError boolean to indicate if testing error or not
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    checkConsoleOutputStrict(regex, isError) {
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
     * Check the last message with an expected block of text
     * @param {String} text block of text that should exist
     * @param {Boolean} isError boolean to indicate if testing stdErr or stdOut
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    checkTextBlock(text, isError) {
        let type;
        const textBuffer = new Buffer.from(text);
        const utf8Text = textBuffer.toString('utf8');
        if(isError){
            type = 'stderr';
        } else {
            type = 'stdout';
        }

        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp[type]) {
                reject('a ' + type + ' response was expected, but no response messages have been generated');
            } else {
                if(this.lastResp[type].match(utf8Text)) {
                    resolve();
                } else {
                    reject(`Regex match on ${type} text block failed.\nExpected: ${utf8Text}\nActual: ${this.lastResp[type]}`);
                }
            }
        });
    }

    /**
     * Check that a file with a name matching the regex has been created.
     * @param {RegExp} [regex] regular expression.
     * @return {Promise} - Promise that will be resolved or rejected with an error
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
     * @return {Promise} - Promise that will be resolved or rejected with an error
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
     * @return {Promise} - Promise that will be resolved or rejected with an error
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
     * @return {Promise} - Promise that will be resolved or rejected with an error
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
     * Check the last message matches JSON
     * @param {String} name filename to write the data to
     * @return {Promise} - Promise that will be resolved or rejected with an error
     */
    writeResponseData(name) {
        return new Promise( (resolve, reject) => {
            if (!this.lastResp || !this.lastResp.response) {
                reject('a response was expected, but no response messages have been generated');
            } else {
                let pathname = path.resolve(name);
                let buffer = Buffer.from(this.lastResp.response,'binary');
                fs.writeFileSync(pathname,buffer);
                resolve();
            }
        });
    }



    /**
     * Save a matched pattern from the current console stdout as an alias in an internal map
     * @param {*} regex The regex to match on
     * @param {*} group The matched regex group to save
     * @param {*} alias The alias to save the matched regex under
     * @return {Promise} - Promise that will be resolved or rejected with an error
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

        const packageJsonPath = path.join(__dirname, '../resources/sample-networks/'+name+'/package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const networkName = packageJson.name;
        const networkVersion = packageJson.version;

        let response = await this.runCLI(true, `composer archive create -t dir -a ${bnaFile} -n ./resources/sample-networks/${name}`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network install --card TestPeerAdmin@org1 --archiveFile ${bnaFile} -o npmrcFile=/tmp/npmrc`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network install --card TestPeerAdmin@org2 --archiveFile ${bnaFile} -o npmrcFile=/tmp/npmrc`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --networkName ${networkName} --networkVersion ${networkVersion} --file networkadmin.card`);
        checkOutput(response);
        response = await this.runCLI(undefined, `composer card delete -c ${adminId}`);
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

        const banana = fs.readFileSync(path.resolve(bnaFile));
        const definition = await BusinessNetworkDefinition.fromArchive(banana);
        const networkName = definition.getName();
        const networkVersion = definition.getVersion();

        let response = await this.runCLI(true, `composer network install --card TestPeerAdmin@org1 --archiveFile ${bnaFile} -o npmrcFile=/tmp/npmrc`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network install --card TestPeerAdmin@org2 --archiveFile ${bnaFile} -o npmrcFile=/tmp/npmrc`);
        checkOutput(response);
        response = await this.runCLI(true, `composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --networkName ${networkName} --networkVersion ${networkVersion} --file networkadmin.card`);
        checkOutput(response);
        response = await this.runCLI(undefined, `composer card delete -c ${adminId}`);
        // can't check the response here, if it exists the card is deleted and you get a success
        // if it didn't exist then you get a failed message. however if there is a problem then the
        // import won't work so check the response to this.
        response = await this.runCLI(true, 'composer card import --file networkadmin.card');
        checkOutput(response);
    }

    /**
     * Loads a json file based on the type
     *
     * @param {String} type type of the card store to set
     */
    setCardStore(type){
        switch (type) {
        case 'redis':{
            this.jsonConfig = fs.readFileSync(path.resolve(__dirname,'..','resources','cardstore-redis.json'));
            break;
        }
        default:
            throw new Error(`Unkown card store type ${type}`);

        }
    }

    /**
     * Start watching the logs
     */
    startWatchingLogs(){
        console.log('> startWaching');
        this.getCCLogs();
        console.log('< startWatching'+this.logPromise);
    }

    /**
     * Stop watching the logs by destroying the stream.
     */
    async stopWatchingLogs(){
        console.log(`Stop watching the logs ${this.logStream}`);
        // first check to see if there is a stream
        if (this.logStream){
            this.logStream.destroy();
        }
        this.logs = await this.logPromise;
    }

    /**
     * @param {String} logLevel the maximum loglevel to check for
     * @return {Promise} resolved if all go, reject with exception if not
     */
    async checkMaximumLogLevel(logLevel){

        let maxLogLevelInt = _logLevelAsString[logLevel.toLowerCase()];

        for (let logEntry of this.logs){
            let currentLogLevelInt = _logLevelAsString[logEntry.type.toLowerCase()];
            if (currentLogLevelInt>maxLogLevelInt){
                throw new Error(`${logEntry.type} is too high.  LogEntry is [${logEntry.type} ${logEntry.method} ${logEntry.file} ${logEntry.msg}]`);
            }
        }
        return('all good');

    }

    /**
     * This collects the logs from the Docker log collection 'agent'
     * Logspout is the docket image that is being used to collect them
     * and make them available over http via a rest api

     */
    getCCLogs() {
        // looking for just the chain code containers (prefixed dev-) and for no ANSI colouring
        let uri = 'http://127.0.0.1:8000/logs/name:dev-*?colors=off';



        // Streaming the data back
        this.logPromise = new Promise(async (resolve,reject) => {
            console.log('Making get request');
            // GET request for remote image
            let response = await axios({
                method:'get',
                url:uri,
                responseType:'stream'
            });
            let allLogPoints = [];
            this.logStream = response.data;
            console.log(`The log stream is ${this.logStream} `);
            response.data.on('data', (chunk) => {
                let chunkString= chunk.toString();
                // strip off the Logspout prefix (the docker image name)
                // the regex is to just focus on the main logs lines, and not any continuations
                let line = chunkString.substring(chunkString.indexOf('|')+1);

                if (line.match(/\d\d\d\d-\d\d-\d\d\D\d\d:\d\d:\d\d.*\[.*\]/)){

                    let logPoint={};
                    // assumes the fixed format of the log messages
                    logPoint.type = line.substring(36,45).trim();
                    logPoint.file = line.substring(46,71).trim();
                    logPoint.method = line.substring(72,98).trim();
                    logPoint.msg = line.substring(98).trim();

                    allLogPoints.push(logPoint);
                }
            });

            // when stream is closed, resolve the promise with all the log points currently captured
            response.data.on('close',()=>{
                resolve(allLogPoints);
            });
        });

        console.log(`The log promise is ${this.logPromise}`);


    }

}



module.exports = Composer;
