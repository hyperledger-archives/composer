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

let util = require('util');
let path = require('path');
let fs = require('fs');
const homedir = require('homedir');

let hfc = require('fabric-client');
let utils = require('fabric-client/lib/utils.js');
let Peer = require('fabric-client/lib/Peer.js');
let Orderer = require('fabric-client/lib/Orderer.js');

let testUtil = require('./setup-utils.js');

let the_user = null;
let tx_id = null;
let nonce = null;
let keystore = homedir() + '/.hfc-key-store';

let channel = 'mychannel';

let logger = utils.getLogger('join-channel');

let useTls = process.env.SYSTEST.match('tls$');

if (useTls) {
    hfc.addConfigFile(path.join(__dirname, './config.tls.json'));
    console.log('using tls connection to join the peers');
} else {
    console.log('using non-tls connection');
    hfc.addConfigFile(path.join(__dirname, './config.json'));
}
let ORGS = hfc.getConfigSetting('test-network');

/**
 * join channel
 * @param {any} org org
 * @returns {Promise} promise
 */
function joinChannel(org) {
    console.log(util.format('Calling peers in organization "%s" to join the channel'));

    //
    // Create and configure the test chain
    //
    let client = new hfc();
    let chain = client.newChain(channel);
    if (useTls) {
        let caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(__dirname, caRootsPath));
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

    let targets = [];
    for (let key in ORGS[org]) {
        if (ORGS[org].hasOwnProperty(key)) {
            if (key.indexOf('peer') === 0) {
                if (useTls) {
                    let data = fs.readFileSync(path.join(__dirname, ORGS[org][key].tls_cacerts));
                    //data = fs.readFileSync(ORGS[org][key].tls_cacerts);

                    targets.push(
                        new Peer(
                            ORGS[org][key].requests,
                            {
                                pem: Buffer.from(data).toString(),
                                'ssl-target-name-override': ORGS[org][key]['server-hostname']
                            }
                        )
                    );
                }
                else {
                    targets.push(new Peer(ORGS[org][key].requests));
                }
            }
        }
    }

    return hfc.newDefaultKeyValueStore({
        path: keystore
    })
        .then((store) => {
            client.setStateStore(store);
            return testUtil.getSubmitter(client, org);
        })
        .then((admin) => {
            console.log('Successfully enrolled user \'admin\'');
            the_user = admin;

            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);
            let request = {
                targets: targets,
                txId: tx_id,
                nonce: nonce
            };
            return chain.joinChannel(request);
        }, (err) => {
            console.log('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
        })
        .then((results) => {
            logger.info(util.format('Join Channel R E S P O N S E : %j', results));

            if (results[0] && results[0].response && results[0].response.status === 200) {
                console.log('Successfully joined channel.');
            }
            else {
                console.log(' Failed to join channel');
                throw new Error('Failed to join channel');
            }
        }, (err) => {
            console.log('Failed to join channel due to error: ' + err.stack ? err.stack : err);
        });
}

joinChannel('org1')
    .then(() => {
        console.log(util.format('Successfully joined peers in organization "%s" to the channel', ORGS.org1.name));
        //joinChannel('org2');
    }, (err) => {
        console.log(util.format('Failed to join peers in organization "%s" to the channel', ORGS.org1.name));
        throw new Error('error 1');
    })
    .catch(function (err) {
        console.log('Failed request. ' + err);
    });
