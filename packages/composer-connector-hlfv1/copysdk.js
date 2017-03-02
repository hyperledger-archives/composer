'use strict';

const fs = require('fs-extra');

fs.copy('node_modules/fabric-sdk-node/fabric-ca-client', 'node_modules/fabric-ca-client', (err) => {
    if (err) return console.error(err);
});
fs.copy('node_modules/fabric-sdk-node/fabric-client', 'node_modules/fabric-client', (err) => {
    if (err) return console.error(err);
    fs.readJson('./node_modules/fabric-client/config/default.json', (err, config) => {
        config['crypto-suite-software'].EC = './impl/CryptoSuite_ECDSA_AES.js';
        fs.writeJson('./node_modules/fabric-client/config/default.json', config, (err) => {
            if (err) return console.error(err);
        });
});

});


