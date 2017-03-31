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

let testUtil = require('./setup-utils.js');
let utils = require('fabric-client/lib/utils.js');
let Orderer = require('fabric-client/lib/Orderer.js');
const homedir = require('homedir');

let logger = utils.getLogger('create-channel');

let useTls = process.env.SYSTEST.match('tls$');

if (useTls) {
    console.log('using tls connection to create the channel');
    hfc.addConfigFile(path.join(__dirname, './config.tls.json'));
} else {
    console.log('using non-tls connection');
    hfc.addConfigFile(path.join(__dirname, './config.json'));
}
let ORGS = hfc.getConfigSetting('test-network');

//TODO: Need to make this configurable
let keystore = homedir() + '/.hfc-key-store';
let channel = 'mychannel';

let client = new hfc();
let chain = client.newChain(channel);

if (useTls) {
    let caRootsPath = ORGS.orderer.tls_cacerts;
    let data = fs.readFileSync(path.join(__dirname, caRootsPath));
    //let data = fs.readFileSync(caRootsPath);

    let caroots = Buffer.from(data).toString();
    chain.addOrderer(
        new Orderer(
            ORGS.orderer.url,
            {
                'pem': caroots,
                'ssl-target-name-override': ORGS.orderer['server-hostname']
            }
        )
    );
}
else {
    chain.addOrderer(new Orderer(ORGS.orderer));
}


//let org = ORGS.org1.name;

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
        return testUtil.readFile('./mychannel.tx');
    }, (err) => {
        console.log('Failed to enroll user \'admin\'. ' + err);
        throw new Error('failed to enroll user');
    })
    .then((data) => {
        console.log('Successfully read file');
        let request = {
            envelope: data
        };
        // send to orderer
        return chain.createChannel(request);
    }, (err) => {
        console.log('Failed to read file for channel template: ' + err);
        throw new Error('failed to read channel creation transaction');
    })
    .then((response) => {
        logger.debug(' response ::%j', response);

        if (response && response.status === 'SUCCESS') {
            console.log('Successfully created the channel.');
            return testUtil.sleep(5000);
        } else {
            console.log('Failed to create the channel. ');
            throw new Error('failed to create channel');
        }
    }, (err) => {
        console.log('Failed to initialize the channel: ' + err.stack ? err.stack : err);
        throw new Error('failed to initialize the channel');
    })
    .then((nothing) => {
        console.log('Successfully waited to make sure new channel was created.');
    }, (err) => {
    });
