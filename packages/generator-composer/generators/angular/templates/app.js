/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Mozart - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

//const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

//const username = require('username');

const createConcertoRouter = require('./router');

// configure Express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  next();
});

// mount the client directory at root
app.use(express.static(path.join(__dirname, 'src')));

// mount the root node_modules at node_modules
app.use('/node_modules', express.static(__dirname + '/node_modules'));


const BusinessNetworkConnection = require('@ibm/concerto-client').BusinessNetworkConnection;
let businessNetworkConnection = new BusinessNetworkConnection();

try{
  return createConcertoRouter('<%= connectionProfileName %>', '<%= networkIdentifier %>', '<%= enrollmentId %>', '<%= enrollmentSecret %>')
  .then((router) => {
          // attach the Router to Express
          app.use('/api/v1/', router );
  })
  .then(() => {
    // register a route for static resources
    app.get('/*', (req, res, next) => {
      res.sendFile(__dirname + '/src/index.html');
    });

    // start Express listening on a port
    const server = app.listen(7070, () => {
        console.log('App listening on port 7070');
    });

  });
}
catch(error){console.log(error)}



/**
 * Grabs the text between quotes
 * @param  {string} str - the source string
 * @return {string} the text between quotes or empty string
 */
function extractText( str ){
    let ret = '';

    if ( /'/.test( str ) ){
        ret = str.match( /'(.*?)'/ )[1];
    } else {
        ret = str;
    }

    return ret;
}

/**
 * Process a log message (sends to Websocket and to Splunk)
 * @param  {socker.io} io - WebSocket
 * @param  {string} type - class of log message
 * @param  {object} message - body of log message
 * @private
 */
function log(io, type, message) {
    io.emit(type, message);

    try {
        const assetId = extractText(message);
        message = message.replace(/\'/g, '');

        const payload = {
            message : {
                action : type,
                text : message,
                assetId : assetId
            },
            // Metadata is optional
            metadata: {
                source: 'Mozart',
                sourcetype: 'httpevent',
                index: 'main',
                host: username.sync()
            },
            // Severity is also optional
            severity: 'info',
        };


    }
    catch(error) {
        console.log(error);
    }
}
