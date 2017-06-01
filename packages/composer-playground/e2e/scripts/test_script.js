const cp = require('child_process');
const exec = require('child_process').exec;

// Start the target test servere as a fork child process
let childServer = cp.fork(`server.js`);

var childProtractor = exec('protractor -- protractor.conf.js');
childProtractor.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
});
childProtractor.stderr.on('data', function(data) {
    console.log('stdout: ' + data);
});
childProtractor.on('close', function(code) {
    console.log('closing code: ' + code);
});

// Test process complete, send cleanup message to test server
childServer.send({ cmd: 'cleanup' });
