'use strict';

const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');
const util        = require('../lib/util');

const loopback = require('loopback');
const boot = require('loopback-boot');

const app = module.exports = loopback();
app.start = function() {

    // start the web server
    return app.listen(function() {
        app.emit('started');
        let baseUrl = app.get('url').replace(/\/$/, '');
        if (app.get('loopback-component-explorer')) {
            let explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// clear the console and display a nice welcome message
clear();
console.log(
  chalk.yellow(
    figlet.textSync('Fabric-Composer', { horizontalLayout: 'full' })
  )
);

// Get details of the server that we want to run
util.getFabricDetails(function(answers)  {
    // augment the app with the extra config that we've just collected
    let ds = {
        'name' : 'Composer',    // not sure this matters
        'connectionProfileName' : answers.profilename,
        'businessNetworkIdentifier' : answers.businessNetworkId,
        'participantId' : answers.userid,
        'participantPwd' : answers.secret
    };
    app.cfg = ds;
    boot(app, __dirname, function(err) {
        if(err) {
            throw err;
        }

        // start the server if `$ node server.js`
        if (require.main === module) {
            app.start();
        }
    });
});








