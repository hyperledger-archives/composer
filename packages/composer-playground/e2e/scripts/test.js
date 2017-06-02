const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const snowWhite = require('sleep');

// Note that this script is called via npm run e2e:main/nobuild and consequently all
// paths are relative to that calling location (two directories up)

let protractorRC = null;

// Start the target test server as a spawned child process
let childServer = spawn('http-server', ['./dist', '-p 3001', '--cors', '--push-state']);

// Execute protractor and attach to listeners
var childProtractor = exec('protractor -- protractor.conf.js');
// Log all output of Protractor run
childProtractor.stdout.on('data', function(data) {
    console.log(data);
});
// Log ony error output
childProtractor.stderr.on('data', function(data) {
    console.log('stdErr: ' + data);
});
// Capture Protactor return code
childProtractor.on('close', function(code) {
    console.log('Return code: ', code);
    childServer.kill();
    process.exit(protractorRC);
});
