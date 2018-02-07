'use strict';

/* eslint-disable no-control-regex */
/* eslint-disable no-console */
/* eslint-disable no-use-before-define */

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const fabric = require(__dirname+'/utils/fabric-helper');

// Note that this script is called via npm run e2e:main/nobuild and consequently all
// paths are relative to that calling location (~/composer-playground)

// Are we running against fabric?
const args = process.argv.slice(process.execArgv.length + 2);
if (args.includes('--fabric') || args.includes('-f')) {
    runFabric();
}
else {
    runTests('web');
}

async function runFabric() { // eslint-disable-line
    console.log('Setting up fabric, one moment...');
    await fabric.start();
    console.log('Fabric setup complete');

    console.log('Creating peer admin card');
    await fabric.createPeerAdmin();
    console.log('Card created');

    runTests('fabric');
}

function runTests(connection) { // eslint-disable-line
    // Start the target test server as a spawned child process in test mode (no npm connections)
    let childServer = spawn('node', ['cli.js', '-p', '3001', '-test']);

    // Execute protractor and attach to listeners
    let childProtractor = exec(`webdriver-manager update && protractor -- protractor.${connection}.conf.js`);
    // Log all output of Protractor run
    childProtractor.stdout.on('data', function(data) {
        // do not log return characters or 'green dot progress'
        let msg = data.replace(/\n$/, '');
        msg = msg.replace(/\x1b\[32m.\x1b\[0m/, '');
        if (msg.length) {
            console.log(msg);
        }
    });
    // Log ony error output
    childProtractor.stderr.on('data', function(data) {
        console.log('stdErr: ' + data);
    });
    // Capture Protactor return code
    childProtractor.on('close', async function(code) {
        console.log('Protractor return code: ', code);
        if(code !== 0) {
            code = 1;
        }
        console.log('Exit return code: ', code);
        childServer.kill();
        if (connection === 'fabric') {
            console.log('Cleaning up fabric, one moment\n');
            await fabric.stop();
            console.log('Cleanup complete. Exiting');
        }
        process.exit(code);
    });
}