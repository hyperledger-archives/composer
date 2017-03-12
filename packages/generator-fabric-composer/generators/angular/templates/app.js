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

//const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('config').get('<%= appName %>');

let connectionProfileName = config.get('connectionProfileName');
let networkIdentifier = config.get('networkIdentifier');
let enrollmentId = config.get('enrollmentId');
let enrollmentSecret = config.get('enrollmentSecret');


const createcomposerRouter = require('./router');

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


const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
let businessNetworkConnection = new BusinessNetworkConnection();

try{
  return createcomposerRouter(connectionProfileName, networkIdentifier, enrollmentId, enrollmentSecret)
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
