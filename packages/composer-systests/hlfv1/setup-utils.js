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

let path = require('path');
let fs = require('fs-extra');

let hfc = require('fabric-client');
let copService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
let User = require('fabric-client/lib/User.js');

// specifically set the values to defaults because they may have been overridden when
// running in the overall test bucket ('gulp test')
module.exports.resetDefaults = function () {
    global.hfc.config = undefined;
};

module.exports.cleanupDir = function (keyValStorePath) {
    let absPath = path.join(process.cwd(), keyValStorePath);
    let exists = module.exports.existsSync(absPath);
    if (exists) {
        fs.removeSync(absPath);
    }
};

// utility function to check if directory or file exists
// uses entire / absolute path from root
module.exports.existsSync = function (absolutePath /*string*/) {
    try {
        let stat = fs.statSync(absolutePath);
        if (stat.isDirectory() || stat.isFile()) {
            return true;
        } else {
            return false;
        }
    }
    catch (e) {
        return false;
    }
};

let useTls = process.env.SYSTEST.match('tls$');

if (useTls) {
    hfc.addConfigFile(path.join(__dirname, './config.tls.json'));
} else {
    hfc.addConfigFile(path.join(__dirname, './config.json'));
}
let ORGS = hfc.getConfigSetting('test-network');

/**
 * get a user for submission
 * @param {any} username username
 * @param {any} password password
 * @param {any} client client
 * @param {any} userOrg org
 * @returns {Promise} a promise
 */
function getSubmitter(username, password, client, userOrg) {
    let caUrl = ORGS[userOrg].ca;
    let mspid = ORGS[userOrg].mspid;

    return client.getUserContext(username)
        .then((user) => {
            return new Promise((resolve, reject) => {
                if (user && user.isEnrolled()) {
                    console.log('Successfully loaded member from persistence');
                    return resolve(user);
                }

                // need to enroll it with CA server
                let cop = new copService(caUrl);

                let member;
                return cop.enroll({
                    enrollmentID: username,
                    enrollmentSecret: password
                }).then((enrollment) => {
                    console.log('Successfully enrolled user \'' + username + '\'');

                    member = new User(username, client);
                    return member.setEnrollment(enrollment.key, enrollment.certificate, mspid);
                }).then(() => {
                    return client.setUserContext(member);
                }).then(() => {
                    return resolve(member);
                }).catch((err) => {
                    console.log('Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
                    throw new Error('failed to enroll');
                });
            });
        });
}

/**
 * read a file.
 * @param {any} path file path
 * @returns {Promise} resolves when file read
 */
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                reject(new Error('Failed to read file ' + path + ' due to error: ' + err));
            }
            else {
                resolve(data);
            }
        });
    });
}

module.exports.readFile = readFile;

module.exports.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports.readFile = readFile;

module.exports.getSubmitter = function (client, org) {
    return getSubmitter('admin', 'adminpw', client, org);
};
