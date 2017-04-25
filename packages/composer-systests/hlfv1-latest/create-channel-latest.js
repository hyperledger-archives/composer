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

let hfc = require('fabric-client');
let path = require('path');
let fs = require('fs');

const testUtil = require('./setup-utils-latest.js');
const homedir = require('homedir');

let useTls = process.env.SYSTEST.match('tls$');
let configDirname = __dirname.substr(0, __dirname.length - '-latest'.length);


if (useTls) {
    console.log('using tls connection to create the channel');
    hfc.addConfigFile(path.join(configDirname, './config.tls.json'));
} else {
    console.log('using non-tls connection');
    hfc.addConfigFile(path.join(configDirname, './config.json'));
}
let ORGS = hfc.getConfigSetting('test-network');

//TODO: Need to make this configurable
let keystore = homedir() + '/.hfc-key-store';
let channel = 'mychannel';

let client = new hfc();
//let chain = client.newChain(channel);
let orderer;

if (useTls) {
    let caRootsPath = ORGS.orderer.tls_cacerts;
    let data = fs.readFileSync(path.join(configDirname, caRootsPath));
    let caroots = Buffer.from(data).toString();

    orderer = client.newOrderer(
        ORGS.orderer.url,
        {
            'pem': caroots,
            'ssl-target-name-override': ORGS.orderer['server-hostname']
        }
    );
}
else {
    orderer = client.newOrderer(ORGS.orderer);
}

hfc.newDefaultKeyValueStore({
    path: keystore
})
    .then((store) => {
        client.setStateStore(store);

        // get the admin id for org1 and enroll them if not already enrolled
        return testUtil.getSubmitter(client, 'org1');
    })
    .then((admin) => {
        console.log('Successfully enrolled user \'admin\'');

        // readin the envelope to send to the orderer
        return testUtil.readFile(path.join(configDirname, './mychannel.tx'));
    }, (err) => {
        console.log('Failed to enroll user \'admin\'. ' + err);
        throw new Error('failed to enroll user');
    })
    .then((data) => {
        console.log('Successfully read file');
        let request = {
            envelope : data,
            name : channel,
            orderer : orderer
        };
        // send to orderer
        return client.createChannel(request);
    }, (err) => {
        console.log('Failed to read file for channel template: ' + err);
        throw new Error('failed to read channel creation transaction');
    })
    .then((chain) => {
        if (chain) {
            let test_orderers = chain.getOrderers();
            if (test_orderers) {
                let test_orderer = test_orderers[0];
                if (test_orderer === orderer) {
                    console.log('Successfully created the channel.');
                }
                else {
                    console.log('Chain did not have the orderer.');
                }
            }
            return testUtil.sleep(5000);
        } else {
            console.log('Failed to create the channel. ');
        }
    }, (err) => {
        console.log('Failed to initialize the channel: ' + err.stack ? err.stack : err);
        throw new Error('failed to initialize the channel');
    })
    .then((nothing) => {
        console.log('Successfully waited to make sure new channel was created.');
    }, (err) => {
    });
