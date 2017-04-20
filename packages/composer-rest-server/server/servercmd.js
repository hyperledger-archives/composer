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


// const loopback = require('loopback');
const server = require('./server');



process.env.SUPPRESS_NO_CONFIG_WARNING = true;


/**
 * Starts the rest server

 * @param {Object} composer the settings for the Loopback REST server
 * @return {Promise} resolved when server started
 */
function startRestServer(composer){


    // Create the LoopBack application.
    return server(composer)
        .then((app) => {

            // Start the LoopBack application.
            return app.listen(function () {
                app.emit('started');
                let baseUrl = app.get('url').replace(/\/$/, '');
                console.log('Web server listening at: %s', baseUrl);
                /* istanbul ignore next */
                if (app.get('loopback-component-explorer')) {
                    let explorerPath = app.get('loopback-component-explorer').mountPath;
                    console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
                }
            });
        });


}

module.exports.startRestServer = startRestServer;
