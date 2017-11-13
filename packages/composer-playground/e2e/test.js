const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const snowWhite = require('sleep');

// Note that this script is called via npm run e2e:main/nobuild and consequently all
// paths are relative to that calling location (~/composer-playground)

// Start the target test server as a spawned child process in test mode (no npm connections)
let childServer = spawn('node', ['cli.js', '-p', '3001', '-test']);

// Execute protractor and attach to listeners
var childProtractor = exec('webdriver-manager update && protractor -- protractor.conf.js');
// Log all output of Protractor run
childProtractor.stdout.on('data', function(data) {
    // do not log return characters or "green dot progress"
    let msg = data.replace(/\n$/, "");
    msg = msg.replace(/\x1b\[32m.\x1b\[0m/, "");
    if (msg.length) {
        console.log(msg);
    }
});
// Log ony error output
childProtractor.stderr.on('data', function(data) {
    console.log('stdErr: ' + data);
});
// Capture Protactor return code
childProtractor.on('close', function(code) {
    console.log('Protractor return code: ', code);
    if(code !== 0) {
        code = 1;
    }
    console.log('Exit return code: ', code);
    childServer.kill();
    process.exit(code);
});
