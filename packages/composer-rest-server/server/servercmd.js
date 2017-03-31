#!/usr/bin/env node
/*
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const app = module.exports = loopback();

process.env.SUPPRESS_NO_CONFIG_WARNING = true;


/**
 * Starts the rest server
* @param {Object} composer the settings for the Loopback REST server
* @return {Promise} resolved when server started
*/
function startRestServer(composer){

  // Store the composer configuration for the boot script to find
    app.set('composer', composer);

  // boot scripts mount components like REST API
    return new Promise((resolve, reject) => {
        boot(app, __dirname, (error) => {
            if (error) {
                return reject(error);
            }
            resolve(composer);
        });
    })
  .then((composer) => {
  // Set the port if one was specified.


      if (composer.port) {
          app.set('port', composer.port);
      }

      app.start = function () {
        // start the web server
          return app.listen(function () {
              app.emit('started');
              let baseUrl = app.get('url').replace(/\/$/, '');
              console.log('Web server listening at: %s', baseUrl);
              if (app.get('loopback-component-explorer')) {
                  let explorerPath = app.get('loopback-component-explorer').mountPath;
                  console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
              }
          });
      };

  // start the server if `$ node server.js`
      if (require.main === module) {
          app.start();
      }
  });

}

module.exports.startRestServer = startRestServer;
