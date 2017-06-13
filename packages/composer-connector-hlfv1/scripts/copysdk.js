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

const fs = require('fs-extra');

// copy the node sdk to the expected node module directories
// and also patch the default.json file to locate the ECDSA_AES.js file
fs.copy('./node_modules/fabric-sdk-node/fabric-ca-client', './node_modules/fabric-ca-client', (err) => {
    if (err) {
        return console.error(err);
    }
});
fs.copy('./node_modules/fabric-sdk-node/fabric-client', './node_modules/fabric-client', (err) => {
    if (err) {
        return console.error(err);
    }
    fs.readJson('./node_modules/fabric-client/config/default.json', (err, config) => {
        config['crypto-suite-software'].EC = './impl/CryptoSuite_ECDSA_AES.js';
        fs.writeJson('./node_modules/fabric-client/config/default.json', config, (err) => {
            if (err) {
                return console.error(err);
            }
        });
    });
});


