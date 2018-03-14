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

import { Constants } from '../constants';
import { CodeRunner } from './code-runner';
import fs = require('fs');
import path = require('path');

/** Class to help with starting and clearing fabric */
export class FabricHelper {

    /**
     * Runs script to cleanup the fabric environment
     * @returns {string} - output from running cleanupFabric.sh
     */
    static stop() {
        return CodeRunner.runCode(path.join(Constants.scriptsDir, 'cleanTestFolders.sh'))
        .then(() => {
            return CodeRunner.runCode(path.join(Constants.scriptsDir, 'cleanupFabric.sh'));
        });
    }

    /**
     * Generates a peer admin card to use
     */
    static createPeerAdmin() {

        const cp = path.join(Constants.fabricConfigDir, 'profiles/basic-connection-org1.json');
        const pub = path.join(Constants.fabricConfigDir, 'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem');
        const priv = path.join(Constants.fabricConfigDir, 'crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/key.pem');
        const outputFile = path.join(Constants.tempDir, Constants.peerAdminCardName);
        // check we have the certificates
        if (!fs.existsSync(pub)) {
            throw new Error('Public Certificate not found at location: ' + pub);
        }

        if (!fs.existsSync(priv)) {
            throw new Error('Private certificate not found at location: ' + priv);
        }

        // check we have the connection proile
        if (!fs.existsSync(cp)) {
            throw new Error('Connection profile not found at location: ' + cp);
        }

        return CodeRunner.runCode(`composer card create -p ${cp} -u TestPeerAdmin -r PeerAdmin -r ChannelAdmin -f ${outputFile} -c ${pub} -k ${priv}`);
    }

    /**
     * Build and deploy a sample business network
     * @param {String} name The name of the business network to deploy
     * @return {Promise}
     */
    static async deploySampleNetwork(name) {
        const sampleDir = path.join(Constants.sampleNetworkDir, name);
        const bnaFile = path.join(Constants.tempDir, name) + '.bna';
        const card = path.join(Constants.tempDir, 'networkadmin') + '.card';

        await CodeRunner.runCode(`composer runtime install --card TestPeerAdmin@org1 --businessNetworkName ${name}`);
        await CodeRunner.runCode(`composer runtime install --card TestPeerAdmin@org2 --businessNetworkName ${name}`);
        await CodeRunner.runCode(`composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ${bnaFile} --file ${card}`);
        return CodeRunner.runCode(`composer card import --file ${card}`);
    }
}
