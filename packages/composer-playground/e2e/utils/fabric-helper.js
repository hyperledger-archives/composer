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