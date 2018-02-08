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

const Promise = require('bluebird');
const exec = Promise.promisify(require('child_process').exec);
const fs = require('fs');

/** Class to help with starting and clearing fabric */
class FabricHelper {
    /** Runs script to setup the fabric environment
     * @returns {string} - output from running setupFabric.sh
     */
    static start() {
        return exec(__dirname + '/../fabric/scripts/setupFabric.sh');
    }

    /** Runs script to cleanup the fabric environment
     * @returns {string} - output from running cleanupFabric.sh
     */
    static stop() {
        return exec(__dirname + '/../fabric/scripts/cleanupFabric.sh');
    }

    /** Generates a peer admin card to use
     * @returns {string} - name of card created
     */
    static async createPeerAdmin() {

        const cardName = 'TestPeerAdmin';
        const cp = __dirname + '/../fabric/hlfv1/profiles/basic-connection-org1.json';
        const pub = __dirname + '/../fabric/hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem';
        const priv = __dirname + '/../fabric/hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/key.pem';

        // check we have the certificates
        if (!fs.existsSync(pub) || !fs.existsSync(priv)) {
            throw new Error('Certificate(s) not found');
        }

        // check we have the connection proile
        if (!fs.existsSync(cp)) {
            throw new Error('Connection profile not found');
        }

        await exec(`composer card create -p ${__dirname}/../fabric/hlfv1/profiles/basic-connection-org1.json -u TestPeerAdmin -r PeerAdmin -r ChannelAdmin -f /tmp/${cardName}.card -c ${pub} -k ${priv}`);

        return `/tmp/${cardName}.card`;
    }
}
module.exports = FabricHelper;