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
//TODO: should be able to do through instantiated hfc.newPeer etc
let Peer = require('fabric-client/lib/Peer.js');
let Orderer = require('fabric-client/lib/Orderer.js');

let testUtil = require('./setup-utils-latest.js');

let the_user = null;
let tx_id = null;
let nonce = null;
let keystore = homedir() + '/.hfc-key-store';
let configDirname = __dirname.substr(0, __dirname.length - '-latest'.length);

let channel = 'mychannel';

// yuk, not sure this is going to work
//let grpc = require('grpc');
//let _commonProto = grpc.load(path.join(__dirname, '../../../fabric-client/lib/protos/common/common.proto')).common;


let useTls = process.env.SYSTEST.match('tls$');

if (useTls) {
    hfc.addConfigFile(path.join(configDirname, './config.tls.json'));
    console.log('using tls connection to join the peers');
} else {
    console.log('using non-tls connection');
    hfc.addConfigFile(path.join(configDirname, './config.json'));
}
let ORGS = hfc.getConfigSetting('test-network');

/**
 * join channel
 *
 * @param {any} org org
 * @returns {Promise} promise
 */
function joinChannel(org) {
    console.log(util.format('Calling peers in organization "%s" to join the channel', org));

    //
    // Create and configure the test chain
    //
    let client = new hfc();
    let chain = client.newChain(channel);
    if (useTls) {
        let caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(configDirname, caRootsPath));
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
                    let data = fs.readFileSync(path.join(configDirname, ORGS[org][key].tls_cacerts));
                    targets.push(
                        client.newPeer(
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
            tx_id = hfc.buildTransactionID(nonce, the_user);
            let request = {
                targets: targets,
                txId: tx_id,
                nonce: nonce
            };

            // do I need to care about eventhub responses for
            // our simple env ?
            let eventhubs = [];
            let eventPromises = [];
            eventhubs.forEach((eh) => {
                let txPromise = new Promise((resolve, reject) => {
                    let handle = setTimeout(reject, 30000);

                    eh.registerBlockEvent((block) => {
                        clearTimeout(handle);

                    // in real-world situations, a peer may have more than one channels so
                    // we must check that this block came from the channel we asked the peer to join
                        if (block.data.data.length === 1) {
                            // Config block must only contain one transaction
                            //let envelope = _commonProto.Envelope.decode(block.data.data[0]);
                            //let payload = _commonProto.Payload.decode(envelope.payload);
                            //let channel_header = _commonProto.ChannelHeader.decode(payload.header.channel_header);

                            //if (channel_header.channel_id === testUtil.END2END.channel) {
                            console.log('The new channel has been successfully joined on peer '+ eh.ep._endpoint.addr);
                            resolve();
                            //}
                        }
                    });
                });
                eventPromises.push(txPromise);
            });

            let joinPromise = chain.joinChannel(request);
            //return Promise.all([joinPromise].concat(eventPromises));
            return joinPromise;
        }, (err) => {
            console.log('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
        })
        .then((results) => {
            console.log(util.format('Join Channel R E S P O N S E : %j', results));
            console.log(results[0]);
            console.log(results[0].response);
            // lets just check the first peer or the 2
            if (results[0] && results[0].response && results[0].response.status === 200) {
                console.log('Peer 0 Successfully joined channel.');
            }
            else {
                console.log('results indicated peer 0 failed to join channel');
            }
            if (results[1] && results[1].response && results[1].response.status === 200) {
                console.log('Peer 1 Successfully joined channel.');
            }
            else {
                console.log('results indicated peer 1 failed to join channel');
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
